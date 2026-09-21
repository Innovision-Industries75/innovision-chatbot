const express = require("express");
const cors = require("cors");
require("dotenv").config();

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

// Chat API
app.post("/api/chat", (req, res) => {
  const { message } = req.body;

  console.log("User message:", message);

  res.json({
    reply:
      "This response is coming from the Innovision chatbot backend.",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});