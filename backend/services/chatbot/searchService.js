const Product = require("../../models/Product");
const Category = require("../../models/Category");
const {
  getMiniLmEmbedding,
  getProductSearchText,
} = require("./embeddingService");
const {
  queryMiniLm,
  upsertMiniLmVectors,
} = require("./chromaService");

let vectorIndexReady = false;
let vectorIndexUpdatedAt = 0;
const VECTOR_INDEX_TTL_MS = 5 * 60 * 1000;
let vectorRefreshPromise = null;

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1)
    .slice(0, 8);
}

function countTokenMatches(text, tokens) {
  const haystack = String(text || "").toLowerCase();
  let count = 0;
  for (const token of tokens) {
    if (haystack.includes(token)) {
      count += 1;
    }
  }
  return count;
}

function normalizeSearchQuery(rawQuery) {
  const original = String(rawQuery || "").trim();
  if (!original) return "";

  const normalized = original
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return original;

  const uniqueTokens = Array.from(
    new Set(normalized.split(" ").map((token) => token.trim()).filter(Boolean)),
  );

  return uniqueTokens.join(" ");
}

function scoreProduct(product, queryTokens, categoryTokens) {
  const nameText = String(product.name || "").toLowerCase();
  const brandText = String(product.brand || "").toLowerCase();
  const categoryText = String(product.categoryName || "").toLowerCase();
  const descriptionText = String(product.description || "").toLowerCase();
  const haystack = [nameText, brandText, categoryText, descriptionText].join(" ");

  let score = 0;

  for (const token of queryTokens) {
    if (haystack.includes(token)) score += 5;
    if (nameText.includes(token)) score += 4;
    if (brandText.includes(token)) score += 3;
  }

  for (const token of categoryTokens) {
    if (categoryText.includes(token)) score += 6;
  }

  // Generic coverage boosts: works across all categories without domain-specific hardcoding.
  if (queryTokens.length > 0) {
    const queryCoverageInNameBrand = countTokenMatches(`${nameText} ${brandText}`, queryTokens) / queryTokens.length;
    const queryCoverageInDescription = countTokenMatches(descriptionText, queryTokens) / queryTokens.length;
    score += queryCoverageInNameBrand * 18;
    score += queryCoverageInDescription * 8;
  }

  if (categoryTokens.length > 0) {
    const categoryCoverage = countTokenMatches(categoryText, categoryTokens) / categoryTokens.length;
    score += categoryCoverage * 16;

    // Mild penalty when category is explicitly requested but does not align at all.
    if (categoryCoverage === 0) {
      score -= 4;
    }
  }

  score += Number(product.rating || 0);
  score += Math.min(Number(product.reviews || 0) / 100, 3);

  return score;
}

async function resolveCategoryClause(category) {
  if (!category || !category.trim()) return null;

  const normalizedCategory = String(category || "").trim().toLowerCase();
  const tokens = tokenize(normalizedCategory).slice(0, 4);

  const regexCandidates = [];
  regexCandidates.push(new RegExp(escapeRegExp(normalizedCategory), "i"));
  if (tokens.length > 0) {
    regexCandidates.push(new RegExp(tokens.map((token) => escapeRegExp(token)).join("|"), "i"));
  }

  const matchedCategories = await Category.find({
    $or: regexCandidates.map((rx) => ({ name: rx })),
  })
    .select("_id name")
    .lean();

  const clause = regexCandidates.map((rx) => ({ categoryName: rx }));
  if (matchedCategories.length > 0) {
    clause.push({ category: { $in: matchedCategories.map((cat) => cat._id) } });
  }

  return { $or: clause };
}

async function fallbackMongoSearch({ query, category, limit = 12 }) {
  const safeLimit = Math.min(Math.max(limit, 1), 20);
  const queryText = normalizeSearchQuery(query);
  const categoryText = String(category || "").trim();

  const andClauses = [];
  const categoryClause = await resolveCategoryClause(categoryText);
  if (categoryClause) andClauses.push(categoryClause);

  if (queryText) {
    const textQuery =
      andClauses.length > 0
        ? { $and: [...andClauses, { $text: { $search: queryText } }] }
        : { $text: { $search: queryText } };

    try {
      const textResults = await Product.find(textQuery, {
        score: { $meta: "textScore" },
      })
        .sort({ score: { $meta: "textScore" }, rating: -1, reviews: -1 })
        .limit(safeLimit)
        .lean();

      if (textResults.length > 0) return textResults;
    } catch (error) {
      // Ignore missing index errors and continue to regex fallback.
    }
  }

  const queryTokens = tokenize(queryText);
  const categoryTokens = tokenize(categoryText);

  const fuzzyClauses = [];
  if (queryTokens.length > 0) {
    const tokenPattern = queryTokens.map((token) => escapeRegExp(token)).join("|");
    const tokenRegex = new RegExp(tokenPattern, "i");

    fuzzyClauses.push({ name: tokenRegex });
    fuzzyClauses.push({ brand: tokenRegex });
    fuzzyClauses.push({ categoryName: tokenRegex });
    fuzzyClauses.push({ description: tokenRegex });
  }

  let fallbackQuery = {};
  if (andClauses.length > 0 && fuzzyClauses.length > 0) {
    fallbackQuery = { $and: [...andClauses, { $or: fuzzyClauses }] };
  } else if (andClauses.length > 0) {
    fallbackQuery = { $and: andClauses };
  } else if (fuzzyClauses.length > 0) {
    fallbackQuery = { $or: fuzzyClauses };
  }

  const candidates = await Product.find(fallbackQuery)
    .sort({ featured: -1, rating: -1, reviews: -1 })
    .limit(Math.max(safeLimit * 3, 15))
    .lean();

  if (queryTokens.length === 0 && categoryTokens.length === 0) {
    return candidates.slice(0, safeLimit);
  }

  return candidates
    .map((product) => ({
      ...product,
      _searchScore: scoreProduct(product, queryTokens, categoryTokens),
    }))
    .sort((a, b) => b._searchScore - a._searchScore)
    .slice(0, safeLimit)
    .map(({ _searchScore, ...product }) => product);
}

function mapById(products) {
  return new Map(products.map((product) => [String(product._id), product]));
}

function orderByIds(ids, productMap) {
  const results = [];
  for (const id of ids) {
    const product = productMap.get(String(id));
    if (product) results.push(product);
  }
  return results;
}

async function hydrateProductsByIds(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return [];

  const products = await Product.find({ _id: { $in: ids } }).lean();
  const productMap = mapById(products);
  return orderByIds(ids, productMap);
}

async function buildOrRefreshVectorIndex({ force = false } = {}) {
  const now = Date.now();
  if (!force && vectorIndexReady && now - vectorIndexUpdatedAt < VECTOR_INDEX_TTL_MS) {
    return;
  }

  const products = await Product.find({}).lean();
  if (products.length === 0) {
    vectorIndexReady = true;
    vectorIndexUpdatedAt = now;
    return;
  }

  const minilmVectors = [];
  const vectorProducts = [];
  const documents = [];

  for (const product of products) {
    try {
      const searchText = getProductSearchText(product);
      const minilmEmbedding = await getMiniLmEmbedding(searchText);

      minilmVectors.push(minilmEmbedding);
      vectorProducts.push(product);
      documents.push(searchText);
    } catch (error) {
      // Skip individual products that fail embedding generation.
    }
  }

  if (vectorProducts.length > 0) {
    await upsertMiniLmVectors({
      products: vectorProducts,
      vectors: minilmVectors,
      documents,
    });
  }

  vectorIndexReady = true;
  vectorIndexUpdatedAt = now;
}

function markVectorIndexStale() {
  vectorIndexReady = false;
  vectorIndexUpdatedAt = 0;
}

async function refreshVectorIndexNow() {
  await buildOrRefreshVectorIndex({ force: true });
}

function triggerVectorRefresh() {
  if (vectorRefreshPromise) return vectorRefreshPromise;

  vectorRefreshPromise = refreshVectorIndexNow()
    .catch(() => {
      // Keep app responsive even if embedding providers are temporarily unavailable.
    })
    .finally(() => {
      vectorRefreshPromise = null;
    });

  return vectorRefreshPromise;
}

async function searchByMiniLm({ query, limit = 12 }) {
  const queryText = normalizeSearchQuery(query);
  if (!queryText) return [];

  await buildOrRefreshVectorIndex();
  const embedding = await getMiniLmEmbedding(queryText);
  const vectorHits = await queryMiniLm({ embedding, nResults: limit });
  const ids = vectorHits.map((item) => item.id);
  return hydrateProductsByIds(ids);
}

async function searchProducts({ query, category, limit = 12 }) {
  try {
    const vectorProducts = await searchByMiniLm({ query, limit });
    if (vectorProducts.length > 0) return vectorProducts;
  } catch (error) {
    // Vector retrieval failed, fallback to Mongo retrieval.
  }

  return fallbackMongoSearch({ query, category, limit });
}

module.exports = {
  searchProducts,
  markVectorIndexStale,
  refreshVectorIndexNow,
  triggerVectorRefresh,
};
