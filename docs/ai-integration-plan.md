# AI Integration Plan — RCD DevStash

## Model Note

The research prompt specified `gpt-5.4-nano`, which does not exist as of May 2026. Available OpenAI models appropriate for these features:

| Use Case | Recommended Model | Why |
|---|---|---|
| Auto-tagging, summaries | `gpt-4o-mini` | Fast, cheap, sufficient for classification |
| Code explanation | `gpt-4o` | Better reasoning for complex code |
| Prompt optimization | `gpt-4o` | Quality matters here |

Use `gpt-4o-mini` as the default to minimize costs. Allow the model to be configured via env var (`OPENAI_AI_MODEL`) so it can be swapped without code changes.

---

## 1. SDK Setup

### Installation

```bash
npm install openai
```

### Client singleton (`src/lib/openai.ts`)

```typescript
import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 2,
  timeout: 30_000,
});

export const AI_MODEL = process.env.OPENAI_AI_MODEL ?? "gpt-4o-mini";
```

Keep the client in `src/lib/` — never import it in client components. The API key must only ever live on the server.

### Environment variables (`.env.local`)

```
OPENAI_API_KEY=sk-...
OPENAI_AI_MODEL=gpt-4o-mini   # optional override
```

---

## 2. Server Action Pattern

All AI calls follow the same shape as existing actions (`src/actions/items.ts`):

```typescript
"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { openai, AI_MODEL } from "@/lib/openai";
import OpenAI from "openai";
import { z } from "zod";

// 1. Define input schema
const generateTagsSchema = z.object({
  content: z.string().trim().min(1).max(10_000),
  title: z.string().trim().min(1).max(500),
});

// 2. Define typed result (matches existing pattern)
export type GenerateTagsResult =
  | { success: true; tags: string[] }
  | { success: false; error: string };

export async function generateTags(raw: {
  content: string;
  title: string;
}): Promise<GenerateTagsResult> {
  // 3. Auth check (same as all other actions)
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  // 4. Pro gating (same pattern as createItem)
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isPro: true },
  });
  if (!dbUser?.isPro) {
    return { success: false, error: "AI features require a Pro subscription." };
  }

  // 5. Input validation
  const parsed = generateTagsSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  // 6. AI call with typed error handling
  try {
    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content:
            "Return a JSON array of 3-7 lowercase tag strings relevant to the content. No explanation.",
        },
        {
          role: "user",
          content: `Title: ${parsed.data.title}\n\nContent: ${parsed.data.content}`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 200,
      temperature: 0.3,
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const parsed_response = JSON.parse(raw) as { tags?: string[] };
    const tags = Array.isArray(parsed_response.tags) ? parsed_response.tags : [];

    return { success: true, tags };
  } catch (err) {
    if (err instanceof OpenAI.RateLimitError) {
      return { success: false, error: "AI service is busy. Please try again shortly." };
    }
    if (err instanceof OpenAI.APIError) {
      console.error("OpenAI API error:", err.status, err.message);
      return { success: false, error: "AI service unavailable. Please try again." };
    }
    console.error("Unexpected AI error:", err);
    return { success: false, error: "An unexpected error occurred." };
  }
}
```

---

## 3. Feature Action Templates

### Auto-tagging

- **Input:** title + content (trimmed, max 10k chars)
- **Prompt strategy:** JSON mode (`response_format: { type: "json_object" }`), ask for array
- **Model:** `gpt-4o-mini`
- **Max tokens:** 200
- **Temperature:** 0.3 (more deterministic)

### AI Summary

- **Input:** content (trimmed, max 20k chars — chunking needed for longer)
- **Prompt strategy:** single-turn, plain text response
- **Model:** `gpt-4o-mini`
- **Max tokens:** 300
- **Temperature:** 0.5

### Code Explanation

- **Input:** code content + language
- **Prompt strategy:** plain text, structured explanation
- **Model:** `gpt-4o` (better for complex code)
- **Max tokens:** 800
- **Temperature:** 0.2

### Prompt Optimization

- **Input:** raw prompt text
- **Prompt strategy:** return improved prompt only, no commentary
- **Model:** `gpt-4o`
- **Max tokens:** 1000
- **Temperature:** 0.4

---

## 4. Streaming vs Non-Streaming

| Scenario | Use |
|---|---|
| Short responses (tags, quick summaries) | Non-streaming — simpler server actions |
| Long responses (code explanation, long summaries) | Streaming — better UX |

### Non-streaming (server action)

Use for auto-tagging and short summaries. The action awaits the full response and returns it. This works natively with existing `{ success: true; data }` pattern.

### Streaming (Route Handler)

Server actions cannot return streams. For streaming, use a **Route Handler** (`src/app/api/ai/explain/route.ts`):

```typescript
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { openai, AI_MODEL } from "@/lib/openai";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isPro: true },
  });
  if (!dbUser?.isPro) return new Response("Pro required", { status: 403 });

  const { code, language } = await req.json();

  const stream = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "Explain this code clearly and concisely." },
      { role: "user", content: `Language: ${language}\n\n${code}` },
    ],
    stream: true,
    max_tokens: 800,
  });

  // Return as ReadableStream (Next.js handles SSE automatically)
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? "";
        if (text) controller.enqueue(new TextEncoder().encode(text));
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
```

**Client-side consumption:**

```typescript
const res = await fetch("/api/ai/explain", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ code, language }),
});

const reader = res.body!.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  setText((prev) => prev + decoder.decode(value));
}
```

---

## 5. Pro User Gating

Follow the exact pattern from `src/actions/items.ts:99-112`:

```typescript
const dbUser = await prisma.user.findUnique({
  where: { id: session.user.id },
  select: { isPro: true },
});
if (!dbUser?.isPro) {
  return { success: false, error: "AI features require a Pro subscription." };
}
```

Always query the database — never trust the session for plan status, as it can be stale.

For route handlers, return `403` with a JSON body:

```typescript
if (!dbUser?.isPro) {
  return Response.json({ error: "Pro required" }, { status: 403 });
}
```

---

## 6. Error Handling

The OpenAI SDK exposes typed error classes. Catch them in order of specificity:

```typescript
import OpenAI from "openai";

try {
  // ... openai call
} catch (err) {
  if (err instanceof OpenAI.RateLimitError) {
    // HTTP 429 — back off, user-facing message
    return { success: false, error: "AI is busy. Try again in a moment." };
  }
  if (err instanceof OpenAI.AuthenticationError) {
    // HTTP 401 — misconfigured API key, internal alert
    console.error("OpenAI auth failure — check OPENAI_API_KEY");
    return { success: false, error: "AI service configuration error." };
  }
  if (err instanceof OpenAI.APIConnectionError) {
    // Network failure
    return { success: false, error: "Could not reach AI service. Check your connection." };
  }
  if (err instanceof OpenAI.APIError) {
    // Catch-all for other HTTP errors (400, 500, etc.)
    console.error("OpenAI API error:", err.status, err.message);
    return { success: false, error: "AI service error. Please try again." };
  }
  throw err; // Re-throw unexpected errors
}
```

### Rate limiting strategy

The SDK retries automatically (`maxRetries: 2` by default with exponential backoff). For user-facing rate limit errors (429), surface a toast — do not retry silently in the UI.

For high-volume scenarios, consider a simple in-memory per-user rate limiter in the route handler:

```typescript
const userRateLimits = new Map<string, { count: number; reset: number }>();
const LIMIT = 10; // requests per window
const WINDOW_MS = 60_000; // 1 minute

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = userRateLimits.get(userId);
  if (!entry || now > entry.reset) {
    userRateLimits.set(userId, { count: 1, reset: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= LIMIT) return false;
  entry.count++;
  return true;
}
```

Note: This resets on server restart. For persistent rate limiting, use Upstash Redis or similar.

---

## 7. Cost Optimization

| Strategy | Implementation |
|---|---|
| Use `gpt-4o-mini` as default | Set `AI_MODEL=gpt-4o-mini` in env |
| Cap input tokens | Truncate content to ~10k chars before sending |
| Cap output tokens | Set `max_tokens` explicitly on every call |
| Lower temperature for structured tasks | 0.2–0.4 for JSON/classification tasks |
| Cache identical requests | Cache by SHA-256 of prompt in DB or Redis (short TTL) |
| Gate on Pro | Already covered — free users never hit OpenAI |
| Log token usage | `response.usage.total_tokens` — log to DB for billing insight |

### Input truncation helper

```typescript
function truncateContent(content: string, maxChars = 10_000): string {
  if (content.length <= maxChars) return content;
  return content.slice(0, maxChars) + "\n\n[Content truncated for AI processing]";
}
```

---

## 8. UI Patterns

### Loading state

Use a `isPending` boolean toggled around the action call. Show a spinner or skeleton, not a full-page loader.

```tsx
const [isPending, setIsPending] = useState(false);
const [suggestions, setSuggestions] = useState<string[] | null>(null);

async function handleGenerate() {
  setIsPending(true);
  const result = await generateTags({ title, content });
  setIsPending(false);
  if (result.success) setSuggestions(result.tags);
  else toast.error(result.error);
}
```

### Accept / Reject suggestions

Show AI-generated content as suggestions, never auto-apply:

```tsx
{suggestions && (
  <div className="rounded border p-3">
    <p className="text-sm text-muted-foreground mb-2">AI suggestions:</p>
    <div className="flex gap-1 flex-wrap">
      {suggestions.map((tag) => (
        <button key={tag} onClick={() => addTag(tag)} className="...">
          + {tag}
        </button>
      ))}
    </div>
    <button onClick={() => setSuggestions(null)} className="...">
      Dismiss
    </button>
  </div>
)}
```

### Streaming text display

For streaming (code explanation), render into a `<pre>` or markdown viewer that updates as chunks arrive. Add a blinking cursor while streaming.

### Pro upgrade nudge

When a free user triggers an AI action, show an upgrade prompt — not just an error toast:

```tsx
if (!result.success && result.error.includes("Pro")) {
  // Show upgrade modal/banner, not just toast
}
```

---

## 9. Security Considerations

| Risk | Mitigation |
|---|---|
| API key exposure | Never import `openai` client in `"use client"` files; only in server actions and route handlers |
| Prompt injection via user content | Sanitize and clearly separate system vs user content in messages array; use `role: "user"` for all user-supplied text |
| Excessive input | Truncate to max chars before sending; Zod `max()` on input schema |
| Unauthorized access | Always call `auth()` and check `isPro` in every action/handler — no shortcuts |
| Logging sensitive data | Never log the full prompt or response body in production; log only token counts and model |
| Cost explosion | Per-user rate limiting + Pro gating + `max_tokens` caps |

---

## 10. File Structure

```
src/
  lib/
    openai.ts           # client singleton + model constant
  actions/
    ai.ts               # generateTags, generateSummary, optimizePrompt (non-streaming)
  app/
    api/
      ai/
        explain/
          route.ts      # streaming code explanation
```

All AI server actions live in `src/actions/ai.ts` to keep them co-located with the existing action files.
