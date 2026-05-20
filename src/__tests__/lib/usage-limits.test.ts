import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    item: { count: vi.fn() },
    collection: { count: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { checkItemLimit, checkCollectionLimit } from "@/lib/usage-limits";

const mockItemCount = vi.mocked(prisma.item.count);
const mockCollectionCount = vi.mocked(prisma.collection.count);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("checkItemLimit", () => {
  it("returns allowed:true when count is below limit", async () => {
    mockItemCount.mockResolvedValue(10);
    const result = await checkItemLimit("user-1");
    expect(result).toEqual({ allowed: true, count: 10, limit: 50 });
  });

  it("returns allowed:false when count equals limit", async () => {
    mockItemCount.mockResolvedValue(50);
    const result = await checkItemLimit("user-1");
    expect(result).toEqual({ allowed: false, count: 50, limit: 50 });
  });

  it("returns allowed:false when count exceeds limit", async () => {
    mockItemCount.mockResolvedValue(55);
    const result = await checkItemLimit("user-1");
    expect(result).toEqual({ allowed: false, count: 55, limit: 50 });
  });

  it("queries with the correct userId", async () => {
    mockItemCount.mockResolvedValue(0);
    await checkItemLimit("user-abc");
    expect(mockItemCount).toHaveBeenCalledWith({ where: { userId: "user-abc" } });
  });
});

describe("checkCollectionLimit", () => {
  it("returns allowed:true when count is below limit", async () => {
    mockCollectionCount.mockResolvedValue(2);
    const result = await checkCollectionLimit("user-1");
    expect(result).toEqual({ allowed: true, count: 2, limit: 3 });
  });

  it("returns allowed:false when count equals limit", async () => {
    mockCollectionCount.mockResolvedValue(3);
    const result = await checkCollectionLimit("user-1");
    expect(result).toEqual({ allowed: false, count: 3, limit: 3 });
  });

  it("returns allowed:false when count exceeds limit", async () => {
    mockCollectionCount.mockResolvedValue(5);
    const result = await checkCollectionLimit("user-1");
    expect(result).toEqual({ allowed: false, count: 5, limit: 3 });
  });

  it("queries with the correct userId", async () => {
    mockCollectionCount.mockResolvedValue(0);
    await checkCollectionLimit("user-xyz");
    expect(mockCollectionCount).toHaveBeenCalledWith({ where: { userId: "user-xyz" } });
  });
});
