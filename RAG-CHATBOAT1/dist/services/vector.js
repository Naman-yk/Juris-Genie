"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pc = void 0;
exports.upsertVectors = upsertVectors;
exports.queryVectors = queryVectors;
const pinecone_1 = require("@pinecone-database/pinecone");
exports.pc = new pinecone_1.Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
});
// ----------------------- UPSERT -----------------------
async function upsertVectors(indexName, vectors) {
    const index = exports.pc.index(indexName);
    await index.upsert(vectors); // correct for serverless
}
// ----------------------- QUERY -----------------------
async function queryVectors(indexName, vector, topK = 5) {
    const index = exports.pc.index(indexName);
    const result = await index.query({
        vector,
        topK,
        includeMetadata: true,
    });
    return result.matches ?? [];
}
