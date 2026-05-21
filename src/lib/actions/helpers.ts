import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import type { Ratelimit } from "@upstash/ratelimit";
import type { z } from "zod";

export async function requireAuth(): Promise<{ userId: string } | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return { userId: session.user.id };
}

export async function requireProWithRateLimit(
  userId: string,
  limiter: Ratelimit | null,
  key: string,
  rateLimitMessage: string
): Promise<{ success: false; error: string } | null> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isPro: true } });
  if (!user?.isPro) return { success: false, error: "AI features require a Pro subscription." };
  const rl = await checkRateLimit(limiter, key);
  if (!rl.success) return { success: false, error: rateLimitMessage };
  return null;
}

export function parseOrError<T>(
  schema: z.ZodSchema<T>,
  raw: unknown
): { data: T } | { success: false; error: string; fieldErrors: Record<string, string[]> } {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }
  return { data: parsed.data };
}
