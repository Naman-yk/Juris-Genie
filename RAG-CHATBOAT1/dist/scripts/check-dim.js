"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const generative_ai_1 = require("@google/generative-ai");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function checkDimension() {
    const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "models/gemini-embedding-001" });
    try {
        const result = await model.embedContent("Hello world");
        const values = result.embedding.values;
        console.log(`Dimension: ${values.length}`);
    }
    catch (e) {
        console.error(e);
    }
}
checkDimension();
