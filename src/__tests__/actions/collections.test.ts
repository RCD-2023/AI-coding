import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

vi.mock("@/lib/db/collections", () => ({
  createCollectionInDb: vi.fn(),
}));

import { auth } from "@/auth";
import { createCollectionInDb } from "@/lib/db/collections";
import { createCollection } from "@/actions/collections";

const mockAuth = vi.mocked(auth);
const mockCreate = vi.mocked(createCollectionInDb);

const SESSION = { user: { id: "user-1" } };

beforeEach(() => {
  vi.clearAllMocks();
  mockCreate.mockResolvedValue({} as never);
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
