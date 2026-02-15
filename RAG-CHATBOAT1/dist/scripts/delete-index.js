"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pinecone_1 = require("@pinecone-database/pinecone");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function resetIndex() {
    const pc = new pinecone_1.Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    const indexName = process.env.PINECONE_INDEX;
    console.log(`Deleting index: ${indexName}...`);
    try {
        await pc.deleteIndex(indexName);
        console.log(`Index ${indexName} deleted.`);
    }
    catch (error) {
        if (error.message?.includes('not found')) {
            console.log("Index not found, skipping delete.");
        }
        else {
            console.error("Error deleting index:", error);
        }
    }
}
resetIndex();
