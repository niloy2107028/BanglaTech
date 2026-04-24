const mongoose = require("mongoose");
const Review = require("../models/Review");
const Product = require("../models/Product");
const Order = require("../models/Order");
const MAX_REVIEW_IMAGES = 3;
const MAX_REVIEW_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_REVIEW_TOTAL_IMAGE_BYTES = 5 * 1024 * 1024;

function sameId(a, b) {
  return String(a || "") === String(b || "");
}

function normalizeVoteType(voteType) {
  const normalized = String(voteType || "").toLowerCase();
  return normalized === "upvote" || normalized === "downvote"
    ? normalized
    : "";
}

function applyVoteToggle(target, userId, voteType) {
  const userIdStr = String(userId || "");
  const hasUpvote = (target.upvotes || []).some((id) => String(id) === userIdStr);
  const hasDownvote = (target.downvotes || []).some(
    (id) => String(id) === userIdStr,
  );

  target.upvotes = (target.upvotes || []).filter((id) => String(id) !== userIdStr);
  target.downvotes = (target.downvotes || []).filter(
    (id) => String(id) !== userIdStr,
  );

  if (voteType === "upvote" && !hasUpvote) {
    target.upvotes.push(userId);
  }

  if (voteType === "downvote" && !hasDownvote) {
    target.downvotes.push(userId);
  }
}

function parsePositiveInt(value, fallback, min = 1, max = 50) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function normalizeReviewSort(sort) {
  const value = String(sort || "latest").toLowerCase();
  const allowed = [
    "latest",
    "oldest",
    "top",
    "rating_high",
    "rating_low",
    "discussed",
  ];
  return allowed.includes(value) ? value : "latest";
}

function normalizeReviewFilter(filter) {
  const value = String(filter || "all").toLowerCase();
  const allowed = ["all", "with_replies", "no_replies"];
  return allowed.includes(value) ? value : "all";
}

function getReviewSortStage(sort) {
  if (sort === "oldest") return { createdAt: 1 };
  if (sort === "top") return { voteScore: -1, upvoteCount: -1, createdAt: -1 };
  if (sort === "rating_high") return { rating: -1, createdAt: -1 };
  if (sort === "rating_low") return { rating: 1, createdAt: -1 };
  if (sort === "discussed") return { replyCount: -1, voteScore: -1, createdAt: -1 };
  return { createdAt: -1 };
}

function parseBoolean(value) {
  const normalized = String(value || "").toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

function makeImageDataUrl(file) {
  if (!file || !file.buffer || !file.mimetype) return "";
  const base64 = file.buffer.toString("base64");
  if (!base64) return "";
  return `data:${file.mimetype};base64,${base64}`;
}

function normalizeImageList(values) {
  return (Array.isArray(values) ? values : [])
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .slice(0, MAX_REVIEW_IMAGES);
}

function parseRetainedImageUrls(value) {
  if (value === undefined || value === null) return null;

  let parsed = value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      parsed = JSON.parse(trimmed);
    } catch (error) {
      const badRequest = new Error("Invalid retainedImages payload.");
      badRequest.statusCode = 400;
      throw badRequest;
    }
  }

  if (!Array.isArray(parsed)) {
    const badRequest = new Error("retainedImages must be an array.");
    badRequest.statusCode = 400;
    throw badRequest;
  }

  return normalizeImageList(parsed);
}

function getEntityImageList(entity) {
  const list = normalizeImageList(entity?.images);
  if (list.length > 0) return list;
  const legacy = String(entity?.image || "").trim();
  return legacy ? [legacy] : [];
}

function applyEntityImages(entity, urls) {
  const list = normalizeImageList(urls);
  entity.images = list;
  entity.image = list[0] || "";
}

function extractIncomingImageUrls(req) {
  const files = [];

  if (req.file) {
    files.push(req.file);
  }

  if (Array.isArray(req.files)) {
    files.push(...req.files);
  } else if (req.files && typeof req.files === "object") {
    if (Array.isArray(req.files.images)) files.push(...req.files.images);
    if (Array.isArray(req.files.image)) files.push(...req.files.image);
  }

  if (files.length > MAX_REVIEW_IMAGES) {
    const error = new Error(`You can upload maximum ${MAX_REVIEW_IMAGES} images.`);
    error.statusCode = 400;
    throw error;
  }

  const tooLargeFile = files.find(
    (file) => Number(file?.size || 0) > MAX_REVIEW_IMAGE_BYTES,
  );
  if (tooLargeFile) {
    const error = new Error(
      `Each image must be ${Math.floor(MAX_REVIEW_IMAGE_BYTES / (1024 * 1024))}MB or smaller.`,
    );
    error.statusCode = 400;
    throw error;
  }

  const totalBytes = files.reduce(
    (sum, file) => sum + Number(file?.size || 0),
    0,
  );
  if (totalBytes > MAX_REVIEW_TOTAL_IMAGE_BYTES) {
    const error = new Error(
      `Total image size must be ${Math.floor(MAX_REVIEW_TOTAL_IMAGE_BYTES / (1024 * 1024))}MB or smaller.`,
    );
    error.statusCode = 400;
    throw error;
  }

  return files
    .map((file) => makeImageDataUrl(file))
    .filter(Boolean)
    .slice(0, MAX_REVIEW_IMAGES);
}

async function hasVerifiedPurchaseForProduct(userId, productId) {
  const orders = await Order.find({
    user: userId,
    "orderItems.product": productId,
  })
    .select("status isPaid orderItems.product orderItems.status")
    .lean();

  for (const order of orders) {
    const items = Array.isArray(order?.orderItems) ? order.orderItems : [];
    const relevantItems = items.filter((item) => sameId(item?.product, productId));

    for (const item of relevantItems) {
      const itemStatus = String(item?.status || "");
      if (itemStatus === "Cancelled") continue;

      if (
        itemStatus === "Delivered"
        || String(order?.status || "") === "Delivered"
        || Boolean(order?.isPaid)
      ) {
        return true;
      }
    }
  }

  return false;
}

async function isVerifiedBuyer(userId) {
  const order = await Order.findOne({
    user: userId,
    $or: [{ status: "Delivered" }, { isPaid: true }, { "orderItems.status": "Delivered" }],
  })
    .select("_id")
    .lean();

  return Boolean(order);
}

async function refreshProductRating(productId) {
  const reviews = await Review.find({ product: productId }).select("rating").lean();
  const numReviews = reviews.length;
  const avgRating = numReviews > 0
    ? reviews.reduce((total, item) => total + Number(item.rating || 0), 0) / numReviews
    : 0;

  await Product.findByIdAndUpdate(productId, {
    rating: Number(avgRating.toFixed(2)),
    reviews: numReviews,
  });
}

// @desc    Create new review
// @route   POST /api/reviews/:productId
// @access  Private (Verified Buyer Only)
exports.createReview = async (req, res) => {
  try {
    const productId = req.params.productId;
    const userId = req.user._id;
    const rating = Number(req.body?.rating);
    const comment = String(req.body?.comment || "").trim();
    const images = extractIncomingImageUrls(req);

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be a number between 1 and 5",
      });
    }

    if (!comment && images.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide review text or an image.",
      });
    }

    const product = await Product.findById(productId).select("_id seller").lean();
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (sameId(product?.seller, userId)) {
      return res.status(403).json({
        success: false,
        message: "You cannot review your own product.",
      });
    }

    const canReview = await hasVerifiedPurchaseForProduct(userId, productId);
    if (!canReview) {
      return res.status(403).json({
        success: false,
        message: "Only verified buyers of this product can leave a review.",
      });
    }

    let review;
    try {
      review = await Review.create({
        product: productId,
        user: userId,
        name: req.user.name,
        rating,
        comment: comment || "Image review",
        image: images[0] || "",
        images,
      });
    } catch (error) {
      if (Number(error?.code) === 11000) {
        return res.status(400).json({
          success: false,
          message: "You have already reviewed this product.",
        });
      }
      throw error;
    }

    await refreshProductRating(productId);

    return res.status(201).json({ success: true, data: review });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Update review by owner
// @route   PUT /api/reviews/:reviewId
// @access  Private
exports.updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    if (!sameId(review.user, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Only review owner can edit this review.",
      });
    }

    const nextRatingRaw = req.body?.rating;
    const nextCommentRaw = req.body?.comment;
    const removeImage = parseBoolean(req.body?.removeImage);
    const retainedImages = parseRetainedImageUrls(req.body?.retainedImages);
    const hasRetainedImages = retainedImages !== null;
    const nextImages = extractIncomingImageUrls(req);

    if (nextRatingRaw !== undefined) {
      const parsedRating = Number(nextRatingRaw);
      if (!Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return res.status(400).json({
          success: false,
          message: "Rating must be a number between 1 and 5",
        });
      }
      review.rating = parsedRating;
    }

    if (nextCommentRaw !== undefined) {
      const comment = String(nextCommentRaw || "").trim();
      if (!comment && !nextImages.length && getEntityImageList(review).length === 0 && !removeImage) {
        return res.status(400).json({
          success: false,
          message: "Please provide review text or keep an image.",
        });
      }
      review.comment = comment || "Image review";
    }

    let resolvedImages = getEntityImageList(review);
    if (removeImage) {
      resolvedImages = [];
    }

    if (hasRetainedImages) {
      resolvedImages = retainedImages;
    }

    if (nextImages.length > 0) {
      if (resolvedImages.length + nextImages.length > MAX_REVIEW_IMAGES) {
        return res.status(400).json({
          success: false,
          message: `You can upload maximum ${MAX_REVIEW_IMAGES} images.`,
        });
      }
      resolvedImages = [...resolvedImages, ...nextImages];
    }

    applyEntityImages(review, resolvedImages);

    if (!review.comment && getEntityImageList(review).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Review cannot be empty.",
      });
    }

    await review.save();
    await refreshProductRating(review.product);
    return res.status(200).json({ success: true, data: review });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Delete review by owner
// @route   DELETE /api/reviews/:reviewId
// @access  Private
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    if (!sameId(review.user, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Only review owner can delete this review.",
      });
    }

    const productId = review.product;
    await review.deleteOne();
    await refreshProductRating(productId);

    return res.status(200).json({ success: true, message: "Review deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all reviews for a product
// @route   GET /api/reviews/:productId
// @access  Public
exports.getProductReviews = async (req, res) => {
  try {
    const productId = req.params.productId;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product id",
      });
    }

    const page = parsePositiveInt(req.query?.page, 1, 1, 2000);
    const limit = parsePositiveInt(req.query?.limit, 6, 1, 30);
    const sort = normalizeReviewSort(req.query?.sort);
    const filter = normalizeReviewFilter(req.query?.filter);
    const skip = (page - 1) * limit;
    const objectId = new mongoose.Types.ObjectId(productId);

    const pipeline = [
      {
        $match: {
          product: objectId,
        },
      },
    ];

    if (filter === "with_replies") {
      pipeline.push({ $match: { "replies.0": { $exists: true } } });
    } else if (filter === "no_replies") {
      pipeline.push({ $match: { "replies.0": { $exists: false } } });
    }

    pipeline.push({
      $addFields: {
        upvoteCount: { $size: { $ifNull: ["$upvotes", []] } },
        downvoteCount: { $size: { $ifNull: ["$downvotes", []] } },
        replyCount: { $size: { $ifNull: ["$replies", []] } },
      },
    });

    pipeline.push({
      $addFields: {
        voteScore: { $subtract: ["$upvoteCount", "$downvoteCount"] },
      },
    });

    pipeline.push({ $sort: getReviewSortStage(sort) });

    pipeline.push({
      $facet: {
        data: [{ $skip: skip }, { $limit: limit }],
        meta: [{ $count: "total" }],
      },
    });

    const [result] = await Review.aggregate(pipeline);
    const reviews = Array.isArray(result?.data) ? result.data : [];
    const total = Number(result?.meta?.[0]?.total || 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const [stats] = await Review.aggregate([
      { $match: { product: objectId } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          avgRating: { $avg: "$rating" },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: reviews,
      meta: {
        page,
        limit,
        total,
        totalPages,
        sort,
        filter,
      },
      stats: {
        totalReviews: Number(stats?.totalReviews || 0),
        avgRating: Number(stats?.avgRating || 0),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upvote/Downvote a review
// @route   POST /api/reviews/:reviewId/vote
// @access  Private (Verified Buyers Only)
exports.voteReview = async (req, res) => {
  try {
    const voteType = normalizeVoteType(req.body?.voteType);
    if (!voteType) {
      return res.status(400).json({
        success: false,
        message: "voteType must be either 'upvote' or 'downvote'",
      });
    }

    const buyerVerified = await isVerifiedBuyer(req.user._id);
    if (!buyerVerified) {
      return res.status(403).json({
        success: false,
        message: "Only verified buyers can vote on reviews.",
      });
    }

    const review = await Review.findById(req.params.reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    if (sameId(review.user, req.user._id)) {
      return res.status(400).json({
        success: false,
        message: "You cannot vote on your own review.",
      });
    }

    applyVoteToggle(review, req.user._id, voteType);
    await review.save();
    return res.status(200).json({ success: true, data: review });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reply to a review
// @route   POST /api/reviews/:reviewId/reply
// @access  Private (Product Seller + Review Owner only)
exports.replyToReview = async (req, res) => {
  try {
    const text = String(req.body?.text || "").trim();
    const images = extractIncomingImageUrls(req);
    if (!text && images.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Reply text or image is required",
      });
    }

    const review = await Review.findById(req.params.reviewId).populate(
      "product",
      "seller",
    );

    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    const isReviewOwner = sameId(review.user, req.user._id);
    const isProductSeller = sameId(review?.product?.seller, req.user._id);

    if (!isReviewOwner && !isProductSeller) {
      return res.status(403).json({
        success: false,
        message: "Only the product seller and this review owner can reply.",
      });
    }

    if ((review.replies || []).length === 0 && !isProductSeller) {
      return res.status(403).json({
        success: false,
        message: "The seller must reply first. You can respond after that.",
      });
    }

    review.replies.push({
      user: req.user._id,
      name: req.user.name,
      role: isProductSeller ? "seller" : "reviewer",
      text: text || "Image reply",
      image: images[0] || "",
      images,
    });

    await review.save();
    return res.status(200).json({ success: true, data: review });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Edit own reply on a review
// @route   PUT /api/reviews/:reviewId/replies/:replyId
// @access  Private
exports.updateReply = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    const reply = review.replies.id(req.params.replyId);
    if (!reply) {
      return res.status(404).json({ success: false, message: "Reply not found" });
    }

    if (!sameId(reply.user, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Only reply owner can edit this reply.",
      });
    }

    const textInput = req.body?.text;
    const removeImage = parseBoolean(req.body?.removeImage);
    const retainedImages = parseRetainedImageUrls(req.body?.retainedImages);
    const hasRetainedImages = retainedImages !== null;
    const nextImages = extractIncomingImageUrls(req);

    if (textInput !== undefined) {
      const nextText = String(textInput || "").trim();
      reply.text = nextText || "Image reply";
    }

    let resolvedImages = getEntityImageList(reply);
    if (removeImage) {
      resolvedImages = [];
    }

    if (hasRetainedImages) {
      resolvedImages = retainedImages;
    }

    if (nextImages.length > 0) {
      if (resolvedImages.length + nextImages.length > MAX_REVIEW_IMAGES) {
        return res.status(400).json({
          success: false,
          message: `You can upload maximum ${MAX_REVIEW_IMAGES} images.`,
        });
      }
      resolvedImages = [...resolvedImages, ...nextImages];
    }

    applyEntityImages(reply, resolvedImages);

    if (!reply.text && getEntityImageList(reply).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Reply cannot be empty.",
      });
    }

    await review.save();
    return res.status(200).json({ success: true, data: review });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Delete own reply on a review
// @route   DELETE /api/reviews/:reviewId/replies/:replyId
// @access  Private
exports.deleteReply = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    const reply = review.replies.id(req.params.replyId);
    if (!reply) {
      return res.status(404).json({ success: false, message: "Reply not found" });
    }

    if (!sameId(reply.user, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Only reply owner can delete this reply.",
      });
    }

    reply.deleteOne();
    await review.save();
    return res.status(200).json({ success: true, data: review });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upvote/Downvote a review reply
// @route   POST /api/reviews/:reviewId/replies/:replyId/vote
// @access  Private (Verified Buyers Only)
exports.voteReply = async (req, res) => {
  try {
    const voteType = normalizeVoteType(req.body?.voteType);
    if (!voteType) {
      return res.status(400).json({
        success: false,
        message: "voteType must be either 'upvote' or 'downvote'",
      });
    }

    const buyerVerified = await isVerifiedBuyer(req.user._id);
    if (!buyerVerified) {
      return res.status(403).json({
        success: false,
        message: "Only verified buyers can vote on replies.",
      });
    }

    const review = await Review.findById(req.params.reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    const reply = review.replies.id(req.params.replyId);
    if (!reply) {
      return res.status(404).json({ success: false, message: "Reply not found" });
    }

    if (sameId(reply.user, req.user._id)) {
      return res.status(400).json({
        success: false,
        message: "You cannot vote on your own reply.",
      });
    }

    applyVoteToggle(reply, req.user._id, voteType);
    await review.save();
    return res.status(200).json({ success: true, data: review });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get review interaction permissions for current user and product
// @route   GET /api/reviews/permissions/:productId
// @access  Private
exports.getReviewPermissions = async (req, res) => {
  try {
    const productId = req.params.productId;
    const userId = req.user._id;

    const [product, verifiedForProduct, verifiedBuyer, existingReview] = await Promise.all([
      Product.findById(productId).select("seller").lean(),
      hasVerifiedPurchaseForProduct(userId, productId),
      isVerifiedBuyer(userId),
      Review.findOne({ product: productId, user: userId }).select("_id").lean(),
    ]);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const isOwnProductSeller = sameId(product?.seller, userId);

    return res.status(200).json({
      success: true,
      data: {
        canReview: !isOwnProductSeller && verifiedForProduct && !existingReview,
        hasReviewed: Boolean(existingReview),
        canVote: verifiedBuyer,
        isOwnProductSeller,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
