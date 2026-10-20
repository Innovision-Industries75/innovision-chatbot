
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { retrieveRelevantChunks } = require("./rag");
const { saveEnquiry, getAllEnquiries } = require("./database");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.json({
    message: "Innovision Chatbot Backend is running!",
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        error: "Please enter a message.",
      });
    }

    const userMessage = message.trim();

    console.log("User message:", userMessage);

    // Step 1: Retrieve relevant company information using RAG
    const relevantChunks = await retrieveRelevantChunks(userMessage);

    const companyContext = relevantChunks
      .map((chunk, index) => `Information ${index + 1}:\n${chunk}`)
      .join("\n\n");

    console.log("Retrieved company information successfully.");

    // Step 2: Validate and prepare recent conversation history
    const conversationHistory = Array.isArray(history)
      ? history
          .filter(
            (item) =>
              item &&
              ["user", "assistant"].includes(item.role) &&
              typeof item.content === "string" &&
              item.content.trim()
          )
          .slice(-10)
          .map((item) => ({
            role: item.role,
            content: item.content.slice(0, 2000),
          }))
      : [];

    // Step 3: Generate a professional, company-focused answer
    const response = await fetch(
      "http://localhost:11434/api/chat",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama3.2:3b",
          messages: [
            {
              role: "system",
              content: `You are the official customer support assistant for Innovision Industries, a manufacturing and engineering company.

Your goal is to help customers with clear, professional, accurate answers.

FOLLOW THESE RULES:

1. Use the supplied company information as the source of truth for company-specific facts.

2. Never invent company products, services, customers, vehicle applications, prices, dimensions, materials, technical specifications, certifications, delivery dates, or capabilities.

3. Only state a specific vehicle model, product feature, material, or technical detail when it is supported by the supplied company information.

4. Use conversation history to understand follow-up questions. For example, if the customer asks "Which models use them?", identify what "them" refers to from the previous messages.

5. Answer the customer's actual question directly. Avoid unnecessary introductions, repeated disclaimers, and lengthy explanations.

6. Do not mention presentations, internal documents, files, databases, retrieved information, the knowledge base, or RAG.

7. If the information is unavailable or cannot be confirmed, politely explain that you cannot confirm the specific detail and recommend contacting Innovision Industries for clarification. Do not guess.

8. For greetings, respond naturally and briefly.

9. Maintain a professional, helpful, customer-friendly tone. Do not claim that you have personally inspected, tested, or verified a product.

10. Do not confuse a product manufactured by the company with an accessory or feature that the product might support.

COMPANY INFORMATION:
${companyContext || "No relevant company information was found for this question."}`,
            },
            ...conversationHistory,
            {
              role: "user",
              content: userMessage,
            },
          ],
          stream: false,
        }),
        signal: AbortSignal.timeout(300000),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Ollama error:", errorText);

      return res.status(502).json({
        error: "The local AI model could not generate a response.",
      });
    }

    const data = await response.json();
    const reply = data.message?.content;

    if (typeof reply !== "string" || !reply.trim()) {
      return res.status(502).json({
        error: "The AI model returned an empty response. Please try again.",
      });
    }

    res.json({ reply: reply.trim() });
  } catch (error) {
    console.error("Chat error:", error.message);

    res.status(500).json({
      error:
        "Unable to retrieve company information or contact the AI model. Please ensure Ollama is running.",
    });
  }
});

app.post("/api/enquiries", (req, res) => {
  try {
    const {
      customerName,
      companyName,
      email,
      phone,
      product,
      enquiryDetails,
    } = req.body;

    // Validate required fields
    const fields = [
      customerName,
      companyName,
      email,
      phone,
      product,
      enquiryDetails,
    ];

    if (
      fields.some(
        (field) => typeof field !== "string" || !field.trim()
      )
    ) {
      return res.status(400).json({
        error: "Please complete all required fields.",
      });
    }

    // Basic email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email.trim())) {
      return res.status(400).json({
        error: "Please enter a valid email address.",
      });
    }

    // Limit field lengths
    if (
      customerName.length > 100 ||
      companyName.length > 150 ||
      email.length > 254 ||
      phone.length > 25 ||
      product.length > 100 ||
      enquiryDetails.length > 3000
    ) {
      return res.status(400).json({
        error: "One or more fields exceed the allowed length.",
      });
    }

    // Save enquiry to SQLite
    const result = saveEnquiry({
      customer_name: customerName.trim(),
      company_name: companyName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      product: product.trim(),
      enquiry_details: enquiryDetails.trim(),
    });

    console.log("New enquiry saved. ID:", result.lastInsertRowid);

    return res.status(201).json({
      message: "Your enquiry has been submitted successfully.",
      enquiryId: result.lastInsertRowid,
    });
  } catch (error) {
    console.error("Enquiry submission error:", error.message);

    return res.status(500).json({
      error: "Unable to save your enquiry. Please try again.",
    });
  }
});
app.get("/api/enquiries", (req, res) => {
  try {
    const enquiries = getAllEnquiries();

    res.json({ enquiries });
  } catch (error) {
    console.error("Error fetching enquiries:", error.message);

    res.status(500).json({
      error: "Unable to fetch enquiries.",
    });
  }
});
// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
