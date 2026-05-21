"use server";

import { z } from "zod";
import OpenAI from "openai";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { openai, AI_MODEL } from "@/lib/openai";
import { checkRateLimit, rateLimiters } from "@/lib/rate-limit";

const generateDescriptionSchema = z.object({
  title: z.string().trim().min(1).max(500),
  itemType: z.string().trim().min(1).max(50),
  content: z.string().trim().max(5_000).optional().default(""),
  url: z.string().trim().max(2_000).optional().default(""),
  language: z.string().trim().max(100).optional().default(""),
});

export type GenerateDescriptionResult =
  | { success: true; description: string }
  | { success: false; error: string };

export async function generateDescription(raw: {
  title: string;
  itemType: string;
  content?: string;
  url?: string;
  language?: string;
}): Promise<GenerateDescriptionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isPro: true },
  });
  if (!dbUser?.isPro) {
    return { success: false, error: "AI features require a Pro subscription." };
  }

  const rl = await checkRateLimit(
    rateLimiters.aiDescribe,
    `ai:describe:${session.user.id}`
  );
  if (!rl.success) {
    return {
      success: false,
      error: "You've used all 20 AI requests for this hour. Try again later.",
    };
  }

  const parsed = generateDescriptionSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  const { title, itemType, content, url, language } = parsed.data;

  const contextParts: string[] = [`Title: ${title}`, `Type: ${itemType}`];
  if (language) contextParts.push(`Language: ${language}`);
  if (url) contextParts.push(`URL: ${url}`);
  if (content) contextParts.push(`Content:\n${content.slice(0, 2000)}`);

  try {
    const response = await openai.responses.create({
      model: AI_MODEL,
      instructions:
        "You are a developer tool that writes concise descriptions for saved developer content. Write exactly 1-2 sentences that summarize what this item is and what it does. Be specific and practical. Return only the description text — no labels, no quotes, no markdown.",
      input: contextParts.join("\n\n"),
    });

    const description = (response.output_text ?? "").trim();
    if (!description) {
      return { success: false, error: "AI returned an empty description." };
    }

    return { success: true, description };
  } catch (err) {
    if (err instanceof OpenAI.RateLimitError) {
      return {
        success: false,
        error: "AI service is busy. Please try again shortly.",
      };
    }
    if (err instanceof OpenAI.APIError) {
      console.error("OpenAI API error:", err.status, err.message);
      return { success: false, error: "AI service unavailable. Please try again." };
    }
    console.error("Unexpected AI error:", err);
    return { success: false, error: "An unexpected error occurred." };
  }
}

const generateAutoTagsSchema = z.object({
  title: z.string().trim().min(1).max(500),
  content: z.string().trim().max(10_000),
});

export type GenerateAutoTagsResult =
  | { success: true; tags: string[] }
  | { success: false; error: string };

export async function generateAutoTags(raw: {
  title: string;
  content: string;
}): Promise<GenerateAutoTagsResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isPro: true },
  });
  if (!dbUser?.isPro) {
    return { success: false, error: "AI features require a Pro subscription." };
  }

  const rl = await checkRateLimit(
    rateLimiters.aiAutoTag,
    `ai:autotag:${session.user.id}`
  );
  if (!rl.success) {
    return {
      success: false,
      error: "You've used all 20 AI requests for this hour. Try again later.",
    };
  }

  const parsed = generateAutoTagsSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  const truncatedContent = parsed.data.content.slice(0, 2000);

  try {
    const response = await openai.responses.create({
      model: AI_MODEL,
      instructions:
        'You are a developer tool that suggests relevant tags for saved developer content (snippets, prompts, commands, notes, links). Return ONLY a JSON object with a single key "tags" containing an array of 3-5 lowercase tag strings. No explanation, no markdown.',
      input: `Title: ${parsed.data.title}\n\nContent: ${truncatedContent}`,
      text: {
        format: { type: "json_object" },
      },
    });

    const text = response.output_text ?? "{}";
    let tags: string[] = [];

    try {
      const json = JSON.parse(text) as unknown;
      if (Array.isArray(json)) {
        tags = json.filter((t): t is string => typeof t === "string");
      } else if (
        json &&
        typeof json === "object" &&
        "tags" in json &&
        Array.isArray((json as { tags: unknown }).tags)
      ) {
        tags = ((json as { tags: unknown[] }).tags).filter(
          (t): t is string => typeof t === "string"
        );
      }
    } catch {
      tags = [];
    }

    tags = tags
      .map((t) => t.toLowerCase().trim())
      .filter((t) => t.length > 0)
      .slice(0, 5);

    return { success: true, tags };
  } catch (err) {
    if (err instanceof OpenAI.RateLimitError) {
      return {
        success: false,
        error: "AI service is busy. Please try again shortly.",
      };
    }
    if (err instanceof OpenAI.APIError) {
      console.error("OpenAI API error:", err.status, err.message);
      return { success: false, error: "AI service unavailable. Please try again." };
    }
    console.error("Unexpected AI error:", err);
    return { success: false, error: "An unexpected error occurred." };
  }
}
