const Order = require("../models/Order");
const Product = require("../models/Product");
const Cart = require("../models/Cart");

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const { orderItems, shippingAddress, totalPrice } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ success: false, message: "No order items" });
    }

    const itemsWithSellers = [];

    // Check stock and get seller for all items
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product || product.stock < item.qty) {
        return res.status(400).json({
          success: false,
          message: `Product ${product?.name || "Unknown"} is out of stock`,
        });
      }
      itemsWithSellers.push({
        ...item,
        seller: product.seller,
      });
    }

    // Create order
    const order = new Order({
      orderItems: itemsWithSellers,
      user: req.user._id,
      shippingAddress,
      totalPrice,
    });

    const createdOrder = await order.save();

    // Update stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.qty },
      });
    }

    // Clear cart
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: createdOrder,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating order",
      error: error.message,
    });
  }
};

// @desc    Get orders for a seller
// @route   GET /api/orders/seller
// @access  Private (Seller only)
exports.getSellerOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      "orderItems.seller": req.user._id,
    }).sort({ createdAt: -1 });

    // Filter items to only show those belonging to the seller
    const filteredOrders = orders.map((order) => {
      const orderObj = order.toObject();
      orderObj.orderItems = orderObj.orderItems.filter(
        (item) => item.seller.toString() === req.user._id.toString(),
      );
      return orderObj;
    });

    res.json({
      success: true,
      data: filteredOrders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching seller orders",
      error: error.message,
    });
  }
};

// @desc    Update order item status by seller
// @route   PUT /api/orders/:orderId/item/:productId/status
// @access  Private (Seller only)
exports.updateOrderItemStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const item = order.orderItems.find(
      (item) => item.product.toString() === req.params.productId,
    );

    if (!item) {
      return res.status(404).json({ success: false, message: "Product not found in order" });
    }

    if (item.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    item.status = status;

    // If all items are delivered, set global status to Delivered
    const allDelivered = order.orderItems.every((i) => i.status === "Delivered");
    if (allDelivered) {
      order.status = "Delivered";
      order.deliveredAt = Date.now();
    }

    await order.save();

    res.json({
      success: true,
      message: "Order item status updated",
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating status",
      error: error.message,
    });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching orders",
      error: error.message,
    });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "user",
      "name email",
    );

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Check if order belongs to user or user is admin
    if (
      order.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching order",
      error: error.message,
    });
  }
};
