const express = require("express");
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} = require("../controllers/cartController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/", getCart);
router.post("/", addToCart);
router.delete("/", clearCart);
router.put("/:productId", updateCartItem);
router.delete("/:productId", removeFromCart);

module.exports = router;
