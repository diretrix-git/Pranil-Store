import { Redis } from "@upstash/redis";
import logger from "../utils/logger";

// Upstash Redis client — HTTP-based, works without persistent TCP connection
let redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    logger.info("Upstash Redis client initialized");
  }
  return redis;
}

// TTLs in seconds
export const TTL = {
  CATEGORIES: 60 * 60,      // 1 hour — rarely changes
  VENDORS_PUBLIC: 60 * 10,  // 10 min
  PRODUCTS: 60 * 2,         // 2 min — changes more often
  PRODUCT_SINGLE: 60 * 5,   // 5 min
};

// Cache keys
export const KEYS = {
  categories: "cache:categories",
  vendorsPublic: "cache:vendors:public",
  products: (qs: string) => `cache:products:${qs}`,
  product: (id: string) => `cache:product:${id}`,
};

export async function cacheGet<T>(key: string): Promise<T | null> {
  const r = getRedis();
  if (!r) return null;
  try {
    const val = await r.get<T>(key);
    return val ?? null;
  } catch (err: any) {
    logger.warn(`Cache GET failed [${key}]: ${err.message}`);
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttl: number): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    await r.set(key, value, { ex: ttl });
  } catch (err: any) {
    logger.warn(`Cache SET failed [${key}]: ${err.message}`);
  }
}

export async function cacheDel(...keys: string[]): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    await r.del(...keys);
  } catch (err: any) {
    logger.warn(`Cache DEL failed: ${err.message}`);
  }
}

// Invalidate all product-related cache keys by pattern
export async function invalidateProductCache(): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    const keys = await r.keys("cache:product*");
    if (keys.length > 0) await r.del(...keys);
  } catch (err: any) {
    logger.warn(`Cache invalidation failed: ${err.message}`);
  }
}
