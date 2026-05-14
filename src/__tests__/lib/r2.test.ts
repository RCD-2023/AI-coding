import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

describe("r2KeyFromUrl", () => {
  let r2KeyFromUrl: (url: string) => string;

  beforeAll(async () => {
    vi.stubEnv("R2_PUBLIC_URL", "https://pub-test.r2.dev");
    vi.stubEnv("R2_ACCOUNT_ID", "test-account-id");
    vi.stubEnv("R2_ACCESS_KEY_ID", "test-access-key");
    vi.stubEnv("R2_SECRET_ACCESS_KEY", "test-secret-key");
    vi.stubEnv("R2_BUCKET_NAME", "test-bucket");
    vi.resetModules();
    const mod = await import("@/lib/r2");
    r2KeyFromUrl = mod.r2KeyFromUrl;
  });

  afterAll(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("strips the public base URL and trailing slash from a fileUrl", () => {
    expect(r2KeyFromUrl("https://pub-test.r2.dev/user-1/uuid.pdf")).toBe(
      "user-1/uuid.pdf"
    );
  });

  it("handles nested paths", () => {
    expect(r2KeyFromUrl("https://pub-test.r2.dev/a/b/c.png")).toBe("a/b/c.png");
  });

  it("returns the original url unchanged when base does not match", () => {
    expect(r2KeyFromUrl("https://other.example.com/user/file.pdf")).toBe(
      "https://other.example.com/user/file.pdf"
    );
  });
});
