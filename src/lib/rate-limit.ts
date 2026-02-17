// Redis-based sliding window rate limiter
// Production-ready: works across multiple instances

import { redis } from './redis';

/**
 * Redis-based rate limiter using sliding window algorithm.
 * Falls back to in-memory if Redis is unavailable.
 */

// In-memory fallback for when Redis is down
const fallbackMap = new Map<string, { count: number; resetTime: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of fallbackMap.entries()) {
    if (now > value.resetTime) {
      fallbackMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

function fallbackRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number } {
  const now = Date.now();
  const entry = fallbackMap.get(identifier);

  if (!entry || now > entry.resetTime) {
    fallbackMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0 };
  }

  entry.count++;
  return { success: true, remaining: limit - entry.count };
}

export async function rateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60 * 1000
): Promise<{ success: boolean; remaining: number }> {
  try {
    const key = `rl:${identifier}`;
    const windowSec = Math.ceil(windowMs / 1000);
    const now = Date.now();

    // Use Redis sorted set for sliding window
    const pipeline = redis.pipeline();
    // Remove expired entries
    pipeline.zremrangebyscore(key, 0, now - windowMs);
    // Add current request
    pipeline.zadd(key, now, `${now}:${Math.random()}`);
    // Count entries in window
    pipeline.zcard(key);
    // Set expiry on key
    pipeline.expire(key, windowSec);

    const results = await pipeline.exec();
    if (!results) {
      return fallbackRateLimit(identifier, limit, windowMs);
    }

    const count = (results[2]?.[1] as number) || 0;
    const remaining = Math.max(0, limit - count);

    return {
      success: count <= limit,
      remaining,
    };
  } catch (error) {
    console.error('Rate limit Redis error, using fallback:', error);
    return fallbackRateLimit(identifier, limit, windowMs);
  }
}

export function getRateLimitHeaders(remaining: number, limit: number): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(Math.max(0, remaining)),
  };
}
