import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(),
  rateLimiters: { aiAutoTag: null, aiDescribe: null },
}));

vi.mock("@/lib/openai", () => ({
  openai: { responses: { create: vi.fn() } },
  AI_MODEL: "gpt-4o-mini",
}));

// Minimal stub so instanceof OpenAI.RateLimitError / APIError works
vi.mock("openai", () => {
  class APIError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  }
  class RateLimitError extends APIError {
    constructor() { super(429, "rate limit"); }
  }
  return { default: { RateLimitError, APIError } };
});

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { openai } from "@/lib/openai";
import { generateAutoTags, generateDescription } from "@/actions/ai";

const mockAuth          = vi.mocked(auth);
const mockFindUnique    = vi.mocked(prisma.user.findUnique);
const mockCheckRL       = vi.mocked(checkRateLimit);
const mockCreate        = vi.mocked(openai.responses.create);

const SESSION_PRO  = { user: { id: "user-1" } };
const RL_OK        = { success: true,  remaining: 19, reset: 0 };
const RL_EXCEEDED  = { success: false, remaining: 0,  reset: Date.now() + 3600_000 };

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue(SESSION_PRO as never);
  mockFindUnique.mockResolvedValue({ isPro: true } as never);
  mockCheckRL.mockResolvedValue(RL_OK);
});

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
describe("generateAutoTags — auth", () => {
  it("returns unauthorized when there is no session", async () => {
    mockAuth.mockResolvedValue(null as never);

    const result = await generateAutoTags({ title: "test", content: "" });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Unauthorized");
    expect(mockFindUnique).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Pro gating
// ---------------------------------------------------------------------------
describe("generateAutoTags — Pro gating", () => {
  it("returns error for free users", async () => {
    mockFindUnique.mockResolvedValue({ isPro: false } as never);

    const result = await generateAutoTags({ title: "test", content: "" });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/Pro/i);
    expect(mockCreate).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------
describe("generateAutoTags — rate limiting", () => {
  it("returns error when rate limit is exceeded", async () => {
    mockCheckRL.mockResolvedValue(RL_EXCEEDED);

    const result = await generateAutoTags({ title: "test", content: "" });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/hour/i);
    expect(mockCreate).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------
describe("generateAutoTags — input validation", () => {
  it("returns error when title is empty", async () => {
    const result = await generateAutoTags({ title: "   ", content: "" });

    expect(result.success).toBe(false);
    expect(mockCreate).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Successful responses
// ---------------------------------------------------------------------------
describe("generateAutoTags — success", () => {
  it("returns tags from object format {tags: [...]}", async () => {
    mockCreate.mockResolvedValue({
      output_text: JSON.stringify({ tags: ["react", "hooks", "typescript"] }),
    } as never);

    const result = await generateAutoTags({ title: "React hooks", content: "useEffect example" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.tags).toEqual(["react", "hooks", "typescript"]);
    }
  });

  it("returns tags from array format [...]", async () => {
    mockCreate.mockResolvedValue({
      output_text: JSON.stringify(["react", "hooks", "typescript"]),
    } as never);

    const result = await generateAutoTags({ title: "React hooks", content: "" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.tags).toEqual(["react", "hooks", "typescript"]);
    }
  });

  it("normalises tags to lowercase", async () => {
    mockCreate.mockResolvedValue({
      output_text: JSON.stringify({ tags: ["React", "TYPESCRIPT", "Hooks"] }),
    } as never);

    const result = await generateAutoTags({ title: "test", content: "" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.tags).toEqual(["react", "typescript", "hooks"]);
    }
  });

  it("caps tags at 5", async () => {
    mockCreate.mockResolvedValue({
      output_text: JSON.stringify({ tags: ["a", "b", "c", "d", "e", "f", "g"] }),
    } as never);

    const result = await generateAutoTags({ title: "test", content: "" });

    expect(result.success).toBe(true);
    if (result.success) expect(result.tags).toHaveLength(5);
  });

  it("returns empty array when model returns malformed JSON", async () => {
    mockCreate.mockResolvedValue({ output_text: "not json" } as never);

    const result = await generateAutoTags({ title: "test", content: "" });

    expect(result.success).toBe(true);
    if (result.success) expect(result.tags).toEqual([]);
  });
});

// ===========================================================================
// generateDescription
// ===========================================================================

describe("generateDescription — auth", () => {
  it("returns unauthorized when there is no session", async () => {
    mockAuth.mockResolvedValue(null as never);

    const result = await generateDescription({ title: "test", itemType: "snippet" });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Unauthorized");
    expect(mockCreate).not.toHaveBeenCalled();
  });
});

describe("generateDescription — Pro gating", () => {
  it("returns error for free users", async () => {
    mockFindUnique.mockResolvedValue({ isPro: false } as never);

    const result = await generateDescription({ title: "test", itemType: "note" });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/Pro/i);
    expect(mockCreate).not.toHaveBeenCalled();
  });
});

describe("generateDescription — rate limiting", () => {
  it("returns error when rate limit is exceeded", async () => {
    mockCheckRL.mockResolvedValue(RL_EXCEEDED);

    const result = await generateDescription({ title: "test", itemType: "snippet" });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/hour/i);
    expect(mockCreate).not.toHaveBeenCalled();
  });
});

describe("generateDescription — input validation", () => {
  it("returns error when title is empty", async () => {
    const result = await generateDescription({ title: "   ", itemType: "snippet" });

    expect(result.success).toBe(false);
    expect(mockCreate).not.toHaveBeenCalled();
  });
});

describe("generateDescription — success", () => {
  it("returns description from model output", async () => {
    mockCreate.mockResolvedValue({
      output_text: "A React hook that manages local state. Use it to store component-level data that should trigger re-renders on change.",
    } as never);

    const result = await generateDescription({
      title: "useState example",
      itemType: "snippet",
      content: "const [count, setCount] = useState(0);",
      language: "typescript",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.description).toBe(
        "A React hook that manages local state. Use it to store component-level data that should trigger re-renders on change."
      );
    }
  });

  it("trims whitespace from description", async () => {
    mockCreate.mockResolvedValue({
      output_text: "   A useful snippet.   ",
    } as never);

    const result = await generateDescription({ title: "test", itemType: "snippet" });

    expect(result.success).toBe(true);
    if (result.success) expect(result.description).toBe("A useful snippet.");
  });

  it("returns error when model output is empty", async () => {
    mockCreate.mockResolvedValue({ output_text: "" } as never);

    const result = await generateDescription({ title: "test", itemType: "note" });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/empty/i);
  });

  it("works for link type with url field", async () => {
    mockCreate.mockResolvedValue({
      output_text: "The official React documentation site for learning hooks and components.",
    } as never);

    const result = await generateDescription({
      title: "React Docs",
      itemType: "link",
      url: "https://react.dev",
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.description).toContain("React");
  });
});

// ---------------------------------------------------------------------------
// OpenAI errors
// ---------------------------------------------------------------------------
describe("generateAutoTags — OpenAI errors", () => {
  it("surfaces a friendly message on RateLimitError", async () => {
    const OpenAI = (await import("openai")).default;
    mockCreate.mockRejectedValue(new OpenAI.RateLimitError());

    const result = await generateAutoTags({ title: "test", content: "" });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/busy/i);
  });

  it("surfaces a friendly message on generic APIError", async () => {
    const OpenAI = (await import("openai")).default;
    mockCreate.mockRejectedValue(new OpenAI.APIError(500, "Internal Server Error"));

    const result = await generateAutoTags({ title: "test", content: "" });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/unavailable/i);
  });
});
