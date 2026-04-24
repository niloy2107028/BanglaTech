const UserPreference = require("../models/UserPreference");

// Maximum number of keywords we store per user
const MAX_KEYWORDS = 50;
const RECENCY_HALF_LIFE_DAYS = 30;
const MIN_RECENCY_MULTIPLIER = 0.35;
const SOURCE_SCORE_MULTIPLIER = {
  order: 1.35,
  cart: 1.2,
  dwell: 1.15,
  search: 1.05,
  click: 1,
  view: 1,
  seed: 0.8,
};

/**
 * Normalize a keyword:
 * - Convert to string
 * - Lowercase
 * - Remove special characters
 * - Remove extra spaces
 */
function normalizeKeyword(keyword) {
  if (!keyword) return "";
  return String(keyword)
    .toLowerCase()
    .replace(/[^a-z0-9\s&+-]/gi, " ") // remove unwanted characters
    .replace(/\s+/g, " ") // collapse multiple spaces
    .trim(); // remove leading/trailing spaces
}

/**
 * Remove duplicates + remove empty or falsy values
 */
function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

/**
 * Split a search query into useful terms
 * Example: "gaming laptop pro"
 * → ["gaming laptop pro", "gaming", "laptop", "pro"]
 */
function splitSearchTerms(searchText = "") {
  const normalized = normalizeKeyword(searchText);
  if (!normalized) return [];

  const terms = normalized
    .split(" ")
    .map((word) => word.trim())
    .filter((word) => word.length > 2); // ignore very small words

  return unique([normalized, ...terms]); // include full phrase + words
}

/**
 * Extract important keywords from a product
 * Uses:
 * - product name
 * - category
 * - brand
 */
function extractProductKeywords(product) {
  if (!product) return [];

  const categoryName = product.categoryName || product.category?.name;

  const raw = [product.name, categoryName, product.brand];

  return unique(
    raw
      .map(normalizeKeyword) // normalize each field
      .filter(Boolean),
  );
}

/**
 * Merge old keywords with new ones
 * - Increase score if keyword already exists
 * - Add new keyword if not exists
 * - Keep most relevant keywords (top MAX_KEYWORDS)
 */
function mergeKeywords(
  existing = [],
  incoming = [],
  source = "view",
  weight = 1,
) {
  const now = new Date();
  const keywordMap = new Map(); // key = normalized keyword

  // Step 1: Load existing keywords into map
  for (const keyword of existing) {
    const normalizedValue = normalizeKeyword(keyword.value);
    if (!normalizedValue) continue;

    keywordMap.set(normalizedValue, {
      value: normalizedValue,
      source: keyword.source || source,
      score: Number(keyword.score) || 1, // default score = 1
      lastUsedAt: keyword.lastUsedAt || now,
    });
  }

  // Step 2: Merge incoming keywords
  for (const rawKeyword of incoming) {
    const normalizedValue = normalizeKeyword(rawKeyword);
    if (!normalizedValue) continue;

    const current = keywordMap.get(normalizedValue);

    if (current) {
      // If keyword already exists → increase score
      current.score += weight;
      current.lastUsedAt = now;
      current.source = source;
    } else {
      // New keyword → add it
      keywordMap.set(normalizedValue, {
        value: normalizedValue,
        source,
        score: weight,
        lastUsedAt: now,
      });
    }
  }

  // Step 3: Sort keywords by importance
  return [...keywordMap.values()]
    .sort((a, b) => {
      // First priority: higher score
      if (b.score !== a.score) return b.score - a.score;

      // Second priority: more recent
      return new Date(b.lastUsedAt) - new Date(a.lastUsedAt);
    })
    .slice(0, MAX_KEYWORDS); // keep only top N
}

/**
 * Track user behavior (search, click, etc.)
 * Updates keyword preferences in DB
 */
async function trackUserKeywords(
  userId,
  incomingKeywords = [],
  source = "view",
  weight = 1,
) {
  // Normalize + remove duplicates
  const keywords = unique(
    incomingKeywords.map(normalizeKeyword).filter(Boolean),
  );

  if (!userId || keywords.length === 0) return null;

  // Get existing user preferences
  const preference = await UserPreference.findOne({ user: userId });

  // Merge old + new keywords
  const mergedKeywords = mergeKeywords(
    preference?.keywords || [],
    keywords,
    source,
    weight,
  );

  // Save updated keywords (create if not exists)
  return UserPreference.findOneAndUpdate(
    { user: userId },
    { $set: { keywords: mergedKeywords } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
}

/**
 * Escape regex special characters
 * Prevents regex injection issues
 */
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Build case-insensitive regex from keyword
 */
function buildKeywordRegex(keyword) {
  const normalized = normalizeKeyword(keyword);
  if (!normalized) return null;

  return new RegExp(escapeRegex(normalized), "i");
}

function getSourceMultiplier(source) {
  return SOURCE_SCORE_MULTIPLIER[source] || 1;
}

function getRecencyMultiplier(lastUsedAt) {
  const timestamp = new Date(lastUsedAt);
  if (Number.isNaN(timestamp.getTime())) return 1;

  const ageInDays = Math.max(
    0,
    (Date.now() - timestamp.getTime()) / (1000 * 60 * 60 * 24),
  );
  const decay = Math.pow(0.5, ageInDays / RECENCY_HALF_LIFE_DAYS);
  return Math.max(MIN_RECENCY_MULTIPLIER, decay);
}

/**
 * Core scoring function:
 * Calculates how relevant a product is to user keywords
 */
function scoreProductAgainstKeywords(product, keywords = []) {
  // Get category value safely
  const categoryValue =
    product.categoryName || product.category?.name || product.category;

  // Combine all searchable product fields into one string
  const haystack = normalizeKeyword(
    [
      product.name,
      product.brand,
      categoryValue,
      product.description,
      ...(product.specifications ? Object.values(product.specifications) : []),
    ].join(" "),
  );

  if (!haystack) return 0;

  let score = 0;

  // Loop through user keywords
  for (const keywordEntry of keywords) {
    // Handle both string and object format
    const keyword =
      typeof keywordEntry === "string" ? keywordEntry : keywordEntry.value;

    const keywordScore =
      typeof keywordEntry === "string"
        ? 1
        : Math.max(Number(keywordEntry.score) || 1, 1);
    const source =
      typeof keywordEntry === "string"
        ? "seed"
        : String(keywordEntry.source || "view").toLowerCase();
    const sourceMultiplier = getSourceMultiplier(source);
    const recencyMultiplier =
      typeof keywordEntry === "string"
        ? 1
        : getRecencyMultiplier(keywordEntry.lastUsedAt);
    const effectiveKeywordScore =
      keywordScore * sourceMultiplier * recencyMultiplier;

    const normalizedKeyword = normalizeKeyword(keyword);
    if (!normalizedKeyword) continue;

    // If keyword matches product text
    if (haystack.includes(normalizedKeyword)) {
      // Check match strength
      const isExactName = normalizeKeyword(product.name) === normalizedKeyword;

      const isCategory = normalizeKeyword(categoryValue) === normalizedKeyword;

      const isBrand = normalizeKeyword(product.brand) === normalizedKeyword;

      // Assign weighted score
      score +=
        effectiveKeywordScore *
        (isExactName
          ? 6 // strongest
          : isCategory
            ? 5
            : isBrand
              ? 4
              : 2); // weak match
    }
  }

  // Add additional scoring factors

  // Rating boost (max 5)
  score += Math.min(Number(product.rating) || 0, 5) * 0.35;

  // Reviews boost (max 250)
  score += Math.min(Number(product.reviews) || 0, 250) * 0.01;

  // Featured product bonus
  if (product.featured) score += 0.75;

  // In-stock bonus
  if (product.stock > 0) score += 0.5;

  // Return final score rounded to 2 decimals
  return Number(score.toFixed(2));
}

module.exports = {
  MAX_KEYWORDS,
  RECENCY_HALF_LIFE_DAYS,
  normalizeKeyword,
  splitSearchTerms,
  extractProductKeywords,
  mergeKeywords,
  trackUserKeywords,
  buildKeywordRegex,
  getSourceMultiplier,
  getRecencyMultiplier,
  scoreProductAgainstKeywords,
};
