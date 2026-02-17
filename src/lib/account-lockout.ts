// Redis-based account lockout to prevent brute-force attacks

import { redis } from './redis';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60; // 15 minutes in seconds
const ATTEMPT_WINDOW = 15 * 60; // 15 minute sliding window

function getKey(email: string): string {
  return `lockout:${email.toLowerCase()}`;
}

/**
 * Check if account is locked
 */
export async function isAccountLocked(email: string): Promise<{ locked: boolean; remainingSeconds: number }> {
  try {
    const key = getKey(email);
    const lockUntil = await redis.get(`${key}:locked`);

    if (lockUntil) {
      const remaining = Math.ceil((parseInt(lockUntil) - Date.now()) / 1000);
      if (remaining > 0) {
        return { locked: true, remainingSeconds: remaining };
      }
      // Lock expired, clean up
      await redis.del(`${key}:locked`);
    }

    return { locked: false, remainingSeconds: 0 };
  } catch (error) {
    console.error('Account lockout check error:', error);
    return { locked: false, remainingSeconds: 0 };
  }
}

/**
 * Record a failed login attempt
 */
export async function recordFailedAttempt(email: string): Promise<{ locked: boolean; attemptsRemaining: number }> {
  try {
    const key = getKey(email);
    const now = Date.now();

    const pipeline = redis.pipeline();
    // Remove expired attempts
    pipeline.zremrangebyscore(key, 0, now - ATTEMPT_WINDOW * 1000);
    // Add this attempt
    pipeline.zadd(key, now, `${now}`);
    // Count attempts
    pipeline.zcard(key);
    // Set expiry
    pipeline.expire(key, ATTEMPT_WINDOW);

    const results = await pipeline.exec();
    const attemptCount = (results?.[2]?.[1] as number) || 0;

    if (attemptCount >= MAX_ATTEMPTS) {
      // Lock the account
      const lockUntil = Date.now() + LOCKOUT_DURATION * 1000;
      await redis.setex(`${key}:locked`, LOCKOUT_DURATION, String(lockUntil));
      return { locked: true, attemptsRemaining: 0 };
    }

    return { locked: false, attemptsRemaining: MAX_ATTEMPTS - attemptCount };
  } catch (error) {
    console.error('Record failed attempt error:', error);
    return { locked: false, attemptsRemaining: MAX_ATTEMPTS };
  }
}

/**
 * Clear failed attempts on successful login
 */
export async function clearFailedAttempts(email: string): Promise<void> {
  try {
    const key = getKey(email);
    await redis.del(key, `${key}:locked`);
  } catch (error) {
    console.error('Clear failed attempts error:', error);
  }
}
