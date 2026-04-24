const express = require("express");
const router = express.Router();
const chatbotController = require("../controllers/chatbotController");
const { audioUpload, imageUpload } = require("../middleware/upload");
const { optionalProtect } = require("../middleware/auth");

router.use(optionalProtect);

// POST /api/chatbot/chat
router.post("/chat", chatbotController.getChatResponse);

// POST /api/chatbot/image-search
router.post("/image-search", imageUpload.single("image"), chatbotController.imageSearch);

// POST /api/chatbot/voice-search
router.post("/voice-search", (req, res, next) => {
  audioUpload.single("audio")(req, res, (uploadError) => {
    if (uploadError) {
      return res.status(400).json({
        reply: "Unsupported or invalid audio format. Please record again and retry.",
        error: uploadError.message || "Audio upload failed",
      });
    }

    return chatbotController.voiceSearch(req, res, next);
  });
});

module.exports = router;
