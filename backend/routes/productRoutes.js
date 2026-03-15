const express = require("express");
const router = express.Router();
const {
  getAllProducts,
  getMyProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const { protect, authorize } = require("../middleware/auth");

// Public
router.route("/").get(getAllProducts);

// Private seller/admin routes
router.get("/mine", protect, authorize("seller", "admin"), getMyProducts);

// Protected — must be logged in + admin role

// for create update and delete we are calling two middlewares first
// protect : req er cookie te token ase kina jodi thake tyle req.user set kore dey
// authorize: give roles er aktao user er ase kina jodi thake tylei agaite parbe
router.route("/").post(protect, authorize("seller", "admin"), createProduct);
router
  .route("/:id")
  .get(getProduct)
  .put(protect, authorize("seller", "admin"), updateProduct)
  .delete(protect, authorize("seller", "admin"), deleteProduct);

module.exports = router;
