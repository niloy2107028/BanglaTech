const express = require("express");
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getSellerOrders,
  updateOrderItemStatus,
  cancelOrderItem,
} = require("../controllers/orderController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);

router.post("/", authorize("buyer"), createOrder);
router.get("/myorders", authorize("buyer"), getMyOrders);
router.get("/seller", authorize("seller"), getSellerOrders);
router.put(
  "/:orderId/item/:productId/status",
  authorize("seller"),
  updateOrderItemStatus,
);
router.put(
  "/:orderId/item/:productId/cancel",
  authorize("buyer"),
  cancelOrderItem,
);
router.get("/:id", getOrderById);

module.exports = router;
