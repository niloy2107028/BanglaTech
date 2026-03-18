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
      const product = await Product.findById(item.product).populate("seller", "name");
      if (!product || product.stock < item.qty) {
        return res.status(400).json({
          success: false,
          message: `Product ${product?.name || "Unknown"} is out of stock`,
        });
      }

      if (!product.seller) {
        return res.status(400).json({
          success: false,
          message: `Product ${product.name} does not have a registered seller.`,
        });
      }

      itemsWithSellers.push({
        ...item,
        seller: product.seller._id,
        sellerName: product.seller.name || "Unknown Seller",
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
    console.error("ORDER CREATE ERROR:", error);
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
        (item) => item.seller && item.seller.toString() === req.user._id.toString(),
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
    const { status, cancellationReason } = req.body;
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const itemIndex = order.orderItems.findIndex(
      (item) => item.product.toString() === req.params.productId,
    );

    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: "Product not found in order" });
    }

    const item = order.orderItems[itemIndex];

    if (!item.seller || item.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    // Status Workflow Enforcement
    const statusOrder = ["Pending", "Processing", "Shipped", "Delivered"];
    const currentStatusIndex = statusOrder.indexOf(item.status);
    const newStatusIndex = statusOrder.indexOf(status);

    // If current status is Cancelled, it's final
    if (item.status === "Cancelled") {
      return res.status(400).json({ success: false, message: "Cancelled orders cannot be modified" });
    }

    // If new status is Cancelled, only allowed if current status is Pending or Processing
    if (status === "Cancelled") {
      if (currentStatusIndex > 1) { // Shipped or Delivered
        return res.status(400).json({ success: false, message: "Cannot cancel order after it has been shipped" });
      }
      item.status = "Cancelled";
      item.cancellationReason = cancellationReason || "Seller cancelled the order";
      
      // Return stock back to product
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.qty },
      });
    } else {
      // Normal workflow
      if (newStatusIndex <= currentStatusIndex) {
        return res.status(400).json({ success: false, message: "Cannot move to a previous or same status" });
      }
      item.status = status;
    }

    // If all items are delivered or cancelled, set global status accordingly
    const allDeliveredOrCancelled = order.orderItems.every((i) => i.status === "Delivered" || i.status === "Cancelled");
    if (allDeliveredOrCancelled) {
      const allCancelled = order.orderItems.every((i) => i.status === "Cancelled");
      order.status = allCancelled ? "Cancelled" : "Delivered";
      if (!allCancelled) order.deliveredAt = Date.now();
    } else if (order.orderItems.some((i) => i.status !== "Pending")) {
      order.status = "Processing";
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

// @desc    Cancel order item by buyer
// @route   PUT /api/orders/:orderId/item/:productId/cancel
// @access  Private (Buyer only)
exports.cancelOrderItem = async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Only order owner can cancel
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const itemIndex = order.orderItems.findIndex(
      (item) => item.product.toString() === req.params.productId,
    );

    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: "Product not found in order" });
    }

    const item = order.orderItems[itemIndex];

    // Only Pending status can be cancelled by buyer
    if (item.status !== "Pending") {
      return res.status(400).json({ 
        success: false, 
        message: "Order can only be cancelled while in Pending stage" 
      });
    }

    item.status = "Cancelled";
    item.cancellationReason = reason || "Cancelled by buyer";

    // Return stock back to product
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.qty },
    });

    // Update global status if necessary
    const allCancelled = order.orderItems.every((i) => i.status === "Cancelled");
    if (allCancelled) {
      order.status = "Cancelled";
    }

    await order.save();

    res.json({
      success: true,
      message: "Order item cancelled successfully",
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error cancelling order",
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
