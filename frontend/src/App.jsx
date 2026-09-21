import { useState } from "react";
import "./App.css";

function App() {
  const initialMessage = {
    sender: "bot",
    text: "Hello! 👋 Welcome to Innovision Industries. How can I help you today?",
    time: getTime(),
  };

  const [messages, setMessages] = useState([initialMessage]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  function getTime() {
    return new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const sendMessage = async (messageText = input) => {
  if (messageText.trim() === "" || isTyping) return;

  const userMessage = {
    sender: "user",
    text: messageText,
    time: getTime(),
  };

  setMessages((prev) => [...prev, userMessage]);
  setInput("");
  setIsTyping(true);

  try {
    const response = await fetch("http://localhost:5000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: messageText,
      }),
    });

    const data = await response.json();

    const botMessage = {
      sender: "bot",
      text: data.reply,
      time: getTime(),
    };

    setMessages((prev) => [...prev, botMessage]);
  } catch (error) {
    console.error("Error communicating with backend:", error);

    const errorMessage = {
      sender: "bot",
      text: "Sorry, I couldn't connect to the server. Please try again.",
      time: getTime(),
    };

    setMessages((prev) => [...prev, errorMessage]);
  } finally {
    setIsTyping(false);
  }
};

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([initialMessage]);
    setIsTyping(false);
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot">

        {/* Header */}
        <div className="chat-header">
          <div className="company-info">
            <div className="company-icon">I</div>

            <div>
              <h2>Innovision Industries</h2>
              <p>AI Manufacturing Assistant</p>
            </div>
          </div>

          <div className="header-actions">
            <div className="status">
              <span></span>
              Online
            </div>

            <button className="clear-button" onClick={clearChat}>
              Clear
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="chat-messages">

          {messages.map((message, index) => (
            <div
              key={index}
              className={`message ${
                message.sender === "user"
                  ? "user-message"
                  : "bot-message"
              }`}
            >
              {message.sender === "bot" && (
                <div className="bot-icon">🤖</div>
              )}

              <div>
                <div className="message-content">
                  {message.text}
                </div>

                <div className="message-time">
                  {message.time}
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="message bot-message">
              <div className="bot-icon">🤖</div>

              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}

          {/* Suggested questions */}
          {messages.length === 1 && !isTyping && (
            <div className="suggestions">
              <p>Try asking:</p>

              <button
                onClick={() =>
                  sendMessage("What products do you manufacture?")
                }
              >
                What products do you manufacture?
              </button>

              <button
                onClick={() =>
                  sendMessage("What manufacturing services do you provide?")
                }
              >
                What manufacturing services do you provide?
              </button>

              <button
                onClick={() =>
                  sendMessage("I want to make an enquiry")
                }
              >
                I want to make an enquiry
              </button>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="chat-input-area">
          <input
            type="text"
            placeholder="Ask about our products or services..."
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyPress}
          />

          <button onClick={() => sendMessage()}>
            Send
          </button>
        </div>

      </div>
    </div>
  );
}

export default App;