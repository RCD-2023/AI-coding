import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    item: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@/lib/r2", () => ({
  r2: { send: vi.fn() },
  R2_BUCKET: "test-bucket",
  R2_PUBLIC_URL: "https://pub-test.r2.dev",
  r2KeyFromUrl: (url: string) => url.replace("https://pub-test.r2.dev/", ""),
}));

vi.mock("@aws-sdk/client-s3", () => ({
  GetObjectCommand: vi.fn(),
}));

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { r2 } from "@/lib/r2";
import { GET } from "@/app/api/items/[id]/download/route";

const mockAuth = vi.mocked(auth);
const mockFindFirst = vi.mocked(prisma.item.findFirst);
const mockR2Send = vi.mocked(r2.send);

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

function makeStream(content: string): ReadableStream {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(content));
      controller.close();
    },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/items/[id]/download", () => {
  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null as never);

    const res = await GET(new Request("http://localhost"), makeParams("item-1"));

    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe("Unauthorized");
  });

  it("returns 401 when session has no user id", async () => {
    mockAuth.mockResolvedValue({ user: {} } as never);

    const res = await GET(new Request("http://localhost"), makeParams("item-1"));

    expect(res.status).toBe(401);
  });

  it("returns 404 when item does not exist", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockFindFirst.mockResolvedValue(null);

    const res = await GET(new Request("http://localhost"), makeParams("item-1"));

    expect(res.status).toBe(404);
  });

  it("returns 404 when item has no fileUrl", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockFindFirst.mockResolvedValue({ fileUrl: null, fileName: "doc.pdf" } as never);

    const res = await GET(new Request("http://localhost"), makeParams("item-1"));

    expect(res.status).toBe(404);
    expect(mockR2Send).not.toHaveBeenCalled();
  });

  it("streams file with correct Content-Type and Content-Disposition", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockFindFirst.mockResolvedValue({
      fileUrl: "https://pub-test.r2.dev/user-1/abc.pdf",
      fileName: "report.pdf",
    } as never);
    mockR2Send.mockResolvedValue({
      Body: { transformToWebStream: () => makeStream("PDF content") },
      ContentType: "application/pdf",
    } as never);

    const res = await GET(new Request("http://localhost"), makeParams("item-1"));

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(res.headers.get("Content-Disposition")).toBe('attachment; filename="report.pdf"');
    expect(mockR2Send).toHaveBeenCalledOnce();
  });

  it("falls back to 'download' filename when fileName is null", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockFindFirst.mockResolvedValue({
      fileUrl: "https://pub-test.r2.dev/user-1/abc.pdf",
      fileName: null,
    } as never);
    mockR2Send.mockResolvedValue({
      Body: { transformToWebStream: () => makeStream("content") },
      ContentType: "application/pdf",
    } as never);

    const res = await GET(new Request("http://localhost"), makeParams("item-1"));

    expect(res.headers.get("Content-Disposition")).toBe('attachment; filename="download"');
  });

  it("falls back to application/octet-stream when ContentType is missing", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockFindFirst.mockResolvedValue({
      fileUrl: "https://pub-test.r2.dev/user-1/abc.dat",
      fileName: "data.dat",
    } as never);
    mockR2Send.mockResolvedValue({
      Body: { transformToWebStream: () => makeStream("data") },
      ContentType: undefined,
    } as never);

    const res = await GET(new Request("http://localhost"), makeParams("item-1"));

    expect(res.headers.get("Content-Type")).toBe("application/octet-stream");
  });

  it("enforces ownership by querying with userId", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-99" } } as never);
    mockFindFirst.mockResolvedValue(null);

    await GET(new Request("http://localhost"), makeParams("item-5"));

    expect(mockFindFirst).toHaveBeenCalledWith({
      where: { id: "item-5", userId: "user-99" },
      select: { fileUrl: true, fileName: true },
    });
  });
});
