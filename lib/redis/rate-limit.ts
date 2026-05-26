import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Initialize the Redis connection
const redis = Redis.fromEnv();

// Create a new ratelimiter that allows 3 requests per 1 minute
// This is perfect for a restaurant table. It prevents spam but allows normal ordering.
export const tableRateLimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(3, "1 m"),
  analytics: true,
});

export async function checkTableRateLimit(tenantId: string, tableNumber: string) {
  // We create a unique identifier for this specific table at this specific cafe
  const identifier = `rate_limit:${tenantId}:table_${tableNumber}`;
  
  const { success, remaining } = await tableRateLimit.limit(identifier);
  
  if (!success) {
    throw new Error("Whoa, slow down! Please wait a minute before placing another order from this table.");
  }
  
  return remaining;
}