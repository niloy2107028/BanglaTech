import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./Chatbot.css";

const CHAT_HISTORY_STORAGE_KEY = "banglamart_chat_history_v1";
const DEFAULT_CHAT_HISTORY = [
  {
    role: "assistant",
    content: "Hello! I am your assistant. How can I help you today?",
  },
];

function readStoredChatHistory() {
  if (typeof window === "undefined") return DEFAULT_CHAT_HISTORY;

  try {
    const raw = window.sessionStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
    if (!raw) return DEFAULT_CHAT_HISTORY;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_CHAT_HISTORY;
    }

    const sanitized = parsed
      .map((item) => ({
        role: item?.role === "user" ? "user" : "assistant",
        content: String(item?.content || ""),
        imageDataUrl:
          typeof item?.imageDataUrl === "string" && item.imageDataUrl.startsWith("data:image/")
            ? item.imageDataUrl
            : "",
        cards: Array.isArray(item?.cards) ? item.cards : [],
        products: Array.isArray(item?.products) ? item.products : [],
      }))
      .filter((item) => item.content.trim().length > 0);

    return sanitized.length > 0 ? sanitized : DEFAULT_CHAT_HISTORY;
  } catch (error) {
    return DEFAULT_CHAT_HISTORY;
  }
}

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState(() => readStoredChatHistory());
  const [loading, setLoading] = useState(false);
  const [pendingImage, setPendingImage] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceMode, setVoiceMode] = useState("idle");
  const [speechSupported, setSpeechSupported] = useState(true);

  const scrollRef = useRef();
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const baseMessageRef = useRef("");
  const finalTranscriptRef = useRef("");

  const toHistoryPayload = (messages) =>
    messages.slice(-10).map((item) => ({
      role: item?.role,
      content: String(item?.content || ""),
      products: Array.isArray(item?.products)
        ? item.products
        : Array.isArray(item?.cards)
          ? item.cards
            .map((card) => String(card?.productId || "").trim())
            .filter(Boolean)
          : [],
    }));

  const uniqueCards = (cards) => {
    if (!Array.isArray(cards)) return [];
    const seen = new Set();
    const output = [];

    for (const card of cards) {
      const key = String(card?.productId || card?.name || "").trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      output.push(card);
    }

    return output;
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      window.sessionStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(chatHistory));
    } catch (error) {
      // Ignore storage write errors to keep chat usable.
    }
  }, [chatHistory]);

  useEffect(() => {
    const supported =
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
    setSpeechSupported(supported);
  }, []);

  const pushAssistantMessage = (content) => {
    setChatHistory((prev) => [...prev, { role: "assistant", content }]);
  };

  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Failed to read image file"));
      reader.readAsDataURL(file);
    });

  const sendTextMessage = async (rawText) => {
    const outgoingText = String(rawText || "").trim();
    if (!outgoingText) return;

    const userMessage = { role: "user", content: outgoingText };
    const nextHistory = [...chatHistory, userMessage];
    setChatHistory(nextHistory);
    setMessage("");
    setLoading(true);

    try {
      const { data } = await axios.post("/api/chatbot/chat", {
        message: outgoingText,
        history: toHistoryPayload(nextHistory),
      });

      const aiMessage = {
        role: "assistant",
        content: data?.reply || "Sorry, no response was generated.",
        cards: Array.isArray(data?.cards) ? data.cards : [],
        products: Array.isArray(data?.products)
          ? data.products
            .map((product) => String(product?._id || product?.id || "").trim())
            .filter(Boolean)
          : [],
      };
      setChatHistory((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chatbot Error:", error);
      pushAssistantMessage("Sorry, the chatbot is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  };

  const resetPendingImage = () => {
    setPendingImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSelectImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (pendingImage?.previewUrl) {
      URL.revokeObjectURL(pendingImage.previewUrl);
    }

    const previewUrl = URL.createObjectURL(file);
    setPendingImage({ file, previewUrl, name: file.name || "image" });
  };

  const sendImageMessage = async () => {
    if (!pendingImage?.file) return;

    const userText = String(message || "").trim();
    let messageImageDataUrl = "";

    try {
      messageImageDataUrl = await fileToDataUrl(pendingImage.file);
    } catch (error) {
      messageImageDataUrl = "";
    }

    const userMessage = {
      role: "user",
      content: userText || "Image shared",
      imageDataUrl: messageImageDataUrl,
    };
    const nextHistory = [...chatHistory, userMessage];

    setChatHistory(nextHistory);
    setLoading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("image", pendingImage.file);
      if (userText) {
        formData.append("prompt", userText);
      }
      formData.append("history", JSON.stringify(toHistoryPayload(nextHistory)));

      const { data } = await axios.post("/api/chatbot/image-search", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const caption = String(data?.caption || "").trim();
      const lowConfidence = Boolean(data?.lowConfidence);
      const aiMessage = {
        role: "assistant",
        content: lowConfidence
          ? data?.reply || "Sorry couldn't understand the image provided."
          : caption
          ? `Image summary: ${caption}\n\n${data?.reply || "Here are some matching products."}`
          : data?.reply || "No response from image search.",
        cards: Array.isArray(data?.cards) ? data.cards : [],
        products: Array.isArray(data?.products)
          ? data.products
            .map((product) => String(product?._id || product?.id || "").trim())
            .filter(Boolean)
          : [],
      };

      setChatHistory((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Image Search Error:", error);
      pushAssistantMessage("Image search is temporarily unavailable.");
    } finally {
      if (pendingImage?.previewUrl) {
        URL.revokeObjectURL(pendingImage.previewUrl);
      }
      resetPendingImage();
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (pendingImage?.file) {
      await sendImageMessage();
      return;
    }

    await sendTextMessage(message);
  };

  const handleVoiceInput = () => {
    if (!speechSupported) {
      pushAssistantMessage(
        "Voice input is not supported in this browser. Please use Edge/Chrome, or type your message.",
      );
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      pushAssistantMessage(
        "Browser speech recognition is unavailable. Please use Chrome or Edge and allow microphone access.",
      );
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = navigator.language || "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceMode("listening");
      baseMessageRef.current = String(message || "").trim();
      finalTranscriptRef.current = "";
    };

    recognition.onresult = (event) => {
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const text = event.results[i]?.[0]?.transcript || "";
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += ` ${text}`;
        } else {
          interim += ` ${text}`;
        }
      }

      const combined = [
        baseMessageRef.current,
        finalTranscriptRef.current.trim(),
        interim.trim(),
      ]
        .filter(Boolean)
        .join(" ")
        .trim();

      setMessage(combined);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event?.error);
      setIsListening(false);
      setVoiceMode("idle");
      pushAssistantMessage(
        "Speech recognition failed. Check microphone permission and try again.",
      );
    };

    recognition.onend = () => {
      setIsListening(false);
      setVoiceMode("idle");
    };

    recognition.start();
  };

  const voiceButtonText = (() => {
    if (!speechSupported) return "N/A";
    if (isListening) return "Stop";
    if (voiceMode === "listening") return "...";
    return "Mic";
  })();

  return (
    <div className="chatbot-wrapper">
      <button className="chat-toggle-btn" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? "X" : "Chat"}
      </button>

      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <h4>BanglaMart Bot</h4>
            <p>24/7 Support</p>
          </div>

          <div className="chat-messages">
            {chatHistory.map((item, index) => (
              <div key={index} className={`message-bubble ${item.role}`}>
                <div className="message-content">
                  {item.role === "user" && item.imageDataUrl ? (
                    <div className="user-inline-content">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          a: ({ node, ...props }) => (
                            <a {...props} rel="noopener noreferrer" />
                          ),
                        }}
                      >
                        {item.content}
                      </ReactMarkdown>
                      <img
                        src={item.imageDataUrl}
                        alt="Uploaded"
                        className="user-inline-image"
                      />
                    </div>
                  ) : (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: ({ node, ...props }) => (
                          <a {...props} rel="noopener noreferrer" />
                        ),
                      }}
                    >
                      {item.content}
                    </ReactMarkdown>
                  )}
                  {Array.isArray(item.cards) && uniqueCards(item.cards).length > 0 && (
                    <div className="chatbot-cards-list">
                      {uniqueCards(item.cards).map((card, idx) => (
                        <div className="chatbot-card" key={`${card?.productId || card?.name || "card"}-${idx}`}>
                          {card?.image && (
                            <img
                              src={card.image}
                              alt={card?.name || "Product"}
                              className="chatbot-card-image"
                            />
                          )}
                          <div className="chatbot-card-body">
                            <p className="chatbot-card-title">{card?.name || "Product"}</p>
                            <p className="chatbot-card-price">
                              {(card?.currencySymbol || "৳") + Number(card?.price || 0)}
                            </p>
                            <p className="chatbot-card-description">{card?.description || ""}</p>
                            {card?.url && (
                              <a className="chatbot-card-link" href={card.url}>
                                View Product
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="message-bubble assistant loading-dots">
                <span>.</span>
                <span>.</span>
                <span>.</span>
              </div>
            )}
            <div ref={scrollRef}></div>
          </div>

          <form className="chat-input-area" onSubmit={handleSendMessage}>
            <button
              type="button"
              className="image-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              title="Attach image"
            >
              Img
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden-file-input"
              onChange={handleSelectImage}
            />
            <button
              type="button"
              className={`voice-btn ${isListening ? "active" : ""}`}
              onClick={handleVoiceInput}
              disabled={loading || !speechSupported}
              title={
                !speechSupported
                  ? "Speech not supported in this browser"
                  : isListening
                    ? "Stop recording"
                    : "Start voice input"
              }
            >
              {voiceButtonText}
            </button>
            <textarea
              placeholder="Ask me anything..."
              value={message}
              rows="1"
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
            <button
              type="submit"
              disabled={loading || (!String(message || "").trim() && !pendingImage?.file)}
            >
              Send
            </button>
            {pendingImage?.file && (
              <div className="pending-image-preview">
                <img src={pendingImage.previewUrl} alt={pendingImage.name} />
                <div className="pending-image-meta">
                  <span>{pendingImage.name}</span>
                  <button
                    type="button"
                    className="pending-image-remove"
                    onClick={() => {
                      if (pendingImage?.previewUrl) {
                        URL.revokeObjectURL(pendingImage.previewUrl);
                      }
                      resetPendingImage();
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
