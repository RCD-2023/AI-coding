import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 2,
  timeout: 30_000,
});

export const AI_MODEL = process.env.OPENAI_AI_MODEL ?? "gpt-4o-mini";
