const Review = require("../models/Review");
const Product = require("../models/Product");
const Order = require("../models/Order");

// @desc    Create new review
// @route   POST /api/reviews/:productId
// @access  Private (Verified Buyer Only)
exports.createReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.productId;
    const userId = req.user._id;

    // 1. Check if user already reviewed this product
    const alreadyReviewed = await Review.findOne({ product: productId, user: userId });
    if (alreadyReviewed) {
      return res.status(400).json({ success: false, message: "Product already reviewed" });
    }

    // 2. VERIFIED BUYER CHECK: Check if user has a DELIVERED order for this product
    const order = await Order.findOne({
      user: userId,
      "orderItems.product": productId,
      $or: [
        { status: "Delivered" },
        { isPaid: true }
      ]
    });

    if (!order) {
      return res.status(403).json({ 
        success: false, 
        message: "Only verified buyers who have purchased this item can leave a review." 
      });
    }

    const review = await Review.create({
      product: productId,
      user: userId,
      name: req.user.name,
      rating: Number(rating),
      comment
    });

    // 3. Update Product Rating Average
    const reviews = await Review.find({ product: productId });
    const numReviews = reviews.length;
    const avgRating = reviews.reduce((acc, item) => item.rating + acc, 0) / numReviews;

    await Product.findByIdAndUpdate(productId, {
      rating: avgRating,
      reviews: numReviews
    });

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all reviews for a product
// @route   GET /api/reviews/:productId
// @access  Public
exports.getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upvote/Downvote a review
// @route   POST /api/reviews/:reviewId/vote
// @access  Private (Verified Users & Sellers Only)
exports.voteReview = async (req, res) => {
  try {
    const { voteType } = req.body; // 'upvote' or 'downvote'
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ success: false, message: "Review not found" });

    // VERIFIED USER CHECK: Has the user ever bought ANYTHING?
    const isVerifiedUser = await Order.findOne({ user: req.user._id, status: "Delivered" });
    const isSeller = req.user.role === "seller" || req.user.role === "admin";

    if (!isVerifiedUser && !isSeller) {
      return res.status(403).json({ success: false, message: "Only verified buyers or sellers can vote." });
    }

    // Handle Upvote
    if (voteType === "upvote") {
      if (review.upvotes.includes(req.user._id)) {
        review.upvotes = review.upvotes.filter(id => id.toString() !== req.user._id.toString());
      } else {
        review.upvotes.push(req.user._id);
        review.downvotes = review.downvotes.filter(id => id.toString() !== req.user._id.toString());
      }
    } 
    // Handle Downvote
    else if (voteType === "downvote") {
      if (review.downvotes.includes(req.user._id)) {
        review.downvotes = review.downvotes.filter(id => id.toString() !== req.user._id.toString());
      } else {
        review.downvotes.push(req.user._id);
        review.upvotes = review.upvotes.filter(id => id.toString() !== req.user._id.toString());
      }
    }

    await review.save();
    res.status(200).json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reply to a review
// @route   POST /api/reviews/:reviewId/reply
// @access  Private (Original Reviewer & Product Seller Only)
exports.replyToReview = async (req, res) => {
  try {
    const { text } = req.body;
    const review = await Review.findById(req.params.reviewId).populate("product");
    if (!review) return res.status(404).json({ success: false, message: "Review not found" });

    const isOriginalReviewer = review.user.toString() === req.user._id.toString();
    const isProductSeller = review.product.seller.toString() === req.user._id.toString();

    if (!isOriginalReviewer && !isProductSeller) {
      return res.status(403).json({ success: false, message: "Only the reviewer or the product seller can reply." });
    }

    review.replies.push({
      user: req.user._id,
      name: req.user.name,
      text
    });

    await review.save();
    res.status(200).json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
