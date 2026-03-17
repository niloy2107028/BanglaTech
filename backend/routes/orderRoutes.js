const express = require("express");
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getSellerOrders,
  updateOrderItemStatus,
} = require("../controllers/orderController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);

router.post("/", createOrder);
router.get("/myorders", getMyOrders);
router.get("/seller", authorize("seller", "admin"), getSellerOrders);
router.put(
  "/:orderId/item/:productId/status",
  authorize("seller", "admin"),
  updateOrderItemStatus,
);
router.get("/:id", getOrderById);

module.exports = router;
