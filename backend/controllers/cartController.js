const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { trackUserKeywords, extractProductKeywords } = require("../utils/recommendationKeywords");

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product",
      "name price image stock categoryName brand",
    );

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }    

    res.json({
      success: true,
      data: cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching cart",
      error: error.message,
    });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const qty = Number(quantity) || 1;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (product.stock < qty) {
      return res.status(400).json({ success: false, message: "Not enough stock" });
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId,
    );

    if (itemIndex > -1) {
      // If item exists, update quantity
      cart.items[itemIndex].quantity += qty;
    } else {
      // Add new item
      cart.items.push({ product: productId, quantity: qty });
    }

    await cart.save();
    await cart.populate("items.product", "name price image stock categoryName brand");

    await trackUserKeywords(req.user._id, extractProductKeywords(product), "cart", 3);

    res.json({
      success: true,
      message: "Item added to cart",
      data: cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error adding to cart",
      error: error.message,
    });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/:productId
// @access  Private
exports.updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const qty = Number(quantity);

    if (qty < 1) {
      return res.status(400).json({ success: false, message: "Quantity must be at least 1" });
    }

    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (product.stock < qty) {
      return res.status(400).json({ success: false, message: "Not enough stock" });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === req.params.productId,
    );

    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: "Item not in cart" });
    }

    cart.items[itemIndex].quantity = qty;
    await cart.save();
    await cart.populate("items.product", "name price image stock categoryName brand");

    await trackUserKeywords(req.user._id, extractProductKeywords(product), "cart", 3);

    res.json({
      success: true,
      message: "Cart updated",
      data: cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating cart",
      error: error.message,
    });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:productId
// @access  Private
exports.removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== req.params.productId,
    );

    await cart.save();
    await cart.populate("items.product", "name price image stock categoryName brand");

    res.json({
      success: true,
      message: "Item removed from cart",
      data: cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error removing item",
      error: error.message,
    });
  }
};

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    res.json({
      success: true,
      message: "Cart cleared",
      data: cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error clearing cart",
      error: error.message,
    });
  }
};
