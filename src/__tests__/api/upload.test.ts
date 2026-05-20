import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/r2", () => ({
  r2: { send: vi.fn() },
  R2_BUCKET: "test-bucket",
  R2_PUBLIC_URL: "https://pub-test.r2.dev",
}));

vi.mock("@aws-sdk/client-s3", () => ({
  PutObjectCommand: vi.fn(),
}));

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { r2 } from "@/lib/r2";
import { POST } from "@/app/api/upload/route";

const mockAuth = vi.mocked(auth);
const mockUserFindUnique = vi.mocked(prisma.user.findUnique);
const mockR2Send = vi.mocked(r2.send);

function makeRequest(file: File | null, itemType: string): Request {
  const fd = new FormData();
  if (file) fd.append("file", file);
  fd.append("itemType", itemType);
  return new Request("http://localhost/api/upload", { method: "POST", body: fd });
}

const PNG  = new File(["png-bytes"], "photo.png",  { type: "image/png" });
const PDF  = new File(["pdf-bytes"], "report.pdf", { type: "application/pdf" });
const EXE  = new File(["bad-bytes"], "virus.exe",  { type: "application/x-msdownload" });
const BMP  = new File(["bmp-bytes"], "old.bmp",    { type: "image/bmp" });
const PNG_BAD_MIME = new File(["bytes"], "photo.png", { type: "application/octet-stream" });

beforeEach(() => {
  vi.clearAllMocks();
  mockR2Send.mockResolvedValue({} as never);
  // Default: Pro user so existing upload tests are unaffected
  mockUserFindUnique.mockResolvedValue({ isPro: true } as never);
});

describe("POST /api/upload", () => {
  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null as never);

    const res = await POST(makeRequest(PNG, "image"));

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 403 when user is not Pro", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockUserFindUnique.mockResolvedValue({ isPro: false } as never);

    const res = await POST(makeRequest(PNG, "image"));

    expect(res.status).toBe(403);
    expect((await res.json()).error).toContain("Pro subscription");
  });

  it("returns 400 when no file field is present", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    const fd = new FormData();
    fd.append("itemType", "image");
    const req = new Request("http://localhost/api/upload", { method: "POST", body: fd });

    const res = await POST(req);

    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("No file provided");
  });

  it("returns 400 for invalid itemType", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);

    const res = await POST(makeRequest(PNG, "snippet"));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Invalid item type");
  });

  it("returns 400 for unsupported image extension", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);

    const res = await POST(makeRequest(BMP, "image"));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain(".bmp");
  });

  it("returns 400 for unsupported image MIME type", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);

    const res = await POST(makeRequest(PNG_BAD_MIME, "image"));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Unsupported image MIME type");
  });

  it("returns 400 for unsupported file extension", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);

    const res = await POST(makeRequest(EXE, "file"));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain(".exe");
  });

  it("uploads an image and returns url, fileName, fileSize", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);

    const res = await POST(makeRequest(PNG, "image"));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toMatch(/^https:\/\/pub-test\.r2\.dev\/user-1\/.+\.png$/);
    expect(body.fileName).toBe("photo.png");
    expect(body.fileSize).toBe(PNG.size);
    expect(mockR2Send).toHaveBeenCalledOnce();
  });

  it("uploads a PDF file and returns url, fileName, fileSize", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);

    const res = await POST(makeRequest(PDF, "file"));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toMatch(/^https:\/\/pub-test\.r2\.dev\/user-1\/.+\.pdf$/);
    expect(body.fileName).toBe("report.pdf");
    expect(body.fileSize).toBe(PDF.size);
    expect(mockR2Send).toHaveBeenCalledOnce();
  });

  it("scopes the R2 key under the authenticated user id", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-42" } } as never);

    const res = await POST(makeRequest(PNG, "image"));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toMatch(/^https:\/\/pub-test\.r2\.dev\/user-42\//);
  });
});
