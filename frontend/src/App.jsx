
import { useState } from "react";
import "./App.css";
import AdminDashboard from "./AdminDashboard";

function App() {
  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hello! Welcome to Innovision Industries. How can I help you today?",
    },
  ]);

  const [loading, setLoading] = useState(false);

  const [showEnquiryForm, setShowEnquiryForm] = useState(false);
  const [enquiryLoading, setEnquiryLoading] = useState(false);
  const [enquiryStatus, setEnquiryStatus] = useState("");

  const [showAdminDashboard, setShowAdminDashboard] = useState(false);

  const sendMessage = async (event) => {
    event.preventDefault();

    const userMessage = message.trim();

    if (!userMessage || loading) return;

    const history = messages
      .slice(1)
      .map((item) => ({
        role: item.role === "bot" ? "assistant" : "user",
        content: item.text,
      }))
      .slice(-10);

    setMessages((previous) => [
      ...previous,
      { role: "user", text: userMessage },
    ]);

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          history: history,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to get a response.");
      }

      setMessages((previous) => [
        ...previous,
        { role: "bot", text: data.reply },
      ]);
    } catch (error) {
      setMessages((previous) => [
        ...previous,
        {
          role: "bot",
          text: "Sorry, I couldn't connect to the AI service. Please try again.",
        },
      ]);

      console.error("Chat error:", error);
    } finally {
      setLoading(false);
    }
  };

  const submitEnquiry = async (event) => {
    event.preventDefault();

    if (enquiryLoading) return;

    const form = event.currentTarget;
    const formData = new FormData(form);

    const enquiry = {
      customerName: formData.get("customerName").trim(),
      companyName: formData.get("companyName").trim(),
      email: formData.get("email").trim(),
      phone: formData.get("phone").trim(),
      product: formData.get("product"),
      enquiryDetails: formData.get("enquiryDetails").trim(),
    };

    setEnquiryLoading(true);
    setEnquiryStatus("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/enquiries",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(enquiry),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to submit your enquiry."
        );
      }

      setEnquiryStatus(
        `Success! Your enquiry has been submitted. Reference ID: ${data.enquiryId}`
      );

      form.reset();
    } catch (error) {
      setEnquiryStatus(
        error.message ||
          "Unable to submit your enquiry. Please try again."
      );
    } finally {
      setEnquiryLoading(false);
    }
  };

  // Display the admin dashboard instead of the chatbot when selected.
  if (showAdminDashboard) {
    return (
      <AdminDashboard
        onBack={() => setShowAdminDashboard(false)}
      />
    );
  }

  // Main chatbot interface.
  return (
    <div className="app">
      <header className="chat-header">
        <div className="company-icon">I</div>

        <div>
          <h1>Innovision Industries</h1>
          <p>AI Customer Support Assistant</p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="header-enquiry-button"
            onClick={() => {
              setEnquiryStatus("");
              setShowEnquiryForm(true);
            }}
          >
            Submit an Enquiry
          </button>

          <button
            type="button"
            className="header-enquiry-button"
            onClick={() => setShowAdminDashboard(true)}
          >
            Admin Dashboard
          </button>
        </div>
      </header>

      <main className="chat-container">
        <div className="welcome">
          <h2>How can we help you?</h2>
          <p>Ask us a question to get started.</p>
        </div>

        {showEnquiryForm ? (
          <form
            className="enquiry-form"
            onSubmit={submitEnquiry}
          >
            <h2>Submit an Enquiry</h2>
            <p>
              Share your requirements with Innovision Industries.
            </p>

            <label htmlFor="customerName">Full Name *</label>
            <input
              id="customerName"
              name="customerName"
              type="text"
              placeholder="Enter your full name"
              maxLength={100}
              required
            />

            <label htmlFor="companyName">Company Name *</label>
            <input
              id="companyName"
              name="companyName"
              type="text"
              placeholder="Enter your company name"
              maxLength={150}
              required
            />

            <label htmlFor="email">Email Address *</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              maxLength={254}
              required
            />

            <label htmlFor="phone">Phone Number *</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="Enter your phone number"
              maxLength={25}
              required
            />

            <label htmlFor="product">Product / Service *</label>
            <select
              id="product"
              name="product"
              required
              defaultValue=""
            >
              <option value="" disabled>
                Select a product or service
              </option>
              <option value="Roof Rails and Roof Carriers">
                Roof Rails and Roof Carriers
              </option>
              <option value="Precision Machining">
                Precision Machining
              </option>
              <option value="Jigs, Fixtures and Gauges">
                Jigs, Fixtures and Gauges
              </option>
              <option value="Press Tools and Dies">
                Press Tools and Dies
              </option>
              <option value="Industrial Automation">
                Industrial Automation
              </option>
              <option value="Sheet Metal Fabrication">
                Sheet Metal Fabrication
              </option>
              <option value="Other">Other</option>
            </select>

            <label htmlFor="enquiryDetails">
              Enquiry Details *
            </label>
            <textarea
              id="enquiryDetails"
              name="enquiryDetails"
              placeholder="Describe your requirements..."
              rows="4"
              maxLength={3000}
              required
            />

            {enquiryStatus && (
              <p role="status" aria-live="polite">
                {enquiryStatus}
              </p>
            )}

            <div className="enquiry-buttons">
              <button
                type="submit"
                disabled={enquiryLoading}
              >
                {enquiryLoading
                  ? "Submitting..."
                  : "Submit Enquiry"}
              </button>

              <button
                type="button"
                onClick={() => setShowEnquiryForm(false)}
              >
                Back to Chat
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="messages" aria-live="polite">
              {messages.map((item, index) => (
                <div
                  key={index}
                  className={`message-row ${
                    item.role === "user" ? "user-row" : ""
                  }`}
                >
                  {item.role === "bot" && (
                    <div className="bot-avatar">I</div>
                  )}

                  <div className={`message ${item.role}`}>
                    {item.text}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="message-row">
                  <div className="bot-avatar">I</div>
                  <div className="message bot typing">
                    AI is thinking...
                  </div>
                </div>
              )}
            </div>

            <form
              className="chat-form"
              onSubmit={sendMessage}
            >
              <input
                type="text"
                value={message}
                onChange={(event) =>
                  setMessage(event.target.value)
                }
                placeholder="Type your message..."
                aria-label="Your message"
                disabled={loading}
              />

              <button
                type="submit"
                disabled={loading || !message.trim()}
              >
                {loading ? "Thinking..." : "Send"}
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
