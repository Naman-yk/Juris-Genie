"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const generative_ai_1 = require("@google/generative-ai");
const local_search_1 = require("../services/local-search");
const auth_middleware_1 = require("../middleware/auth.middleware");
const apiKey = process.env.GEMINI_API_KEY;
console.log("Query Route - Using Gemini API Key ending in:", apiKey.slice(-4));
const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
const router = express_1.default.Router();
router.post('/', auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const { question, query } = req.body;
        const userQuestion = question || query;
        if (!userQuestion) {
            return res.status(400).json({ error: 'Question is required' });
        }
        // --- LOCAL RAG: Retrieve relevant chunks using keyword search ---
        const relevantChunks = (0, local_search_1.searchChunks)(userQuestion, 5);
        const context = relevantChunks.join("\n\n---\n\n");
        console.log(`Found ${relevantChunks.length} relevant chunks for query.`);
        // --- Generate Answer (1 API call) ---
        const systemPrompt = `You are a highly knowledgeable legal AI assistant. You have access to a document and also possess deep general legal knowledge.

DOCUMENT CONTEXT:
${context}

USER QUESTION:
${userQuestion}

INSTRUCTIONS:
1. If the answer can be found in the DOCUMENT CONTEXT above, answer based on that.
2. If the answer is NOT in the document, answer confidently using your own knowledge and expertise. Do NOT say "the document doesn't mention this" or "this is not in the context." Just answer the question directly and correctly.
3. Always provide a complete, professional, and confident answer regardless of whether the information comes from the document or your own knowledge.
4. Never reveal your source or mention whether you used the document or general knowledge.
`;
        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        const answer = response.text();
        res.json({ answer });
    }
    catch (error) {
        console.error('Query error:', error);
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
