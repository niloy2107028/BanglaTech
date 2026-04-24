const express = require("express");

const {
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getProductQuestions,
  voteQuestion,
  answerQuestion,
  replyToQuestion,
  updateQuestionMessage,
  deleteQuestionMessage,
} = require("../controllers/questionController");
const { protect } = require("../middleware/auth");
const { imageUpload } = require("../middleware/upload");

const router = express.Router();
const questionImageUpload = imageUpload.fields([
  { name: "image", maxCount: 1 },
  { name: "images", maxCount: 3 },
]);

router.get("/product/:productId", getProductQuestions);
router.post("/product/:productId", protect, questionImageUpload, createQuestion);
router.put("/:questionId", protect, questionImageUpload, updateQuestion);
router.delete("/:questionId", protect, deleteQuestion);
router.post("/:questionId/vote", protect, voteQuestion);
router.post("/:questionId/answer", protect, questionImageUpload, answerQuestion);
router.post("/:questionId/message", protect, questionImageUpload, replyToQuestion);
router.put("/:questionId/messages/:messageId", protect, questionImageUpload, updateQuestionMessage);
router.delete("/:questionId/messages/:messageId", protect, deleteQuestionMessage);

module.exports = router;
