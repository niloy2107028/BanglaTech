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
const { imageUpload } = require("../middleware/upload");
const categoryImageUpload = imageUpload.single("image");

// Public routes
router.route("/").get(getAllCategories);
router.route("/:id").get(getCategory);

// Protected admin routes
router.route("/").post(protect, authorize("admin"), categoryImageUpload, createCategory);

router
  .route("/:id")
  .put(protect, authorize("admin"), categoryImageUpload, updateCategory)
  .delete(protect, authorize("admin"), deleteCategory);

module.exports = router;
