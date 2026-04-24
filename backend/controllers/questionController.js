const mongoose = require("mongoose");
const Question = require("../models/Question");
const Product = require("../models/Product");
const MAX_QNA_IMAGES = 3;
const MAX_QNA_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_QNA_TOTAL_IMAGE_BYTES = 5 * 1024 * 1024;

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

function normalizeQuestionSort(sort) {
  const value = String(sort || "latest").toLowerCase();
  const allowed = ["latest", "oldest", "top", "active"];
  return allowed.includes(value) ? value : "latest";
}

function normalizeQuestionFilter(filter) {
  const value = String(filter || "all").toLowerCase();
  const allowed = ["all", "answered", "unanswered"];
  return allowed.includes(value) ? value : "all";
}

function getQuestionSortStage(sort) {
  if (sort === "oldest") return { createdAt: 1 };
  if (sort === "top") return { voteScore: -1, upvoteCount: -1, createdAt: -1 };
  if (sort === "active") return { messageCount: -1, updatedAt: -1, createdAt: -1 };
  return { createdAt: -1 };
}

function parseBoolean(value) {
  const normalized = String(value || "").toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
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
    .slice(0, MAX_QNA_IMAGES);
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

  if (files.length > MAX_QNA_IMAGES) {
    const error = new Error(`You can upload maximum ${MAX_QNA_IMAGES} images.`);
    error.statusCode = 400;
    throw error;
  }

  const tooLargeFile = files.find(
    (file) => Number(file?.size || 0) > MAX_QNA_IMAGE_BYTES,
  );
  if (tooLargeFile) {
    const error = new Error(
      `Each image must be ${Math.floor(MAX_QNA_IMAGE_BYTES / (1024 * 1024))}MB or smaller.`,
    );
    error.statusCode = 400;
    throw error;
  }

  const totalBytes = files.reduce(
    (sum, file) => sum + Number(file?.size || 0),
    0,
  );
  if (totalBytes > MAX_QNA_TOTAL_IMAGE_BYTES) {
    const error = new Error(
      `Total image size must be ${Math.floor(MAX_QNA_TOTAL_IMAGE_BYTES / (1024 * 1024))}MB or smaller.`,
    );
    error.statusCode = 400;
    throw error;
  }

  return files
    .map((file) => makeImageDataUrl(file))
    .filter(Boolean)
    .slice(0, MAX_QNA_IMAGES);
}

async function findProductSellerId(productId) {
  const product = await Product.findById(productId).select("seller").lean();
  return product?.seller || null;
}

// @desc    Create question for a product
// @route   POST /api/questions/product/:productId
// @access  Private
exports.createQuestion = async (req, res) => {
  try {
    const productId = req.params.productId;
    const questionText = String(req.body?.question || "").trim();
    const images = extractIncomingImageUrls(req);

    if (!questionText && images.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Question text or image is required",
      });
    }

    const product = await Product.findById(productId).select("_id seller").lean();
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (sameId(product?.seller, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You cannot ask a question on your own product.",
      });
    }

    const question = await Question.create({
      product: productId,
      user: req.user._id,
      name: req.user.name,
      question: questionText || "Image question",
      image: images[0] || "",
      images,
    });

    return res.status(201).json({ success: true, data: question });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Update question by owner
// @route   PUT /api/questions/:questionId
// @access  Private
exports.updateQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.questionId);
    if (!question) {
      return res.status(404).json({ success: false, message: "Question not found" });
    }

    if (!sameId(question.user, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Only question owner can edit this question.",
      });
    }

    const nextText = req.body?.question;
    const removeImage = parseBoolean(req.body?.removeImage);
    const retainedImages = parseRetainedImageUrls(req.body?.retainedImages);
    const hasRetainedImages = retainedImages !== null;
    const nextImages = extractIncomingImageUrls(req);

    if (nextText !== undefined) {
      question.question = String(nextText || "").trim() || "Image question";
    }

    let resolvedImages = getEntityImageList(question);
    if (removeImage) {
      resolvedImages = [];
    }

    if (hasRetainedImages) {
      resolvedImages = retainedImages;
    }

    if (nextImages.length > 0) {
      if (resolvedImages.length + nextImages.length > MAX_QNA_IMAGES) {
        return res.status(400).json({
          success: false,
          message: `You can upload maximum ${MAX_QNA_IMAGES} images.`,
        });
      }
      resolvedImages = [...resolvedImages, ...nextImages];
    }

    applyEntityImages(question, resolvedImages);

    if (!question.question && getEntityImageList(question).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Question cannot be empty.",
      });
    }

    await question.save();
    return res.status(200).json({ success: true, data: question });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Delete question by owner
// @route   DELETE /api/questions/:questionId
// @access  Private
exports.deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.questionId);
    if (!question) {
      return res.status(404).json({ success: false, message: "Question not found" });
    }

    if (!sameId(question.user, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Only question owner can delete this question.",
      });
    }

    await question.deleteOne();
    return res.status(200).json({ success: true, message: "Question deleted" });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Get questions for a product
// @route   GET /api/questions/product/:productId
// @access  Public
exports.getProductQuestions = async (req, res) => {
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
    const sort = normalizeQuestionSort(req.query?.sort);
    const filter = normalizeQuestionFilter(req.query?.filter);
    const skip = (page - 1) * limit;
    const objectId = new mongoose.Types.ObjectId(productId);

    const pipeline = [
      {
        $match: {
          product: objectId,
        },
      },
      {
        $addFields: {
          upvoteCount: { $size: { $ifNull: ["$upvotes", []] } },
          downvoteCount: { $size: { $ifNull: ["$downvotes", []] } },
          messageCount: { $size: { $ifNull: ["$messages", []] } },
          sellerMessageCount: {
            $size: {
              $filter: {
                input: { $ifNull: ["$messages", []] },
                as: "msg",
                cond: { $eq: ["$$msg.role", "seller"] },
              },
            },
          },
        },
      },
      {
        $addFields: {
          voteScore: { $subtract: ["$upvoteCount", "$downvoteCount"] },
          hasSellerAnswer: { $gt: ["$sellerMessageCount", 0] },
        },
      },
    ];

    if (filter === "answered") {
      pipeline.push({ $match: { hasSellerAnswer: true } });
    } else if (filter === "unanswered") {
      pipeline.push({ $match: { hasSellerAnswer: false } });
    }

    pipeline.push({ $sort: getQuestionSortStage(sort) });

    pipeline.push({
      $facet: {
        data: [{ $skip: skip }, { $limit: limit }],
        meta: [{ $count: "total" }],
      },
    });

    const [result] = await Question.aggregate(pipeline);
    const questions = Array.isArray(result?.data) ? result.data : [];
    const total = Number(result?.meta?.[0]?.total || 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return res.status(200).json({
      success: true,
      data: questions,
      meta: {
        page,
        limit,
        total,
        totalPages,
        sort,
        filter,
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Vote on a question
// @route   POST /api/questions/:questionId/vote
// @access  Private
exports.voteQuestion = async (req, res) => {
  try {
    const voteType = normalizeVoteType(req.body?.voteType);
    if (!voteType) {
      return res.status(400).json({
        success: false,
        message: "voteType must be either 'upvote' or 'downvote'",
      });
    }

    const question = await Question.findById(req.params.questionId);
    if (!question) {
      return res.status(404).json({ success: false, message: "Question not found" });
    }

    if (sameId(question.user, req.user._id)) {
      return res.status(400).json({
        success: false,
        message: "You cannot vote on your own question.",
      });
    }

    applyVoteToggle(question, req.user._id, voteType);
    await question.save();
    return res.status(200).json({ success: true, data: question });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Seller answers a question
// @route   POST /api/questions/:questionId/answer
// @access  Private (Product seller only)
exports.answerQuestion = async (req, res) => {
  try {
    const text = String(req.body?.text || "").trim();
    const images = extractIncomingImageUrls(req);
    if (!text && images.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Answer text or image is required",
      });
    }

    const question = await Question.findById(req.params.questionId);
    if (!question) {
      return res.status(404).json({ success: false, message: "Question not found" });
    }

    const sellerId = await findProductSellerId(question.product);
    if (!sellerId || !sameId(sellerId, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Only this product seller can answer this question.",
      });
    }

    question.messages.push({
      user: req.user._id,
      name: req.user.name,
      role: "seller",
      text: text || "Image answer",
      image: images[0] || "",
      images,
    });

    await question.save();
    return res.status(200).json({ success: true, data: question });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Continue Q&A conversation (question owner or product seller)
// @route   POST /api/questions/:questionId/message
// @access  Private
exports.replyToQuestion = async (req, res) => {
  try {
    const text = String(req.body?.text || "").trim();
    const images = extractIncomingImageUrls(req);
    if (!text && images.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Message text or image is required",
      });
    }

    const question = await Question.findById(req.params.questionId);
    if (!question) {
      return res.status(404).json({ success: false, message: "Question not found" });
    }

    const sellerId = await findProductSellerId(question.product);
    const isQuestionOwner = sameId(question.user, req.user._id);
    const isSeller = sellerId && sameId(sellerId, req.user._id);

    if (!isQuestionOwner && !isSeller) {
      return res.status(403).json({
        success: false,
        message: "Only the question owner and product seller can join this conversation.",
      });
    }

    if (isQuestionOwner) {
      const sellerReplied = (question.messages || []).some(
        (item) => String(item?.role || "").toLowerCase() === "seller",
      );
      if (!sellerReplied) {
        return res.status(400).json({
          success: false,
          message: "Please wait for the seller to answer first.",
        });
      }
    }

    question.messages.push({
      user: req.user._id,
      name: req.user.name,
      role: isSeller ? "seller" : "questioner",
      text: text || "Image message",
      image: images[0] || "",
      images,
    });

    await question.save();
    return res.status(200).json({ success: true, data: question });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Edit own Q&A message
// @route   PUT /api/questions/:questionId/messages/:messageId
// @access  Private
exports.updateQuestionMessage = async (req, res) => {
  try {
    const question = await Question.findById(req.params.questionId);
    if (!question) {
      return res.status(404).json({ success: false, message: "Question not found" });
    }

    const message = question.messages.id(req.params.messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    if (!sameId(message.user, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Only message owner can edit this message.",
      });
    }

    const nextText = req.body?.text;
    const removeImage = parseBoolean(req.body?.removeImage);
    const retainedImages = parseRetainedImageUrls(req.body?.retainedImages);
    const hasRetainedImages = retainedImages !== null;
    const nextImages = extractIncomingImageUrls(req);

    if (nextText !== undefined) {
      message.text = String(nextText || "").trim() || "Image message";
    }

    let resolvedImages = getEntityImageList(message);
    if (removeImage) {
      resolvedImages = [];
    }

    if (hasRetainedImages) {
      resolvedImages = retainedImages;
    }

    if (nextImages.length > 0) {
      if (resolvedImages.length + nextImages.length > MAX_QNA_IMAGES) {
        return res.status(400).json({
          success: false,
          message: `You can upload maximum ${MAX_QNA_IMAGES} images.`,
        });
      }
      resolvedImages = [...resolvedImages, ...nextImages];
    }

    applyEntityImages(message, resolvedImages);

    if (!message.text && getEntityImageList(message).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Message cannot be empty.",
      });
    }

    await question.save();
    return res.status(200).json({ success: true, data: question });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Delete own Q&A message
// @route   DELETE /api/questions/:questionId/messages/:messageId
// @access  Private
exports.deleteQuestionMessage = async (req, res) => {
  try {
    const question = await Question.findById(req.params.questionId);
    if (!question) {
      return res.status(404).json({ success: false, message: "Question not found" });
    }

    const message = question.messages.id(req.params.messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    if (!sameId(message.user, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Only message owner can delete this message.",
      });
    }

    message.deleteOne();
    await question.save();
    return res.status(200).json({ success: true, data: question });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};
