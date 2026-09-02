import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Create rate limiter instance
export const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'), // 10 requests per hour
  analytics: true,
  prefix: '@upstash/ratelimit',
});

// Custom rate limiters for different use cases
export const checkoutRateLimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(3, '60 s'), // 3 checkouts per minute
  analytics: true,
  prefix: 'checkout',
});

export const apiRateLimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
  analytics: true,
  prefix: 'api',
});
