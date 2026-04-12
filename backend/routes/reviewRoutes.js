const express = require("express");
const router = express.Router();
const {
  createReview,
  getProductReviews,
  voteReview,
  replyToReview
} = require("../controllers/reviewController");
const { protect } = require("../middleware/auth");

// Public access to view reviews
router.get("/:productId", getProductReviews);

// Private access for review creation, voting, and replying
router.post("/:productId", protect, createReview);
router.post("/:reviewId/vote", protect, voteReview);
router.post("/:reviewId/reply", protect, replyToReview);

module.exports = router;
