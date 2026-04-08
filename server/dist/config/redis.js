"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KEYS = exports.TTL = void 0;
exports.getRedis = getRedis;
exports.cacheGet = cacheGet;
exports.cacheSet = cacheSet;
exports.cacheDel = cacheDel;
exports.invalidateProductCache = invalidateProductCache;
const redis_1 = require("@upstash/redis");
const logger_1 = __importDefault(require("../utils/logger"));
// Upstash Redis client — HTTP-based, works without persistent TCP connection
let redis = null;
function getRedis() {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
        return null;
    }
    if (!redis) {
        redis = new redis_1.Redis({
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });
        logger_1.default.info("Upstash Redis client initialized");
    }
    return redis;
}
// TTLs in seconds
exports.TTL = {
    CATEGORIES: 60 * 60, // 1 hour — rarely changes
    VENDORS_PUBLIC: 60 * 10, // 10 min
    PRODUCTS: 60 * 2, // 2 min — changes more often
    PRODUCT_SINGLE: 60 * 5, // 5 min
};
// Cache keys
exports.KEYS = {
    categories: "cache:categories",
    vendorsPublic: "cache:vendors:public",
    products: (qs) => `cache:products:${qs}`,
    product: (id) => `cache:product:${id}`,
};
async function cacheGet(key) {
    const r = getRedis();
    if (!r)
        return null;
    try {
        const val = await r.get(key);
        return val ?? null;
    }
    catch (err) {
        logger_1.default.warn(`Cache GET failed [${key}]: ${err.message}`);
        return null;
    }
}
async function cacheSet(key, value, ttl) {
    const r = getRedis();
    if (!r)
        return;
    try {
        await r.set(key, value, { ex: ttl });
    }
    catch (err) {
        logger_1.default.warn(`Cache SET failed [${key}]: ${err.message}`);
    }
}
async function cacheDel(...keys) {
    const r = getRedis();
    if (!r)
        return;
    try {
        await r.del(...keys);
    }
    catch (err) {
        logger_1.default.warn(`Cache DEL failed: ${err.message}`);
    }
}
// Invalidate all product-related cache keys by pattern
async function invalidateProductCache() {
    const r = getRedis();
    if (!r)
        return;
    try {
        const keys = await r.keys("cache:product*");
        if (keys.length > 0)
            await r.del(...keys);
    }
    catch (err) {
        logger_1.default.warn(`Cache invalidation failed: ${err.message}`);
    }
}
