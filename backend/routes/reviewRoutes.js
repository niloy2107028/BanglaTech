const express = require("express");
const router = express.Router();
const {
  createReview,
  updateReview,
  deleteReview,
  getProductReviews,
  voteReview,
  replyToReview,
  updateReply,
  deleteReply,
  voteReply,
  getReviewPermissions,
} = require("../controllers/reviewController");
const { protect } = require("../middleware/auth");
const { imageUpload } = require("../middleware/upload");
const reviewImageUpload = imageUpload.fields([
  { name: "image", maxCount: 1 },
  { name: "images", maxCount: 3 },
]);

// Public access to view reviews
router.get("/permissions/:productId", protect, getReviewPermissions);
router.get("/:productId", getProductReviews);

// Private access for review creation, voting, and replying
router.post("/:productId", protect, reviewImageUpload, createReview);
router.put("/:reviewId", protect, reviewImageUpload, updateReview);
router.delete("/:reviewId", protect, deleteReview);
router.post("/:reviewId/vote", protect, voteReview);
router.post("/:reviewId/reply", protect, reviewImageUpload, replyToReview);
router.put("/:reviewId/replies/:replyId", protect, reviewImageUpload, updateReply);
router.delete("/:reviewId/replies/:replyId", protect, deleteReply);
router.post("/:reviewId/replies/:replyId/vote", protect, voteReply);

module.exports = router;
