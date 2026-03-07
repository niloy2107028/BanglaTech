const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const {
  getAllCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

// Category routes
router
  .route("/")
  .get(getAllCategories)
  .post(upload.single("image"), createCategory);

router
  .route("/:id")
  .get(getCategory)
  .put(upload.single("image"), updateCategory)
  .delete(deleteCategory);

module.exports = router;
