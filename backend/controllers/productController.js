const mongoose = require("mongoose");
const Product = require("../models/Product");
const Category = require("../models/Category");
const Order = require("../models/Order");
const UserPreference = require("../models/UserPreference");
const { invalidateChatbotCaches } = require("../services/chatbot/cacheService");
const {
  VIEWER_TTL_MS,
  touchViewer,
  removeViewer,
  getViewerCount,
} = require("../services/liveViewerService");
const {
  markVectorIndexStale,
  triggerVectorRefresh,
} = require("../services/chatbot/searchService");
const {
  trackUserKeywords,
  splitSearchTerms,
  extractProductKeywords,
  scoreProductAgainstKeywords,
} = require("../utils/recommendationKeywords");
const {
  buildSearchVocabulary,
  buildSearchQuery,
  suggestSearchCorrection,
  normalizeText,
} = require("../utils/searchCorrection");

const MIN_DWELL_MS = 5000;
const MAX_DWELL_MS = 10 * 60 * 1000;

function onCatalogMutation() {
  invalidateChatbotCaches();
  markVectorIndexStale();
  triggerVectorRefresh();
}

async function resolveCategoryFilter(category) {
  if (!category) return null;
  const categoryDoc = await Category.findOne({ name: category });
  return categoryDoc?._id || null;
}

async function fetchProductsWithQuery(query, pageNumber, limit) {
  const products = await Product.find(query)
    .populate("category", "name")
    .populate("seller", "name email")
    .sort({ createdAt: -1 })
    .skip((pageNumber - 1) * limit)
    .limit(limit);

  const total = await Product.countDocuments(query);

  return { products, total };
}

async function findProductForTracking(productId) {
  return Product.findById(productId).populate("category", "name");
}

function resolveDwellWeight(dwellMs) {
  if (dwellMs >= 180000) return 4;
  if (dwellMs >= 60000) return 3;
  if (dwellMs >= 20000) return 2;
  return 1;
}

async function getSoldCountMap(productIds = []) {
  const uniqueIds = Array.from(
    new Set(
      productIds
        .map((id) => String(id || "").trim())
        .filter((id) => mongoose.Types.ObjectId.isValid(id)),
    ),
  );

  if (uniqueIds.length === 0) {
    return new Map();
  }

  const objectIds = uniqueIds.map((id) => new mongoose.Types.ObjectId(id));
  const aggregates = await Order.aggregate([
    {
      $match: {
        "orderItems.product": { $in: objectIds },
      },
    },
    { $unwind: "$orderItems" },
    {
      $match: {
        "orderItems.product": { $in: objectIds },
        "orderItems.status": { $ne: "Cancelled" },
      },
    },
    {
      $group: {
        _id: "$orderItems.product",
        soldCount: { $sum: { $ifNull: ["$orderItems.qty", 0] } },
      },
    },
  ]);

  const soldCountMap = new Map();
  for (const row of aggregates) {
    soldCountMap.set(String(row?._id || ""), Number(row?.soldCount || 0));
  }
  return soldCountMap;
}

function attachSoldCounts(products = [], soldCountMap = new Map()) {
  return products.map((product) => {
    const plain = typeof product?.toObject === "function"
      ? product.toObject()
      : { ...product };
    const key = String(plain?._id || "");
    plain.soldCount = Number(soldCountMap.get(key) || 0);
    return plain;
  });
}

function resolveViewerToken(req) {
  const tokenFromBody = String(req.body?.viewerToken || "").trim();
  const tokenFromQuery = String(req.query?.viewerToken || "").trim();
  const tokenFromHeader = String(req.headers?.["x-viewer-token"] || "").trim();
  return tokenFromBody || tokenFromQuery || tokenFromHeader;
}

function resolveViewerKey(req) {
  const viewerToken = resolveViewerToken(req);
  if (viewerToken) {
    return `viewer:${viewerToken.slice(0, 120)}`;
  }

  if (req.user?._id) {
    return `user:${String(req.user._id)}`;
  }

  const remoteIp = String(
    req.headers?.["x-forwarded-for"] || req.ip || req.connection?.remoteAddress || "",
  ).slice(0, 80);
  const userAgent = String(req.headers?.["user-agent"] || "").slice(0, 80);

  if (!remoteIp && !userAgent) {
    return "";
  }

  return `guest:${remoteIp}|${userAgent}`;
}

async function ensureTrackableProduct(productId, res) {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    res.status(400).json({
      success: false,
      message: "Invalid product id",
    });
    return false;
  }

  const exists = await Product.exists({ _id: productId });
  if (!exists) {
    res.status(404).json({
      success: false,
      message: "Product not found",
    });
    return false;
  }

  return true;
}

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getAllProducts = async (req, res) => {
  try {
    const { search, category, categoryName, featured, page = 1 } = req.query;
    const limit = 15;
    const pageNumber = Math.max(Number(page) || 1, 1);
    const baseQuery = {};
    const categoryFilter = category || categoryName;

    if (categoryFilter) {
      const categoryId = await resolveCategoryFilter(categoryFilter);
      if (categoryId) {
        baseQuery.category = categoryId;
      } else {
        baseQuery.categoryName = { $regex: categoryFilter, $options: "i" };
      }
    }

    if (featured === "true") {
      baseQuery.featured = true;
    }

    const originalSearch = String(search || "").trim();

    if (!originalSearch) {
      const { products, total } = await fetchProductsWithQuery(
        baseQuery,
        pageNumber,
        limit,
      );
      const soldCountMap = await getSoldCountMap(products.map((p) => p?._id));
      const enrichedProducts = attachSoldCounts(products, soldCountMap);

      return res.json({
        success: true,
        count: enrichedProducts.length,
        total,
        page: pageNumber,
        pages: Math.ceil(total / limit),
        data: enrichedProducts,
        searchMeta: null,
      });
    }

    const originalQuery = {
      ...baseQuery,
      ...buildSearchQuery(originalSearch),
    };

    const originalResult = await fetchProductsWithQuery(
      originalQuery,
      pageNumber,
      limit,
    );
    const originalSoldCountMap = await getSoldCountMap(
      originalResult.products.map((p) => p?._id),
    );
    const originalEnrichedProducts = attachSoldCounts(
      originalResult.products,
      originalSoldCountMap,
    );

    const vocabularyProducts = await Product.find(baseQuery)
      .select("name brand categoryName description")
      .lean();
    const vocabulary = buildSearchVocabulary(vocabularyProducts);
    const suggestion = suggestSearchCorrection(originalSearch, vocabulary);

    let didYouMean = suggestion.changed ? suggestion.correctedQuery : null;

    if (suggestion.changed && normalizeText(suggestion.correctedQuery)) {
      const correctedQuery = {
        ...baseQuery,
        ...buildSearchQuery(suggestion.correctedQuery),
      };
      const correctedResult = await fetchProductsWithQuery(
        correctedQuery,
        pageNumber,
        limit,
      );

      didYouMean = correctedResult.total > 0 ? suggestion.correctedQuery : null;
    }

    res.json({
      success: true,
      count: originalEnrichedProducts.length,
      total: originalResult.total,
      page: pageNumber,
      pages: Math.ceil(originalResult.total / limit),
      data: originalEnrichedProducts,
      searchMeta: {
        originalQuery: originalSearch,
        correctedQuery: suggestion.changed ? suggestion.correctedQuery : null,
        appliedQuery: originalSearch,
        wasCorrected: false,
        didYouMean,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching products",
      error: error.message,
    });
  }
};

// @desc    Get personalized recommendations for logged in user
// @route   GET /api/products/recommendations
// @access  Private
exports.getRecommendedProducts = async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 8, 1), 20);
    const preference = await UserPreference.findOne({ user: req.user._id });
    const keywords = preference?.keywords || [];

    if (keywords.length === 0) {
      return res.json({
        success: true,
        personalized: false,
        keywords: [],
        data: [],
      });
    }

    const allProducts = await Product.find({ stock: { $gt: 0 } })
      .populate("category", "name")
      .populate("seller", "name email");

    const scoredProducts = allProducts
      .map((product) => ({
        product,
        recommendationScore: scoreProductAgainstKeywords(
          product.toObject(),
          keywords,
        ),
      }))
      .filter((entry) => entry.recommendationScore > 0)
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, limit)
      .map((entry) => ({
        ...entry.product.toObject(),
        recommendationScore: entry.recommendationScore,
      }));

    const soldCountMap = await getSoldCountMap(scoredProducts.map((p) => p?._id));
    const enrichedProducts = scoredProducts.map((product) => ({
      ...product,
      soldCount: Number(soldCountMap.get(String(product?._id || "")) || 0),
    }));

    res.json({
      success: true,
      personalized: enrichedProducts.length > 0,
      keywords: keywords.slice(0, 10).map((item) => item.value),
      data: enrichedProducts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching recommendations",
      error: error.message,
    });
  }
};

// @desc    Track search keywords for recommendation profile
// @route   POST /api/products/recommendations/track-search
// @access  Private
exports.trackSearchKeywords = async (req, res) => {
  try {
    const keywords = splitSearchTerms(req.body.search || "");
    const preference = await trackUserKeywords(
      req.user._id,
      keywords,
      "search",
      2,
    );

    res.json({
      success: true,
      message: "Search preferences updated",
      keywords: preference?.keywords?.slice(0, 10) || [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error tracking search keywords",
      error: error.message,
    });
  }
};

// @desc    Track a product view for recommendation profile
// @route   POST /api/products/:id/track-view
// @access  Private
exports.trackProductClick = async (req, res) => {
  try {
    const product = await findProductForTracking(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const preference = await trackUserKeywords(
      req.user._id,
      extractProductKeywords(product),
      "click",
      1,
    );

    res.json({
      success: true,
      message: "Product click tracked",
      keywords: preference?.keywords?.slice(0, 10) || [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error tracking product click",
      error: error.message,
    });
  }
};

// @desc    Track product dwell time for recommendation profile
// @route   POST /api/products/:id/track-dwell
// @access  Private
exports.trackProductDwell = async (req, res) => {
  try {
    const rawDwellMs = Number(req.body?.dwellMs);
    if (!Number.isFinite(rawDwellMs) || rawDwellMs <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid dwellMs is required",
      });
    }

    const dwellMs = Math.min(Math.max(Math.round(rawDwellMs), 0), MAX_DWELL_MS);

    if (dwellMs < MIN_DWELL_MS) {
      return res.json({
        success: true,
        tracked: false,
        message: "Dwell time below tracking threshold",
      });
    }

    const product = await findProductForTracking(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const dwellWeight = resolveDwellWeight(dwellMs);
    const preference = await trackUserKeywords(
      req.user._id,
      extractProductKeywords(product),
      "dwell",
      dwellWeight,
    );

    return res.json({
      success: true,
      tracked: true,
      message: "Product dwell tracked",
      dwellMs,
      dwellWeight,
      keywords: preference?.keywords?.slice(0, 10) || [],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error tracking product dwell",
      error: error.message,
    });
  }
};

// @desc    Ping current product viewer presence
// @route   POST /api/products/:id/viewers/ping
// @access  Public
exports.pingProductViewer = async (req, res) => {
  try {
    const productId = String(req.params.id || "");
    const canTrack = await ensureTrackableProduct(productId, res);
    if (!canTrack) return;

    const viewerKey = resolveViewerKey(req);
    if (!viewerKey) {
      return res.status(400).json({
        success: false,
        message: "viewerToken is required for anonymous viewers.",
      });
    }

    const viewingNow = await touchViewer(productId, viewerKey);

    return res.json({
      success: true,
      data: {
        viewingNow,
        heartbeatTtlMs: VIEWER_TTL_MS,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error tracking live viewers",
      error: error.message,
    });
  }
};

// @desc    Remove current viewer from live presence
// @route   POST /api/products/:id/viewers/leave
// @access  Public
exports.leaveProductViewer = async (req, res) => {
  try {
    const productId = String(req.params.id || "");
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product id",
      });
    }

    const viewerKey = resolveViewerKey(req);
    if (!viewerKey) {
      return res.status(400).json({
        success: false,
        message: "viewerToken is required for anonymous viewers.",
      });
    }

    const viewingNow = await removeViewer(productId, viewerKey);
    return res.json({
      success: true,
      data: {
        viewingNow,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error removing live viewer",
      error: error.message,
    });
  }
};

// @desc    Get current live viewer count for a product
// @route   GET /api/products/:id/viewers
// @access  Public
exports.getProductViewerCount = async (req, res) => {
  try {
    const productId = String(req.params.id || "");
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product id",
      });
    }

    const viewingNow = await getViewerCount(productId);
    return res.json({
      success: true,
      data: {
        viewingNow,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching live viewers",
      error: error.message,
    });
  }
};

exports.trackProductView = exports.trackProductClick;

// @desc    Get products owned by logged-in seller
// @route   GET /api/products/mine
// @access  Private (seller/admin)
exports.getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user.id })
      .populate("category", "name")
      .populate("seller", "name email role")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching seller products",
      error: error.message,
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("category", "name")
      .populate("seller", "name email");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching product",
      error: error.message,
    });
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private
exports.createProduct = async (req, res) => {
  try {
    req.body.seller = req.user.id;

    if (req.body.category) {
      const category = await Category.findById(req.body.category);
      if (category) {
        req.body.categoryName = category.name;
      }
    }

    const product = await Product.create(req.body);
    await product.populate("category", "name");
    await product.populate("seller", "name email role");

    onCatalogMutation();

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error creating product",
      error: error.message,
    });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const isOwner =
      product.seller && product.seller.toString() === req.user._id.toString();

    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only the product owner can update this product",
      });
    }

    if (req.user.role !== "admin") {
      delete req.body.seller;
    }

    if (req.body.category) {
      const category = await Category.findById(req.body.category);
      if (category) {
        req.body.categoryName = category.name;
      }
    }

    Object.assign(product, req.body);
    await product.save();
    await product.populate("category", "name");
    await product.populate("seller", "name email role");

    onCatalogMutation();

    res.json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error updating product",
      error: error.message,
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const isOwner =
      product.seller && product.seller.toString() === req.user._id.toString();

    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only the product owner can delete this product",
      });
    }

    await product.deleteOne();

    onCatalogMutation();

    res.json({
      success: true,
      message: "Product deleted successfully",
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting product",
      error: error.message,
    });
  }
};
