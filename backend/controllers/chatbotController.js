const {
  parseIntentAndQuery,
  disambiguateWithHistory,
  generateFlowReply,
  generateGeneralReply,
  generateProductExplanation,
  generateProductComparison,
  generateRecommendationReply,
} = require("../services/chatbot/aiService");
const { transcribeAudioToText } = require("../services/chatbot/voiceService");
const {
  requestImageCaption,
  detectImageIntent,
  generateHistoryIntentReply,
} = require("../services/chatbot/imageService");
const { searchProducts } = require("../services/chatbot/searchService");
const { chatCache, searchCache } = require("../services/chatbot/cacheService");
const Category = require("../models/Category");
const Product = require("../models/Product");
const {
  buildProductCardsPayload,
  formatComparisonFromProducts,
  formatNoResultsMessage,
  formatProductSearchSummary,
  formatProductUseCases,
  formatRecommendationFromProducts,
  selectBestProduct,
} = require("../services/chatbot/formatterService");
const {
  trackUserKeywords,
  splitSearchTerms,
  extractProductKeywords,
} = require("../utils/recommendationKeywords");
const CHATBOT_CACHE_VERSION = process.env.CHATBOT_CACHE_VERSION || "v16";
const CATEGORY_CACHE_TTL_MS = 5 * 60 * 1000;
let cachedCategoryNames = [];
let cachedCategoryAt = 0;

function getBaseUrl(req) {
  const configuredFrontendUrl =
    process.env.FRONTEND_BASE_URL
    || process.env.FRONTEND_URL
    || process.env.CLIENT_BASE_URL
    || process.env.CLIENT_URL;

  if (configuredFrontendUrl && String(configuredFrontendUrl).trim()) {
    return String(configuredFrontendUrl).trim().replace(/\/$/, "");
  }

  return "http://localhost:3000";
}

function makeSearchCacheKey(payload) {
  return JSON.stringify({
    intent: payload.intent || "",
    query: payload.query || "",
    category: payload.category || "",
    limit: payload.limit || 12,
  });
}

function makeChatCacheKey(message, history) {
  return JSON.stringify({
    v: CHATBOT_CACHE_VERSION,
    message: String(message || ""),
    history: Array.isArray(history)
      ? history.slice(-4).map((item) => ({
        role: item?.role,
        content: String(item?.content || ""),
        products: Array.isArray(item?.products) ? item.products.slice(0, 8) : [],
      }))
      : [],
  });
}

async function getCategoryNames() {
  const now = Date.now();
  if (cachedCategoryNames.length > 0 && now - cachedCategoryAt < CATEGORY_CACHE_TTL_MS) {
    return cachedCategoryNames;
  }

  const categories = await Category.find({}).select("name").lean();
  cachedCategoryNames = Array.from(
    new Set(
      categories
        .map((item) => String(item?.name || "").trim())
        .filter(Boolean),
    ),
  ).slice(0, 100);
  cachedCategoryAt = now;

  return cachedCategoryNames;
}

function shouldBypassChatCache(intent) {
  return intent === "compare" || intent === "explain";
}

function chatCacheTtlMsByIntent(intent) {
  if (intent === "compare" || intent === "explain") {
    return 20000;
  }

  return 120000;
}

function applyParsedFallbacks(parsed) {
  const safeParsed = {
    ...parsed,
    needsSearch: Boolean(parsed?.needsSearch),
    mode: ["fresh", "contextual", "casual"].includes(String(parsed?.mode || "").toLowerCase())
      ? String(parsed.mode).toLowerCase()
      : "casual",
    productTitle: String(parsed?.productTitle || "").trim().slice(0, 90),
    productDescription: String(parsed?.productDescription || "").trim().slice(0, 180),
    clarificationNeeded: String(parsed?.clarificationNeeded || "").trim().slice(0, 180),
    action: ["search", "reply_from_context", "clarify"].includes(String(parsed?.action || "").toLowerCase())
      ? String(parsed.action).toLowerCase()
      : (Boolean(parsed?.needsSearch) ? "search" : "reply_from_context"),
    clarifyQuestion: String(parsed?.clarifyQuestion || "").trim().slice(0, 180),
    queryMode: String(parsed?.queryMode || "auto").toLowerCase(),
    categoryConfidence: Number.isFinite(Number(parsed?.categoryConfidence))
      ? Math.min(1, Math.max(0, Number(parsed.categoryConfidence)))
      : 0,
    probableProductName: String(parsed?.probableProductName || "").trim(),
    probableBrand: String(parsed?.probableBrand || "").trim(),
    preferredKeywords: Array.isArray(parsed?.preferredKeywords) ? parsed.preferredKeywords : [],
    avoidKeywords: Array.isArray(parsed?.avoidKeywords) ? parsed.avoidKeywords : [],
    mustInStock: Boolean(parsed?.mustInStock),
    priceMin: Number.isFinite(Number(parsed?.priceMin)) ? Number(parsed.priceMin) : null,
    priceMax: Number.isFinite(Number(parsed?.priceMax)) ? Number(parsed.priceMax) : null,
  };

  return safeParsed;
}

function pickProductMentionedInReply(products, reply) {
  if (!Array.isArray(products) || products.length === 0) return null;
  const text = String(reply || "").toLowerCase();
  if (!text.trim()) return null;

  for (const product of products) {
    const fullName = String(product?.name || "").trim();
    if (!fullName) continue;

    if (text.includes(fullName.toLowerCase())) {
      return product;
    }

    const tokens = fullName
      .toLowerCase()
      .split(/\s+/)
      .filter((token) => token.length > 3);
    if (tokens.length > 0 && tokens.every((token) => text.includes(token))) {
      return product;
    }
  }

  return null;
}

function stripRecommendationSection(reply) {
  const text = String(reply || "").trim();
  if (!text) return text;

  const cleaned = text
    .replace(/\n?\*\*Recommendation:\*\*[\s\S]*$/i, "")
    .replace(/\n?Recommendation:[\s\S]*$/i, "")
    .trim();

  return cleaned || text;
}

function narrowProductsByMessage(products, parsed) {
  if (!Array.isArray(products) || products.length <= 1) return products;
  const query = String(parsed?.query || "").toLowerCase();
  const probableName = String(parsed?.probableProductName || "").toLowerCase();
  const probableBrand = String(parsed?.probableBrand || "").toLowerCase();

  const tokens = `${query} ${probableName} ${probableBrand}`
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2)
    .slice(0, 12);

  if (tokens.length === 0) return products;

  const narrowed = products.filter((product) => {
    const haystack = [product?.name, product?.brand, product?.categoryName, product?.description]
      .join(" ")
      .toLowerCase();
    return tokens.some((token) => haystack.includes(token));
  });

  return narrowed.length > 0 ? narrowed : products;
}

function tokenizeEntityText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2)
    .slice(0, 10);
}

function buildEntitySignals(entities) {
  if (!entities || typeof entities !== "object") {
    return {
      nameBrandTokens: [],
      categoryTokens: [],
      keywordTokens: [],
    };
  }

  const nameBrandTokens = Array.from(new Set([
    ...tokenizeEntityText(entities.probableProductName),
    ...tokenizeEntityText(entities.probableBrand),
  ])).slice(0, 10);

  const categoryTokens = Array.from(new Set(tokenizeEntityText(entities.probableCategory))).slice(0, 8);

  const keywordTokens = Array.from(
    new Set(
      (Array.isArray(entities.keywords) ? entities.keywords : [])
        .flatMap((item) => tokenizeEntityText(item)),
    ),
  ).slice(0, 12);

  return { nameBrandTokens, categoryTokens, keywordTokens };
}

function filterProductsForImageEntities(products, entities) {
  if (!Array.isArray(products) || products.length === 0) return [];

  const signals = buildEntitySignals(entities);
  const hasSignals =
    signals.nameBrandTokens.length > 0
    || signals.categoryTokens.length > 0
    || signals.keywordTokens.length > 0;

  if (!hasSignals) return products;

  const scored = products
    .map((product) => {
      const name = String(product?.name || "").toLowerCase();
      const brand = String(product?.brand || "").toLowerCase();
      const categoryName = String(product?.categoryName || "").toLowerCase();
      const description = String(product?.description || "").toLowerCase();

      let score = 0;

      for (const token of signals.nameBrandTokens) {
        if (name.includes(token)) score += 5;
        if (brand.includes(token)) score += 4;
        if (description.includes(token)) score += 2;
      }

      for (const token of signals.categoryTokens) {
        if (categoryName.includes(token)) score += 5;
        if (description.includes(token)) score += 1;
      }

      for (const token of signals.keywordTokens) {
        if (name.includes(token)) score += 2;
        if (brand.includes(token)) score += 2;
        if (categoryName.includes(token)) score += 1;
        if (description.includes(token)) score += 1;
      }

      return { product, score };
    })
    .sort((a, b) => b.score - a.score);

  const strongestScore = scored[0]?.score || 0;
  if (strongestScore <= 0) {
    return [];
  }

  const threshold = strongestScore >= 6 ? 2 : 1;
  return scored
    .filter((item) => item.score >= threshold)
    .map((item) => item.product);
}

function buildLocalParsedFallback(message, history) {
  return {
    needsSearch: false,
    mode: "casual",
    productTitle: "",
    productDescription: "",
    clarificationNeeded: "",
    action: "reply_from_context",
    clarifyQuestion: "",
    intent: "general",
    queryMode: "auto",
    query: String(message || "").trim().slice(0, 120),
    category: "",
    categoryConfidence: 0,
    probableProductName: "",
    probableBrand: "",
    preferredKeywords: [],
    avoidKeywords: [],
    budgetMax: null,
    mustInStock: false,
    priceMin: null,
    priceMax: null,
  };
}

async function refineParsedWithDisambiguation({
  message,
  history,
  parsed,
  hasShownProducts,
}) {
  if (!parsed || typeof parsed !== "object") return buildLocalParsedFallback(message, history);
  if (parsed.needsSearch) return parsed;

  try {
    const disambiguated = await disambiguateWithHistory({
      message,
      history,
      parsed,
      hasShownProducts,
    });

    const action = String(disambiguated?.action || "").toLowerCase();
    const intent = String(disambiguated?.intent || "").toLowerCase();
    const queryMode = String(disambiguated?.queryMode || "").toLowerCase();
    const shouldSearch = action === "search" || intent === "search" || intent === "recommendation";
    if (!shouldSearch) return parsed;

    const mode = queryMode === "contextual" && hasShownProducts ? "contextual" : "fresh";

    return {
      ...parsed,
      needsSearch: true,
      mode,
      intent: "search",
      action: "search",
      queryMode: mode === "contextual" ? "contextual" : "fresh",
      query: String(parsed.query || message || "").trim().slice(0, 120),
    };
  } catch (error) {
    return parsed;
  }
}

function tokenizeMessageForCatalogMatch(message) {
  return String(message || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 4)
    .slice(0, 8);
}

async function inferCatalogSearchIntent(message) {
  const tokens = tokenizeMessageForCatalogMatch(message);
  if (tokens.length === 0) return false;

  const tokenPattern = tokens
    .map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");

  if (!tokenPattern) return false;
  const tokenRegex = new RegExp(tokenPattern, "i");

  const [categoryHit, productHit] = await Promise.all([
    Category.findOne({ name: tokenRegex }).select("_id").lean(),
    Product.findOne({
      $or: [
        { name: tokenRegex },
        { brand: tokenRegex },
        { categoryName: tokenRegex },
      ],
    })
      .select("_id")
      .lean(),
  ]);

  return Boolean(categoryHit || productHit);
}

function extractLatestProductIdsFromHistory(history) {
  if (!Array.isArray(history) || history.length === 0) return [];

  for (let index = history.length - 1; index >= 0; index -= 1) {
    const item = history[index];
    if (!item || item.role !== "assistant" || !Array.isArray(item.products)) continue;

    const ids = item.products
      .map((value) => String(value || "").trim())
      .filter(Boolean)
      .slice(0, 8);

    const uniqueIds = Array.from(new Set(ids));
    if (uniqueIds.length > 0) return uniqueIds;
  }

  return [];
}

async function resolveProductsFromHistory(history) {
  const ids = extractLatestProductIdsFromHistory(history);
  if (ids.length === 0) return [];

  const products = await Product.find({
    _id: { $in: ids },
  }).lean();

  const byId = new Map(products.map((product) => [String(product._id), product]));
  return ids.map((id) => byId.get(id)).filter(Boolean);
}

async function collectLastTwoProductsFromHistory(history) {
  const resolved = await resolveProductsFromHistory(history);
  return dedupeProducts(resolved).slice(0, 2);
}

function dedupeProducts(products) {
  if (!Array.isArray(products)) return [];
  const seen = new Set();
  const unique = [];

  for (const product of products) {
    const id = String(product?._id || product?.id || "").trim();
    const name = String(product?.name || "").trim().toLowerCase();
    const key = id || name;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(product);
  }

  return unique;
}

function applyParsedConstraints(products, parsed) {
  let result = dedupeProducts(products);
  if (!parsed || typeof parsed !== "object") return result;

  const probableName = String(parsed.probableProductName || "").toLowerCase().trim();
  const probableBrand = String(parsed.probableBrand || "").toLowerCase().trim();
  const category = String(parsed.category || "").toLowerCase().trim();
  const mustInStock = Boolean(parsed.mustInStock);
  const priceMin = Number.isFinite(Number(parsed.priceMin)) ? Number(parsed.priceMin) : null;
  const priceMax = Number.isFinite(Number(parsed.priceMax)) ? Number(parsed.priceMax) : null;

  const avoidKeywords = Array.isArray(parsed.avoidKeywords)
    ? parsed.avoidKeywords.map((value) => String(value || "").toLowerCase()).filter(Boolean)
    : [];
  const preferredKeywords = Array.isArray(parsed.preferredKeywords)
    ? parsed.preferredKeywords.map((value) => String(value || "").toLowerCase()).filter(Boolean)
    : [];

  if (avoidKeywords.length > 0) {
    result = result.filter((product) => {
      const haystack = [
        product?.name,
        product?.brand,
        product?.categoryName,
        product?.description,
        JSON.stringify(product?.specifications || {}),
      ]
        .join(" ")
        .toLowerCase();

      return !avoidKeywords.some((keyword) => haystack.includes(keyword));
    });
  }

  if (preferredKeywords.length > 0 && result.length > 1) {
    result = [...result].sort((a, b) => {
      const textA = [a?.name, a?.brand, a?.categoryName, a?.description]
        .join(" ")
        .toLowerCase();
      const textB = [b?.name, b?.brand, b?.categoryName, b?.description]
        .join(" ")
        .toLowerCase();

      const scoreA = preferredKeywords.reduce((acc, keyword) => acc + (textA.includes(keyword) ? 1 : 0), 0);
      const scoreB = preferredKeywords.reduce((acc, keyword) => acc + (textB.includes(keyword) ? 1 : 0), 0);
      if (scoreB !== scoreA) return scoreB - scoreA;

      return Number(b?.rating || 0) - Number(a?.rating || 0);
    });
  }

  if (parsed.budgetMax && Number.isFinite(Number(parsed.budgetMax))) {
    const budget = Number(parsed.budgetMax);
    const budgetFiltered = result.filter((product) => Number(product?.price || 0) <= budget);
    if (budgetFiltered.length > 0) {
      result = budgetFiltered;
    }
  }

  if (priceMin !== null) {
    const filtered = result.filter((product) => Number(product?.price || 0) >= priceMin);
    if (filtered.length > 0) {
      result = filtered;
    }
  }

  if (priceMax !== null) {
    const filtered = result.filter((product) => Number(product?.price || 0) <= priceMax);
    if (filtered.length > 0) {
      result = filtered;
    }
  }

  if (mustInStock) {
    const inStockFiltered = result.filter((product) => Boolean(product?.inStock));
    if (inStockFiltered.length > 0) {
      result = inStockFiltered;
    }
  }

  if (probableBrand) {
    const filtered = result.filter((product) => {
      const brand = String(product?.brand || "").toLowerCase();
      return brand.includes(probableBrand) || probableBrand.includes(brand);
    });

    if (filtered.length > 0) {
      result = filtered;
    }
  }

  if (category) {
    const categoryTokens = category.split(/\s+/).filter((token) => token.length > 1);
    const filtered = result.filter((product) => {
      const categoryName = String(product?.categoryName || "").toLowerCase();
      if (categoryName.includes(category) || category.includes(categoryName)) {
        return true;
      }

      if (categoryTokens.length === 0) return false;
      return categoryTokens.some((token) => categoryName.includes(token));
    });

    if (filtered.length > 0) {
      result = filtered;
    }
  }

  if (probableName) {
    const nameTokens = probableName.split(/\s+/).filter((token) => token.length > 2).slice(0, 6);
    if (nameTokens.length > 0) {
      const filtered = result.filter((product) => {
        const name = String(product?.name || "").toLowerCase();
        const description = String(product?.description || "").toLowerCase();
        const haystack = `${name} ${description}`;
        return nameTokens.some((token) => haystack.includes(token));
      });

      if (filtered.length > 0) {
        result = filtered;
      }
    }
  }

  return result;
}

async function runProductSearch(parsed, limit = 12) {
  const cacheKey = makeSearchCacheKey({ ...parsed, limit });
  const cached = searchCache.get(cacheKey);
  if (cached) return cached;

  const query = parsed.query || "";
  const category = parsed.category || "";

  const products = await searchProducts({ query, category, limit });
  searchCache.set(cacheKey, products);

  return products;
}

function buildDeterministicSearchPayload(parsed, fallbackMessage) {
  const intent = parsed?.intent || "search";
  const probableName = String(parsed?.probableProductName || "").trim();
  const probableBrand = String(parsed?.probableBrand || "").trim();
  const category = String(parsed?.category || "").trim();
  const baseQuery = String(parsed?.query || "").trim();
  const preferred = Array.isArray(parsed?.preferredKeywords) ? parsed.preferredKeywords : [];

  const parts = [baseQuery, probableName, probableBrand, ...preferred]
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  const query = Array.from(new Set(parts.join(" ").split(/\s+/).filter(Boolean)))
    .slice(0, 16)
    .join(" ");

  return {
    intent,
    query: query || String(fallbackMessage || "").trim(),
    category,
  };
}

function buildRecommendationTrackingKeywords(searchText, products) {
  const searchTerms = splitSearchTerms(String(searchText || "")).slice(0, 16);
  const productTerms = dedupeProducts(products)
    .slice(0, 8)
    .flatMap((product) => extractProductKeywords(product));

  return Array.from(
    new Set(
      [...searchTerms, ...productTerms]
        .map((value) => String(value || "").trim())
        .filter(Boolean),
    ),
  ).slice(0, 24);
}

async function trackChatbotRecommendationSignals({
  req,
  searchText,
  products,
  source = "search",
  weight = 2,
}) {
  const userId = req?.user?._id;
  if (!userId) return;

  const keywords = buildRecommendationTrackingKeywords(searchText, products);
  if (keywords.length === 0) return;

  try {
    await trackUserKeywords(userId, keywords, source, weight);
  } catch (error) {
    // Do not fail chatbot responses because recommendation tracking failed.
  }
}

exports.getChatResponse = async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || !String(message).trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    const categoryNames = await getCategoryNames();
    const hasShownProducts = extractLatestProductIdsFromHistory(history).length > 0;

    let parsed;
    try {
      parsed = await parseIntentAndQuery({
        message,
        history,
        categories: categoryNames,
        hasShownProducts,
      });
    } catch (error) {
      parsed = buildLocalParsedFallback(message, history);
    }

    parsed = applyParsedFallbacks(parsed);
    parsed = await refineParsedWithDisambiguation({
      message,
      history,
      parsed,
      hasShownProducts,
    });

    if (!parsed.needsSearch) {
      try {
        const inferredSearchIntent = await inferCatalogSearchIntent(message);
        if (inferredSearchIntent) {
          parsed = {
            ...parsed,
            needsSearch: true,
            mode: "fresh",
            intent: "search",
            action: "search",
            queryMode: "fresh",
            query: String(parsed.query || message || "").trim().slice(0, 120),
          };
        }
      } catch (error) {
        // Keep chat responsive when fallback intent inference fails.
      }
    }

    const bypassCache = shouldBypassChatCache(parsed.intent);

    const chatCacheKey = makeChatCacheKey(message, history);
    if (!bypassCache) {
      const cachedReply = chatCache.get(chatCacheKey);
      if (cachedReply) {
        if (parsed.needsSearch || String(cachedReply?.intent || "").toLowerCase() === "search") {
          await trackChatbotRecommendationSignals({
            req,
            searchText: String(parsed.query || message || "").trim(),
            products: cachedReply?.products || [],
            source: "search",
            weight: 2,
          });
        }
        return res.json(cachedReply);
      }
    }

    if (parsed.clarificationNeeded) {
      const payload = {
        reply: parsed.clarificationNeeded,
        intent: parsed.intent,
        parsed,
        products: [],
        cards: [],
      };

      if (!bypassCache) {
        chatCache.set(chatCacheKey, payload, chatCacheTtlMsByIntent(parsed.intent));
      }
      return res.json(payload);
    }

    let products = [];
    if (parsed.needsSearch) {
      const searchPayload = {
        intent: "search",
        query: String(parsed.query || message || "").trim(),
        category: String(parsed.category || "").trim(),
      };
      products = await runProductSearch(searchPayload, 12);
      products = applyParsedConstraints(products, {
        probableProductName: parsed.productTitle,
        category: parsed.category,
      });

      await trackChatbotRecommendationSignals({
        req,
        searchText: searchPayload.query,
        products,
        source: "search",
        weight: 2,
      });
    } else if (parsed.mode === "contextual" && hasShownProducts) {
      products = applyParsedConstraints(await resolveProductsFromHistory(history), {
        probableProductName: parsed.productTitle,
        category: parsed.category,
      });
    }

    let reply = "";
    try {
      reply = await generateFlowReply({ message, history, parsed, products });
    } catch (error) {
      reply = "";
    }

    if (!reply || !String(reply).trim()) {
      if (parsed.needsSearch) {
        reply = formatProductSearchSummary(products, message);
      } else {
        try {
          reply = await generateGeneralReply({ message, history });
        } catch (error) {
          reply = "Hello! How can I help you today?";
        }
      }
    }

    const cards = parsed.needsSearch ? buildProductCardsPayload(products, getBaseUrl(req)) : [];
    const replyText = String(reply || "").trim();

    const flowPayload = {
      reply: replyText,
      intent: parsed.needsSearch ? "search" : "general",
      parsed,
      products,
      cards,
    };

    if (!bypassCache) {
      chatCache.set(chatCacheKey, flowPayload, chatCacheTtlMsByIntent(flowPayload.intent));
    }
    return res.json(flowPayload);
  } catch (error) {
    console.error("Chatbot Error:", error);
    return res.status(500).json({
      reply: "Sorry, I cannot respond right now.",
      error: "Chat service failed",
    });
  }
};

exports.voiceSearch = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Audio file is required" });
    }

    const categoryNames = await getCategoryNames();

    const transcript = await transcribeAudioToText(req.file);
    const parsed = await parseIntentAndQuery({
      message: transcript,
      history: [],
      categories: categoryNames,
    });

    if (parsed.clarificationNeeded) {
      return res.json({
        reply: parsed.clarificationNeeded,
        transcript,
        intent: "general",
        parsed,
        products: [],
        cards: [],
      });
    }

    if (!parsed.needsSearch) {
      let reply = "";
      try {
        reply = await generateFlowReply({
          message: transcript,
          history: [],
          parsed,
          products: [],
        });
      } catch (error) {
        reply = "";
      }

      return res.json({
        reply: reply || "বুঝেছি। বলুন কোন ধরনের product খুঁজছেন, আমি help করছি।",
        transcript,
        intent: "general",
        parsed,
        products: [],
        cards: [],
      });
    }

    const searchPayload = {
      intent: "search",
      query: parsed.query || transcript,
      category: parsed.category || "",
    };

    const products = await runProductSearch(
      buildDeterministicSearchPayload(
        {
          ...parsed,
          intent: searchPayload.intent,
          query: searchPayload.query,
          category: searchPayload.category,
        },
        transcript,
      ),
      12,
    );
    const uniqueProducts = applyParsedConstraints(products, parsed);
    const reply = formatProductSearchSummary(uniqueProducts, transcript);

    await trackChatbotRecommendationSignals({
      req,
      searchText: searchPayload.query,
      products: uniqueProducts,
      source: "search",
      weight: 2,
    });

    return res.json({
      reply,
      transcript,
      intent: "search",
      parsed,
      products: uniqueProducts,
      cards: buildProductCardsPayload(uniqueProducts, getBaseUrl(req)),
    });
  } catch (error) {
    console.error("Voice Search Error:", error);
    const status = Number(error?.status || 0);
    const errorMessage = String(error?.message || "");

    if ([400, 401, 403, 429].includes(status)) {
      return res.status(status).json({
        reply: "Voice search is temporarily unavailable. Please try again later.",
        error: "Voice search provider unavailable",
      });
    }

    if (status === 503 || errorMessage.includes("HUGGINGFACE_API_KEY")) {
      return res.status(503).json({
        reply: "Voice search is not configured yet. Please set the voice API key and try again.",
        error: "Voice search configuration missing",
      });
    }

    return res.status(500).json({
      reply: formatNoResultsMessage(),
      error: "Voice search failed",
    });
  }
};

exports.imageSearch = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image file is required" });
    }

    const prompt = String(req.body?.prompt || "").trim();
    let history = [];
    if (Array.isArray(req.body?.history)) {
      history = req.body.history;
    } else if (typeof req.body?.history === "string") {
      try {
        const parsedHistory = JSON.parse(req.body.history);
        history = Array.isArray(parsedHistory) ? parsedHistory : [];
      } catch (error) {
        history = [];
      }
    }
    const categoryNames = await getCategoryNames();

    const captionResult = await requestImageCaption(req.file, prompt, {
      categories: categoryNames,
    });

    let resolvedImageIntent = "search";
    try {
      const intentResult = await detectImageIntent({
        prompt,
        history,
        caption: captionResult.caption,
      });
      resolvedImageIntent = String(intentResult?.intent || "").trim().toLowerCase() || "search";
    } catch (error) {
      resolvedImageIntent = prompt ? "search" : "explain";
    }

    if (resolvedImageIntent === "greet") {
      let greetReply = "";
      try {
        greetReply = await generateGeneralReply({ message: prompt || "hi", history });
      } catch (error) {
        greetReply = "Hello! How can I help you today?";
      }

      return res.json({
        reply: greetReply,
        caption: captionResult.caption,
        model: captionResult.model,
        parserModel: captionResult.parserModel,
        entities: captionResult.entities || {},
        intent: "greet",
        historyUsed: history.length,
        parsed: {},
        products: [],
        cards: [],
      });
    }

    if (resolvedImageIntent === "explain") {
      return res.json({
        reply: `Image summary: ${captionResult.caption}`,
        caption: captionResult.caption,
        model: captionResult.model,
        parserModel: captionResult.parserModel,
        entities: captionResult.entities || {},
        intent: "explain",
        historyUsed: history.length,
        parsed: null,
        products: [],
        cards: [],
      });
    }

    if (["compare", "recommend", "followup"].includes(resolvedImageIntent)) {
      const recentProducts = await collectLastTwoProductsFromHistory(history);
      const historyReply = await generateHistoryIntentReply({
        prompt,
        products: recentProducts,
      });

      return res.json({
        intent: resolvedImageIntent,
        reply: historyReply,
      });
    }

    const combinedQuery = String(captionResult.searchQuery || "").trim();

    if (!combinedQuery) {
      return res.status(422).json({
        reply: "Sorry couldn't understand the image provided.",
        caption: captionResult.caption,
        model: captionResult.model,
        parserModel: captionResult.parserModel,
        entities: captionResult.entities || {},
        intent: "search",
        products: [],
        cards: [],
      });
    }

    const parsed = {
      intent: "search",
      query: combinedQuery,
      category: String(captionResult?.entities?.probableCategory || "").trim(),
    };

    const products = await runProductSearch(parsed, 12);
    const constrainedProducts = applyParsedConstraints(products, parsed);
    const uniqueProducts = filterProductsForImageEntities(constrainedProducts, captionResult.entities);

    await trackChatbotRecommendationSignals({
      req,
      searchText: combinedQuery,
      products: uniqueProducts,
      source: "search",
      weight: 2,
    });

    return res.json({
      reply: formatProductSearchSummary(uniqueProducts, combinedQuery),
      caption: captionResult.caption,
      model: captionResult.model,
      parserModel: captionResult.parserModel,
      entities: captionResult.entities || {},
      intent: "search",
      historyUsed: history.length,
      parsed,
      products: uniqueProducts,
      cards: buildProductCardsPayload(uniqueProducts, getBaseUrl(req)),
    });
  } catch (error) {
    console.error("Image Search Error:", error);
    const status = Number(error?.status || 0);

    if ([400, 401, 403, 404, 429, 503].includes(status)) {
      return res.status(status).json({
        reply: "Image search provider is currently unavailable. Please try again.",
        error: "Image search provider unavailable",
      });
    }

    return res.status(500).json({
      reply: "Image search failed. Please try another image.",
      error: "Image search failed",
    });
  }
};

