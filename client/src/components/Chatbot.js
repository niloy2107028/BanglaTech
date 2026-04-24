import React, { useEffect, useRef, useState } from "react";
import axios from "../api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useLanguage } from "../context/LanguageContext";
import "./Chatbot.css";

const CHAT_HISTORY_STORAGE_KEY = "banglamart_chat_history_v1";

function getDefaultChatHistory(initialMessage) {
  return [
    {
      role: "assistant",
      content: initialMessage,
      isDefaultGreeting: true,
    },
  ];
}

function readStoredChatHistory(initialMessage) {
  if (typeof window === "undefined") return getDefaultChatHistory(initialMessage);

  try {
    const raw = window.sessionStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
    if (!raw) return getDefaultChatHistory(initialMessage);

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return getDefaultChatHistory(initialMessage);
    }

    const sanitized = parsed
      .map((item) => ({
        role: item?.role === "user" ? "user" : "assistant",
        content: String(item?.content || ""),
        imageDataUrl:
          typeof item?.imageDataUrl === "string" &&
          item.imageDataUrl.startsWith("data:image/")
            ? item.imageDataUrl
            : "",
        cards: Array.isArray(item?.cards) ? item.cards : [],
        products: Array.isArray(item?.products) ? item.products : [],
        isDefaultGreeting: Boolean(item?.isDefaultGreeting),
      }))
      .filter(
        (item) => item.content.trim().length > 0 || (Array.isArray(item.cards) && item.cards.length > 0),
      );

    return sanitized.length > 0
      ? sanitized
      : getDefaultChatHistory(initialMessage);
  } catch (error) {
    return getDefaultChatHistory(initialMessage);
  }
}

const Chatbot = () => {
  const { t, language } = useLanguage();
  const initialMessage = t(
    "chatbot.initialMessage",
    {},
    "Hello! I am the BanglaMart bot. How can I help you today?",
  );
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState(() =>
    readStoredChatHistory(initialMessage),
  );
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceMode, setVoiceMode] = useState("idle");
  const [speechSupported, setSpeechSupported] = useState(true);

  const scrollRef = useRef();
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);
  const recognitionSessionRef = useRef(0);
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
      const key = String(card?.productId || card?.name || "")
        .trim()
        .toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      output.push(card);
    }

    return output;
  };

  useEffect(() => {
    setChatHistory((prev) => {
      if (
        prev.length === 1 &&
        prev[0].role === "assistant" &&
        prev[0].isDefaultGreeting
      ) {
        return getDefaultChatHistory(initialMessage);
      }

      return prev;
    });
  }, [language, initialMessage]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isOpen]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 140)}px`;
  }, [message]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      window.sessionStorage.setItem(
        CHAT_HISTORY_STORAGE_KEY,
        JSON.stringify(chatHistory),
      );
    } catch (error) {
      // Keep chat usable even when session storage is unavailable.
    }
  }, [chatHistory]);

  useEffect(() => {
    const supported =
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
    setSpeechSupported(supported);
  }, []);

  useEffect(() => () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (error) {
        // Ignore abort errors on unmount.
      }
      recognitionRef.current = null;
    }
  }, []);

  const pushAssistantMessage = (content) => {
    setChatHistory((prev) => [...prev, { role: "assistant", content }]);
  };

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

      const cards = Array.isArray(data?.cards) ? data.cards : [];
      const replyText = String(data?.reply || "").trim();

      const aiMessage = {
        role: "assistant",
        content: replyText || (cards.length > 0 ? "" : "Sorry, no response was generated."),
        cards,
        products: Array.isArray(data?.products)
          ? data.products
              .map((product) => String(product?._id || product?.id || "").trim())
              .filter(Boolean)
          : [],
      };
      setChatHistory((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chatbot Error:", error);
      pushAssistantMessage(t("chatbot.error"));
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    await sendTextMessage(message);
  };

  const getSpeechLocales = () => {
    const browserLocale = String(navigator?.language || "en-US").trim() || "en-US";
    const normalizedBrowserLocale = browserLocale.toLowerCase();
    const localePool = normalizedBrowserLocale.startsWith("en")
      ? [browserLocale, "en-US", "en-GB"]
      : ["en-US", "en-GB", browserLocale];

    return Array.from(new Set(localePool.filter(Boolean))).slice(0, 4);
  };

  const startVoiceRecognition = async ({
    languageIndex = 0,
    preserveTranscript = false,
  } = {}) => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      pushAssistantMessage(
        "Voice input is unavailable in this browser. Please use Edge/Chrome.",
      );
      return;
    }

    const locales = getSpeechLocales();
    const selectedLocale = locales[Math.min(languageIndex, locales.length - 1)] || "en-US";

    if (!preserveTranscript) {
      baseMessageRef.current = String(message || "").trim();
      finalTranscriptRef.current = "";
    }

    const recognition = new SpeechRecognition();
    recognitionSessionRef.current += 1;
    const sessionId = recognitionSessionRef.current;
    recognitionRef.current = recognition;

    recognition.lang = selectedLocale;
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      if (recognitionSessionRef.current !== sessionId) return;
      setIsListening(true);
      setVoiceMode("listening");
    };

    recognition.onresult = (event) => {
      if (recognitionSessionRef.current !== sessionId) return;

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

    recognition.onerror = async (event) => {
      if (recognitionSessionRef.current !== sessionId) return;

      const errorCode = String(event?.error || "").toLowerCase();
      console.error("Speech recognition error:", errorCode);

      if (errorCode === "network" && languageIndex < locales.length - 1) {
        setVoiceMode("retrying");
        await startVoiceRecognition({
          languageIndex: languageIndex + 1,
          preserveTranscript: true,
        });
        return;
      }

      setIsListening(false);
      setVoiceMode("idle");
      recognitionRef.current = null;

      if (["aborted", "no-speech"].includes(errorCode)) return;

      if (["not-allowed", "service-not-allowed"].includes(errorCode)) {
        pushAssistantMessage(
          "Microphone permission blocked. Browser settings theke mic allow korun.",
        );
      }
    };

    recognition.onend = () => {
      if (recognitionSessionRef.current !== sessionId) return;
      setIsListening(false);
      setVoiceMode("idle");
      recognitionRef.current = null;
    };

    try {
      recognition.start();
    } catch (error) {
      setIsListening(false);
      setVoiceMode("idle");
      recognitionRef.current = null;
      pushAssistantMessage("Could not start microphone. Please try again.");
    }
  };

  const handleVoiceInput = async () => {
    if (!speechSupported) {
      pushAssistantMessage(
        "Voice input is not supported in this browser. Please use Edge/Chrome or type your message.",
      );
      return;
    }

    if (isListening && recognitionRef.current) {
      try {
        recognitionSessionRef.current += 1;
        recognitionRef.current.stop();
      } catch (error) {
        console.error("Voice stop error:", error);
      }
      setIsListening(false);
      setVoiceMode("idle");
      recognitionRef.current = null;
      return;
    }

    if (!window.isSecureContext) {
      pushAssistantMessage(
        "Voice input needs a secure context (HTTPS or localhost).",
      );
      return;
    }

    await startVoiceRecognition({ languageIndex: 0, preserveTranscript: false });
  };

  const voiceButtonText = (() => {
    if (!speechSupported) return "N/A";
    if (isListening) return "Stop";
    if (voiceMode === "retrying") return "...";
    return "Mic";
  })();

  const listeningText = t("chatbot.listening", {}, "Listening...");
  const typingText = t("chatbot.typing", {}, "Typing");

  const formatRatingText = (value) => {
    const rating = Number(value || 0);
    if (!Number.isFinite(rating) || rating <= 0) return "";
    return `* ${rating.toFixed(1)}`;
  };

  return (
    <div className={`chatbot-wrapper ${isOpen ? "open" : ""}`}>
      <button
        className={`chat-toggle-btn ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        <span className="chat-toggle-indicator" />
        <span className="chat-toggle-icon">{isOpen ? "X" : "AI"}</span>
        <span className="chat-toggle-label">{isOpen ? "Close" : "Ask AI"}</span>
      </button>

      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="chat-header-main">
              <h4>{t("chatbot.title")}</h4>
              <p>{t("chatbot.support")}</p>
            </div>
            <button
              type="button"
              className="chat-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat window"
            >
              X
            </button>
          </div>

          <div className="chat-messages">
            {chatHistory.map((item, index) => {
              const cards = uniqueCards(item?.cards);
              const hasCards = cards.length > 0;
              const textContent = String(item?.content || "").trim();
              const hasText = textContent.length > 0;
              const showRoleLabel = !(item.role === "assistant" && hasCards && !hasText);

              return (
                <div key={index} className={`message-row ${item.role}`}>
                  <div className={`message-bubble ${item.role}`}>
                    {showRoleLabel && (
                      <p className="message-role">
                        {item.role === "user" ? "You" : "BanglaMart AI"}
                      </p>
                    )}
                    <div className="message-content">
                      {hasText && item.role === "user" && item.imageDataUrl ? (
                        <div className="user-inline-content">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              a: ({ node, ...props }) => (
                                <a
                                  {...props}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                />
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
                      ) : hasText ? (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            a: ({ node, ...props }) => (
                              <a
                                {...props}
                                target="_blank"
                                rel="noopener noreferrer"
                              />
                            ),
                          }}
                        >
                          {item.content}
                        </ReactMarkdown>
                      ) : null}
                      {hasCards && (
                        <div className="chatbot-cards-list">
                          {cards.map((card, idx) => (
                            <div
                              className="chatbot-card"
                              key={`${card?.productId || card?.name || "card"}-${idx}`}
                            >
                              {card?.image && (
                                <img
                                  src={card.image}
                                  alt={card?.name || "Product"}
                                  className="chatbot-card-image"
                                />
                              )}
                              <div className="chatbot-card-body">
                                <p className="chatbot-card-title">
                                  {card?.name || "Product"}
                                </p>
                                <p className="chatbot-card-price">
                                  {(card?.currencySymbol || "Tk ") +
                                    Number(card?.price || 0).toLocaleString()}
                                  {formatRatingText(card?.rating) && (
                                    <span className="chatbot-card-rating">
                                      {` | ${formatRatingText(card?.rating)}`}
                                    </span>
                                  )}
                                </p>
                                <p className="chatbot-card-description">
                                  {card?.description || ""}
                                </p>
                                {card?.url && (
                                  <a
                                    className="chatbot-card-link"
                                    href={card.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
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
                </div>
              );
            })}
            {loading && (
              <div className="message-row assistant">
                <div className="message-bubble assistant loading-dots typing-indicator">
                  <p className="message-role">BanglaMart AI</p>
                  <div className="typing-row">
                    <span className="typing-text">{typingText}</span>
                    <div className="loading-dots-track" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={scrollRef}></div>
          </div>

          <form className="chat-input-area" onSubmit={handleSendMessage}>
            <div className="chat-controls-row">
              <button
                type="button"
                className={`voice-btn ${isListening ? "active listening" : ""}`}
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
                <span className="voice-btn-label">{voiceButtonText}</span>
                {isListening && (
                  <>
                    <span className="voice-btn-ripple voice-btn-ripple-one" aria-hidden="true" />
                    <span className="voice-btn-ripple voice-btn-ripple-two" aria-hidden="true" />
                  </>
                )}
              </button>
              <textarea
                ref={textareaRef}
                placeholder={t("chatbot.placeholder")}
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
                className="send-btn"
                disabled={loading || !String(message || "").trim()}
              >
                {t("chatbot.send")}
              </button>
            </div>
            {isListening && (
              <div className="voice-listening-indicator" aria-live="polite">
                <span className="voice-listening-dot" />
                <span className="voice-listening-text">{listeningText}</span>
                <span className="voice-bars" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
};

export default Chatbot;

