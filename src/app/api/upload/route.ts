import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import path from "path";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { r2, R2_BUCKET, R2_PUBLIC_URL } from "@/lib/r2";

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"]);
const FILE_EXTENSIONS = new Set([".pdf", ".txt", ".md", ".json", ".yaml", ".yml", ".xml", ".csv", ".toml", ".ini"]);
const IMAGE_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"]);
const FILE_MIME_TYPES = new Set([
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/json",
  "application/x-yaml",
  "text/yaml",
  "application/xml",
  "text/xml",
  "text/csv",
  "application/toml",
]);

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isPro: true },
  });
  if (!dbUser?.isPro) {
    return NextResponse.json(
      { error: "File uploads require a Pro subscription." },
      { status: 403 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const file = formData.get("file");
  const itemType = formData.get("itemType") as string;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (itemType !== "file" && itemType !== "image") {
    return NextResponse.json({ error: "Invalid item type" }, { status: 400 });
  }

  const ext = path.extname(file.name).toLowerCase();
  const mimeType = file.type;
  const fileSize = file.size;

  if (itemType === "image") {
    if (!IMAGE_EXTENSIONS.has(ext)) {
      return NextResponse.json({ error: `Unsupported image format: ${ext}` }, { status: 400 });
    }
    if (!IMAGE_MIME_TYPES.has(mimeType)) {
      return NextResponse.json({ error: "Unsupported image MIME type" }, { status: 400 });
    }
    if (fileSize > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: "Image exceeds 5 MB limit" }, { status: 400 });
    }
  } else {
    if (!FILE_EXTENSIONS.has(ext)) {
      return NextResponse.json({ error: `Unsupported file format: ${ext}` }, { status: 400 });
    }
    if (!FILE_MIME_TYPES.has(mimeType)) {
      return NextResponse.json({ error: "Unsupported file MIME type" }, { status: 400 });
    }
    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File exceeds 10 MB limit" }, { status: 400 });
    }
  }

  const key = `${session.user.id}/${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      ContentDisposition: `inline; filename="${file.name}"`,
    })
  );

  return NextResponse.json({
    url: `${R2_PUBLIC_URL}/${key}`,
    fileName: file.name,
    fileSize,
  });
}
