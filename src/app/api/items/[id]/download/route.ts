import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { r2, R2_BUCKET, r2KeyFromUrl } from "@/lib/r2";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const item = await prisma.item.findFirst({
    where: { id, userId: session.user.id },
    select: { fileUrl: true, fileName: true },
  });

  if (!item?.fileUrl) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const key = r2KeyFromUrl(item.fileUrl);
  const r2Response = await r2.send(
    new GetObjectCommand({ Bucket: R2_BUCKET, Key: key })
  );

  if (!r2Response.Body) {
    return NextResponse.json({ error: "File not found in storage" }, { status: 404 });
  }

  const stream = r2Response.Body.transformToWebStream();

  return new NextResponse(stream, {
    headers: {
      "Content-Type": r2Response.ContentType ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename="${item.fileName ?? "download"}"`,
    },
  });
}
