import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db/items", () => ({
  getItemDetail: vi.fn(),
}));

import { auth } from "@/auth";
import { getItemDetail } from "@/lib/db/items";
import { GET } from "@/app/api/items/[id]/route";

const mockAuth = vi.mocked(auth);
const mockGetItemDetail = vi.mocked(getItemDetail);

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

const STUB_ITEM = {
  id: "item-1",
  title: "Test Item",
  description: "desc",
  content: "content",
  contentType: "TEXT",
  language: null,
  url: null,
  fileUrl: null,
  fileName: null,
  isFavorite: false,
  isPinned: false,
  itemType: { name: "Snippet", icon: "Code", color: "#3b82f6" },
  tags: ["react"],
  collections: [{ id: "col-1", name: "React Patterns" }],
  createdAt: new Date("2024-01-15"),
  updatedAt: new Date("2024-01-15"),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/items/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null as never);

    const res = await GET(new Request("http://localhost"), makeParams("item-1"));

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 401 when session has no user id", async () => {
    mockAuth.mockResolvedValue({ user: {} } as never);

    const res = await GET(new Request("http://localhost"), makeParams("item-1"));

    expect(res.status).toBe(401);
  });

  it("returns 404 when item does not exist or belongs to another user", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockGetItemDetail.mockResolvedValue(null);

    const res = await GET(new Request("http://localhost"), makeParams("item-999"));

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Not found");
    expect(mockGetItemDetail).toHaveBeenCalledWith("item-999", "user-1");
  });

  it("returns 200 with item data when authenticated and item found", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockGetItemDetail.mockResolvedValue(STUB_ITEM as never);

    const res = await GET(new Request("http://localhost"), makeParams("item-1"));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe("item-1");
    expect(body.title).toBe("Test Item");
    expect(mockGetItemDetail).toHaveBeenCalledWith("item-1", "user-1");
  });
});
