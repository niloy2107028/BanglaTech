const Product = require("../models/Product");
const Category = require("../models/Category");
const { invalidateChatbotCaches } = require("../services/chatbot/cacheService");
const { markVectorIndexStale, triggerVectorRefresh } = require("../services/chatbot/searchService");

function onCatalogMutation() {
  invalidateChatbotCaches();
  markVectorIndexStale();
  triggerVectorRefresh();
}

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getAllProducts = async (req, res) => {
  try {
    const { search, category, featured, page = 1 } = req.query;
    const limit = 15;
    let query = {};

    if (search) {
      const words = search.trim().split(/\s+/);
      query.$and = words.map((word) => ({
        $or: [
          { name: { $regex: word, $options: "i" } },
          { brand: { $regex: word, $options: "i" } },
          { categoryName: { $regex: word, $options: "i" } },
        ],
      }));
    }

    if (category) {
      const categoryDoc = await Category.findOne({ name: category });
      if (categoryDoc) {
        query.category = categoryDoc._id;
      }
    }

    if (featured === "true") {
      query.featured = true;
    }

    const products = await Product.find(query)
      .populate("category", "name")
      .populate("seller", "name email")
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      count: products.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching products",
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
    console.log(req.params);
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
// @access  Public
exports.createProduct = async (req, res) => {
  try {
    req.body.seller = req.user.id;

    // Get category name if category ID is provided
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
// @access  Public
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    // req.params.id → which product
    // req.body → new data
    // new: true → return updated product
    // runValidators: true → apply schema validation

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

    // Prevent non-admin users from changing product owner.
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
// @access  Public
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
