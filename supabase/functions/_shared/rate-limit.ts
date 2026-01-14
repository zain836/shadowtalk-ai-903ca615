import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RATE_LIMITS = {
  free: { requests: 50, window: 86400 }, // 50/day
  pro: { requests: 10000, window: 86400 }, // 10k/day
  premium: { requests: 50000, window: 86400 }, // 50k/day
  elite: { requests: 100000, window: 86400 }, // 100k/day
  enterprise: { requests: 1000000, window: 86400 }, // 1M/day
};

export async function checkRateLimit(
  userId: string,
  tier: string = "free",
  supabase: any
): Promise<{ allowed: boolean; remaining: number; resetAt: Date; limit: number }> {
  const limit = RATE_LIMITS[tier as keyof typeof RATE_LIMITS] || RATE_LIMITS.free;
  const now = new Date();
  const windowStart = new Date(now.getTime() - limit.window * 1000);

  // Count requests in current window
  const { count, error } = await supabase
    .from("usage_analytics")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", windowStart.toISOString());

  if (error) {
    console.error("[Rate Limit] Error checking rate limit:", error);
    // Fail open - allow request but log error
    return {
      allowed: true,
      remaining: 0,
      resetAt: new Date(now.getTime() + limit.window * 1000),
      limit: limit.requests,
    };
  }

  const used = count || 0;
  const remaining = Math.max(0, limit.requests - used);
  const resetAt = new Date(windowStart.getTime() + limit.window * 1000);

  return {
    allowed: used < limit.requests,
    remaining,
    resetAt,
    limit: limit.requests,
  };
}

export function getRateLimitHeaders(
  tier: string,
  remaining: number,
  resetAt: Date,
  limit: number
): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": resetAt.toISOString(),
  };
}
