const Product = require("../models/Product");
const Category = require("../models/Category");
const UserPreference = require("../models/UserPreference");
const { invalidateChatbotCaches } = require("../services/chatbot/cacheService");
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

      return res.json({
        success: true,
        count: products.length,
        total,
        page: pageNumber,
        pages: Math.ceil(total / limit),
        data: products,
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
      count: originalResult.products.length,
      total: originalResult.total,
      page: pageNumber,
      pages: Math.ceil(originalResult.total / limit),
      data: originalResult.products,
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

    res.json({
      success: true,
      personalized: scoredProducts.length > 0,
      keywords: keywords.slice(0, 10).map((item) => item.value),
      data: scoredProducts,
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
exports.trackProductView = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "category",
      "name",
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const preference = await trackUserKeywords(
      req.user._id,
      extractProductKeywords(product),
      "view",
      1,
    );

    res.json({
      success: true,
      message: "Product view tracked",
      keywords: preference?.keywords?.slice(0, 10) || [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error tracking product view",
      error: error.message,
    });
  }
};

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
