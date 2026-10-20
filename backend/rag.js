
const fs = require("fs");
const path = require("path");

const OLLAMA_URL = "http://localhost:11434";
const EMBEDDING_MODEL = "nomic-embed-text";

let indexedChunks = null;

// Convert text into an embedding using Ollama.
async function getEmbedding(text) {
  const response = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      prompt: text,
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Embedding error: ${errorText}`);
  }

  const data = await response.json();

  if (!Array.isArray(data.embedding)) {
    throw new Error("Ollama did not return a valid embedding.");
  }

  return data.embedding;
}

// Split company information into manageable text chunks.
function splitIntoChunks(text, maxChars = 700) {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const chunks = [];
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    if (
      currentChunk &&
      currentChunk.length + paragraph.length + 2 > maxChars
    ) {
      chunks.push(currentChunk);
      currentChunk = "";
    }

    currentChunk += currentChunk
      ? `\n\n${paragraph}`
      : paragraph;
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

// Read and embed the knowledge base once, then cache it in memory.
async function getKnowledgeIndex() {
  if (indexedChunks) {
    return indexedChunks;
  }

  const filePath = path.join(
    __dirname,
    "knowledge",
    "company.txt"
  );

  const companyText = fs.readFileSync(filePath, "utf8");
  const chunks = splitIntoChunks(companyText);

  if (chunks.length === 0) {
    throw new Error("The company knowledge base is empty.");
  }

  console.log(`Creating embeddings for ${chunks.length} chunks...`);

  const newIndex = [];

  for (let i = 0; i < chunks.length; i++) {
    const embedding = await getEmbedding(chunks[i]);

    newIndex.push({
      text: chunks[i],
      embedding,
    });

    console.log(`Indexed chunk ${i + 1}/${chunks.length}`);
  }

  indexedChunks = newIndex;
  console.log("Company knowledge base indexed successfully.");

  return indexedChunks;
}

// Calculate cosine similarity between two embeddings.
function cosineSimilarity(a, b) {
  if (a.length !== b.length || a.length === 0) {
    throw new Error("Embedding dimensions do not match.");
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  const denominator = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB);

  return denominator === 0 ? 0 : dotProduct / denominator;
}

// Retrieve the most relevant company information for a question.
async function retrieveRelevantChunks(question, topK = 3) {
  const index = await getKnowledgeIndex();
  const questionEmbedding = await getEmbedding(question);

  return index
    .map((chunk) => ({
      text: chunk.text,
      score: cosineSimilarity(questionEmbedding, chunk.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((chunk) => chunk.text);
}

module.exports = {
  retrieveRelevantChunks,
};
