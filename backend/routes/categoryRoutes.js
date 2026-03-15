const express = require("express");
const router = express.Router();
const {
  getAllCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

const { protect, authorize } = require("../middleware/auth");

// Public routes
router.route("/").get(getAllCategories);
router.route("/:id").get(getCategory);

// Protected admin routes
router.route("/").post(protect, authorize("admin"), createCategory);

router
  .route("/:id")
  .put(protect, authorize("admin"), updateCategory)
  .delete(protect, authorize("admin"), deleteCategory);

module.exports = router;
