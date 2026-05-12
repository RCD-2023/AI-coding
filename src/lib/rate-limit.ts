import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { NextResponse } from "next/server"

function makeRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
}

const redis = makeRedis()

function makeLimiter(requests: number, window: string) {
  if (!redis) return null
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window as Parameters<typeof Ratelimit.slidingWindow>[1]),
    analytics: false,
  })
}

export const rateLimiters = {
  login: makeLimiter(5, "15 m"),
  register: makeLimiter(3, "1 h"),
  forgotPassword: makeLimiter(3, "1 h"),
  resetPassword: makeLimiter(5, "15 m"),
}

export function getIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for")
  return (xff ? xff.split(",")[0] : "127.0.0.1").trim()
}

export async function checkRateLimit(
  limiter: Ratelimit | null,
  key: string
): Promise<{ success: boolean; remaining: number; reset: number }> {
  if (!limiter) return { success: true, remaining: 999, reset: 0 }
  try {
    const result = await limiter.limit(key)
    return { success: result.success, remaining: result.remaining, reset: result.reset }
  } catch {
    // Fail open if Upstash is unavailable
    return { success: true, remaining: 999, reset: 0 }
  }
}

export function rateLimitResponse(reset: number): NextResponse {
  const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000))
  const minutes = Math.ceil(retryAfter / 60)
  return NextResponse.json(
    { error: `Too many attempts. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.` },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfter) },
    }
  )
}
