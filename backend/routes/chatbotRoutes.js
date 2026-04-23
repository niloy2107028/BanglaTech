const express = require("express");
const router = express.Router();
const chatbotController = require("../controllers/chatbotController");
const { audioUpload, imageUpload } = require("../middleware/upload");

// POST /api/chatbot/chat
router.post("/chat", chatbotController.getChatResponse);

// POST /api/chatbot/image-search
router.post("/image-search", imageUpload.single("image"), chatbotController.imageSearch);

// POST /api/chatbot/voice-search
router.post("/voice-search", audioUpload.single("audio"), chatbotController.voiceSearch);

module.exports = router;
