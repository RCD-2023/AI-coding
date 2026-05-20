import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    collection: {
      count: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/db/collections", () => ({
  createCollectionInDb: vi.fn(),
  updateCollectionInDb: vi.fn(),
  deleteCollectionInDb: vi.fn(),
  getCollectionsForSelector: vi.fn(),
}));

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createCollectionInDb, updateCollectionInDb, deleteCollectionInDb } from "@/lib/db/collections";
import { createCollection, updateCollection, deleteCollection, toggleFavoriteCollection } from "@/actions/collections";

const mockAuth = vi.mocked(auth);
const mockCreate = vi.mocked(createCollectionInDb);
const mockUpdate = vi.mocked(updateCollectionInDb);
const mockDelete = vi.mocked(deleteCollectionInDb);
const mockUserFindUnique = vi.mocked(prisma.user.findUnique);
const mockCollectionCount = vi.mocked(prisma.collection.count);
const mockFindFirst = vi.mocked(prisma.collection.findFirst);
const mockPrismaUpdate = vi.mocked(prisma.collection.update);

const SESSION = { user: { id: "user-1" } };

beforeEach(() => {
  vi.clearAllMocks();
  mockCreate.mockResolvedValue({} as never);
  mockUpdate.mockResolvedValue({} as never);
  mockDelete.mockResolvedValue({} as never);
  // Default: Pro user — skips limit check so existing tests are unaffected
  mockUserFindUnique.mockResolvedValue({ isPro: true } as never);
});

describe("createCollection — auth", () => {
  it("returns unauthorized when there is no session", async () => {
    mockAuth.mockResolvedValue(null as never);

    const result = await createCollection({ name: "My Collection", description: "" });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Unauthorized");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns unauthorized when the session has no user id", async () => {
    mockAuth.mockResolvedValue({ user: {} } as never);

    const result = await createCollection({ name: "My Collection", description: "" });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Unauthorized");
    expect(mockCreate).not.toHaveBeenCalled();
  });
});

describe("createCollection — validation", () => {
  it("returns field errors when name is empty", async () => {
    mockAuth.mockResolvedValue(SESSION as never);

    const result = await createCollection({ name: "", description: "" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors?.name).toBeDefined();
    }
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns field errors when name is whitespace only", async () => {
    mockAuth.mockResolvedValue(SESSION as never);

    const result = await createCollection({ name: "   ", description: "" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors?.name).toBeDefined();
    }
    expect(mockCreate).not.toHaveBeenCalled();
  });
});

describe("createCollection — happy path", () => {
  it("creates collection and returns success", async () => {
    mockAuth.mockResolvedValue(SESSION as never);

    const result = await createCollection({ name: "My Snippets", description: "A great collection" });

    expect(result.success).toBe(true);
    expect(mockCreate).toHaveBeenCalledWith("user-1", {
      name: "My Snippets",
      description: "A great collection",
    });
  });

  it("coerces empty description to null", async () => {
    mockAuth.mockResolvedValue(SESSION as never);

    const result = await createCollection({ name: "My Snippets", description: "" });

    expect(result.success).toBe(true);
    expect(mockCreate).toHaveBeenCalledWith("user-1", {
      name: "My Snippets",
      description: null,
    });
  });

  it("coerces whitespace-only description to null", async () => {
    mockAuth.mockResolvedValue(SESSION as never);

    const result = await createCollection({ name: "My Snippets", description: "   " });

    expect(result.success).toBe(true);
    expect(mockCreate).toHaveBeenCalledWith("user-1", {
      name: "My Snippets",
      description: null,
    });
  });
});

// ─── updateCollection ────────────────────────────────────────────────────────

describe("updateCollection — auth", () => {
  it("returns unauthorized when there is no session", async () => {
    mockAuth.mockResolvedValue(null as never);

    const result = await updateCollection("col-1", { name: "New Name", description: "" });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Unauthorized");
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

describe("updateCollection — validation", () => {
  it("returns field errors when name is empty", async () => {
    mockAuth.mockResolvedValue(SESSION as never);

    const result = await updateCollection("col-1", { name: "", description: "" });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.fieldErrors?.name).toBeDefined();
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

describe("updateCollection — happy path", () => {
  it("updates collection and returns success", async () => {
    mockAuth.mockResolvedValue(SESSION as never);

    const result = await updateCollection("col-1", { name: "Renamed", description: "New desc" });

    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith("col-1", "user-1", {
      name: "Renamed",
      description: "New desc",
    });
  });

  it("coerces empty description to null", async () => {
    mockAuth.mockResolvedValue(SESSION as never);

    const result = await updateCollection("col-1", { name: "Renamed", description: "" });

    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith("col-1", "user-1", {
      name: "Renamed",
      description: null,
    });
  });
});

// ─── deleteCollection ────────────────────────────────────────────────────────

describe("deleteCollection — auth", () => {
  it("returns unauthorized when there is no session", async () => {
    mockAuth.mockResolvedValue(null as never);

    const result = await deleteCollection("col-1");

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Unauthorized");
    expect(mockDelete).not.toHaveBeenCalled();
  });
});

describe("deleteCollection — happy path", () => {
  it("deletes collection and returns success", async () => {
    mockAuth.mockResolvedValue(SESSION as never);

    const result = await deleteCollection("col-1");

    expect(result.success).toBe(true);
    expect(mockDelete).toHaveBeenCalledWith("col-1", "user-1");
  });
});

// ─── toggleFavoriteCollection ─────────────────────────────────────────────────

describe("toggleFavoriteCollection — auth", () => {
  it("returns unauthorized when there is no session", async () => {
    mockAuth.mockResolvedValue(null as never);

    const result = await toggleFavoriteCollection("col-1");

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Unauthorized");
    expect(mockFindFirst).not.toHaveBeenCalled();
  });
});

describe("toggleFavoriteCollection — not found", () => {
  it("returns error when collection does not belong to user", async () => {
    mockAuth.mockResolvedValue(SESSION as never);
    mockFindFirst.mockResolvedValue(null as never);

    const result = await toggleFavoriteCollection("col-1");

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Collection not found");
    expect(mockPrismaUpdate).not.toHaveBeenCalled();
  });
});

describe("toggleFavoriteCollection — happy path", () => {
  it("flips isFavorite from false to true", async () => {
    mockAuth.mockResolvedValue(SESSION as never);
    mockFindFirst.mockResolvedValue({ isFavorite: false } as never);
    mockPrismaUpdate.mockResolvedValue({ isFavorite: true } as never);

    const result = await toggleFavoriteCollection("col-1");

    expect(result.success).toBe(true);
    if (result.success) expect(result.isFavorite).toBe(true);
    expect(mockPrismaUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isFavorite: true } })
    );
  });

  it("flips isFavorite from true to false", async () => {
    mockAuth.mockResolvedValue(SESSION as never);
    mockFindFirst.mockResolvedValue({ isFavorite: true } as never);
    mockPrismaUpdate.mockResolvedValue({ isFavorite: false } as never);

    const result = await toggleFavoriteCollection("col-1");

    expect(result.success).toBe(true);
    if (result.success) expect(result.isFavorite).toBe(false);
    expect(mockPrismaUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isFavorite: false } })
    );
  });
});
