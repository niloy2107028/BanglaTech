import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm"; // Table support
import "./Chatbot.css";

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([
    {
      role: "assistant",
      content: "হ্যালো! আমি বাংলামার্ট বট। আপনাকে কীভাবে সাহায্য করতে পারি?",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef();

  // প্রতিবার মেসেজ আসার পর স্ক্রল নিচে নামানো
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage = { role: "user", content: message };
    setChatHistory((prev) => [...prev, userMessage]);
    setMessage("");
    setLoading(true);

    try {
      // ব্যাকএন্ডে মেসেজ এবং হিস্টোরি পাঠানো
      const { data } = await axios.post("/api/chatbot/chat", {
        message: message,
        history: chatHistory.slice(-10), // শেষ ১০টি মেসেজ হিস্টোরি হিসেবে যাচ্ছে
      });

      const aiMessage = { role: "assistant", content: data.reply };
      setChatHistory((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chatbot Error:", error);
      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "দুঃখিত, বর্তমানে আমার সিস্টেমে সমস্যা হচ্ছে।",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot-wrapper">
      {/* ফ্লোটিং আইকন/বাটন */}
      <button className="chat-toggle-btn" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? "✖" : "💬"}
      </button>

      {/* চ্যাট উইন্ডো */}
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
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({ node, ...props }) => (
                        <a {...props} target="_blank" rel="noopener noreferrer" />
                      ),
                    }}
                  >
                    {item.content}
                  </ReactMarkdown>
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
            <button type="submit" disabled={loading}>
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
