import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    item: {
      delete: vi.fn(),
    },
  },
}));

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { deleteItem } from "@/actions/items";

const mockAuth = vi.mocked(auth);
const mockDelete = vi.mocked(prisma.item.delete);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("deleteItem", () => {
  it("returns unauthorized when no session", async () => {
    mockAuth.mockResolvedValue(null as never);

    const result = await deleteItem("item-1");

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Unauthorized");
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("returns unauthorized when session has no user id", async () => {
    mockAuth.mockResolvedValue({ user: {} } as never);

    const result = await deleteItem("item-1");

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Unauthorized");
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("deletes item and returns success", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockDelete.mockResolvedValue({} as never);

    const result = await deleteItem("item-1");

    expect(result.success).toBe(true);
    expect(mockDelete).toHaveBeenCalledWith({
      where: { id: "item-1", userId: "user-1" },
    });
  });

  it("returns error when prisma throws (item not found or wrong owner)", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockDelete.mockRejectedValue(new Error("Record not found"));

    const result = await deleteItem("item-999");

    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error).toBe("Item not found or already deleted");
  });
});
