"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCachedAnswer = getCachedAnswer;
exports.cacheAnswer = cacheAnswer;
const redis_1 = require("@upstash/redis");
const redis = new redis_1.Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || "https://example.com",
    token: process.env.UPSTASH_REDIS_REST_TOKEN || "example",
});
async function getCachedAnswer(query) {
    if (!process.env.UPSTASH_REDIS_REST_URL)
        return null;
    try {
        const cached = await redis.get(query);
        if (!cached)
            return null;
        return typeof cached === 'string' ? JSON.parse(cached) : cached;
    }
    catch (e) {
        console.warn("Cache error:", e);
        return null;
    }
}
async function cacheAnswer(query, data) {
    if (!process.env.UPSTASH_REDIS_REST_URL)
        return;
    try {
        await redis.set(query, JSON.stringify(data), { ex: 60 * 60 * 24 });
    }
    catch (e) {
        console.warn("Cache set error:", e);
    }
}
