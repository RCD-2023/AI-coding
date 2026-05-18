import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    item: {
      findFirst: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/r2", () => ({
  r2: { send: vi.fn() },
  R2_BUCKET: "test-bucket",
  r2KeyFromUrl: vi.fn().mockReturnValue("user-1/file.pdf"),
}));

vi.mock("@aws-sdk/client-s3", () => ({
  DeleteObjectCommand: vi.fn(),
}));

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { r2 } from "@/lib/r2";
import { deleteItem, togglePinItem } from "@/actions/items";

const mockAuth      = vi.mocked(auth);
const mockFindFirst = vi.mocked(prisma.item.findFirst);
const mockDelete    = vi.mocked(prisma.item.delete);
const mockUpdate    = vi.mocked(prisma.item.update);
const mockR2Send    = vi.mocked(r2.send);

const SESSION = { user: { id: "user-1" } };

beforeEach(() => {
  vi.clearAllMocks();
  mockR2Send.mockResolvedValue({} as never);
});

describe("deleteItem — auth", () => {
  it("returns unauthorized when there is no session", async () => {
    mockAuth.mockResolvedValue(null as never);

    const result = await deleteItem("item-1");

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Unauthorized");
    expect(mockFindFirst).not.toHaveBeenCalled();
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("returns unauthorized when the session has no user id", async () => {
    mockAuth.mockResolvedValue({ user: {} } as never);

    const result = await deleteItem("item-1");

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Unauthorized");
    expect(mockFindFirst).not.toHaveBeenCalled();
  });
});

describe("deleteItem — item not found", () => {
  it("returns an error when findFirst returns null", async () => {
    mockAuth.mockResolvedValue(SESSION as never);
    mockFindFirst.mockResolvedValue(null);

    const result = await deleteItem("item-999");

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Item not found");
    expect(mockDelete).not.toHaveBeenCalled();
    expect(mockR2Send).not.toHaveBeenCalled();
  });
});

describe("deleteItem — non-file item", () => {
  it("skips R2 and deletes from DB when item has no fileUrl", async () => {
    mockAuth.mockResolvedValue(SESSION as never);
    mockFindFirst.mockResolvedValue({ fileUrl: null } as never);
    mockDelete.mockResolvedValue({} as never);

    const result = await deleteItem("item-1");

    expect(result.success).toBe(true);
    expect(mockR2Send).not.toHaveBeenCalled();
    expect(mockDelete).toHaveBeenCalledWith({
      where: { id: "item-1", userId: "user-1" },
    });
  });
});

describe("deleteItem — file item", () => {
  it("deletes from R2 then from DB when item has a fileUrl", async () => {
    mockAuth.mockResolvedValue(SESSION as never);
    mockFindFirst.mockResolvedValue({
      fileUrl: "https://pub-test.r2.dev/user-1/file.pdf",
    } as never);
    mockDelete.mockResolvedValue({} as never);

    const result = await deleteItem("item-1");

    expect(result.success).toBe(true);
    expect(mockR2Send).toHaveBeenCalledOnce();
    expect(mockDelete).toHaveBeenCalledWith({
      where: { id: "item-1", userId: "user-1" },
    });
  });

  it("still deletes from DB when R2 deletion throws (fail-open)", async () => {
    mockAuth.mockResolvedValue(SESSION as never);
    mockFindFirst.mockResolvedValue({
      fileUrl: "https://pub-test.r2.dev/user-1/file.pdf",
    } as never);
    mockR2Send.mockRejectedValue(new Error("R2 unavailable"));
    mockDelete.mockResolvedValue({} as never);

    const result = await deleteItem("item-1");

    expect(result.success).toBe(true);
    expect(mockDelete).toHaveBeenCalledOnce();
  });
});

describe("deleteItem — DB error", () => {
  it("returns an error when prisma.item.delete throws", async () => {
    mockAuth.mockResolvedValue(SESSION as never);
    mockFindFirst.mockResolvedValue({ fileUrl: null } as never);
    mockDelete.mockRejectedValue(new Error("DB error"));

    const result = await deleteItem("item-1");

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Item not found or already deleted");
  });
});

describe("togglePinItem — auth", () => {
  it("returns unauthorized when there is no session", async () => {
    mockAuth.mockResolvedValue(null as never);

    const result = await togglePinItem("item-1");

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Unauthorized");
    expect(mockFindFirst).not.toHaveBeenCalled();
  });
});

describe("togglePinItem — item not found", () => {
  it("returns an error when findFirst returns null", async () => {
    mockAuth.mockResolvedValue(SESSION as never);
    mockFindFirst.mockResolvedValue(null);

    const result = await togglePinItem("item-999");

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Item not found");
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

describe("togglePinItem — toggle", () => {
  it("pins an unpinned item", async () => {
    mockAuth.mockResolvedValue(SESSION as never);
    mockFindFirst.mockResolvedValue({ isPinned: false } as never);
    mockUpdate.mockResolvedValue({ isPinned: true } as never);

    const result = await togglePinItem("item-1");

    expect(result.success).toBe(true);
    if (result.success) expect(result.isPinned).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "item-1" },
      data: { isPinned: true },
      select: { isPinned: true },
    });
  });

  it("unpins a pinned item", async () => {
    mockAuth.mockResolvedValue(SESSION as never);
    mockFindFirst.mockResolvedValue({ isPinned: true } as never);
    mockUpdate.mockResolvedValue({ isPinned: false } as never);

    const result = await togglePinItem("item-1");

    expect(result.success).toBe(true);
    if (result.success) expect(result.isPinned).toBe(false);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "item-1" },
      data: { isPinned: false },
      select: { isPinned: true },
    });
  });
});
