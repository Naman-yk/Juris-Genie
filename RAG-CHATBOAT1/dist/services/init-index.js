"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureIndex = ensureIndex;
const vector_1 = require("./vector");
async function ensureIndex(indexName) {
    try {
        const indexList = await vector_1.pc.listIndexes();
        const existingDefault = indexList.indexes?.find(i => i.name === indexName);
        if (!existingDefault) {
            console.log(`Index ${indexName} not found. Creating...`);
            await vector_1.pc.createIndex({
                name: indexName,
                dimension: 3072, // Gemini models/gemini-embedding-001 output dimension
                metric: 'cosine',
                spec: {
                    serverless: {
                        cloud: 'aws',
                        region: 'us-east-1'
                    }
                }
            });
            console.log(`Index ${indexName} created.`);
            // Wait a bit for initialization
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
        else {
            console.log(`Index ${indexName} already exists.`);
        }
    }
    catch (error) {
        console.error("Error checking/creating index:", error);
        throw error;
    }
}
