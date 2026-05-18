"use server";

import { z } from "zod";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { r2, R2_BUCKET, r2KeyFromUrl } from "@/lib/r2";
import { createItemInDb, updateItemInDb } from "@/lib/db/items";
import type { ItemDetail } from "@/lib/db/items";

const FILE_TYPES = new Set(["file", "image"]);

const createItemSchema = z
  .object({
    typeSlug: z.string().min(1),
    title: z.string().trim().min(1, "Title is required"),
    description: z
      .string()
      .transform((v) => v.trim() || null)
      .nullable()
      .optional(),
    content: z
      .string()
      .transform((v) => v.trim() || null)
      .nullable()
      .optional(),
    url: z.preprocess(
      (v) => (!v || v === "" ? null : v),
      z.string().url("Must be a valid URL").nullable()
    ),
    language: z
      .string()
      .transform((v) => v.trim() || null)
      .nullable()
      .optional(),
    tags: z.string().transform((v) =>
      v
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    ),
    fileUrl: z
      .string()
      .transform((v) => v.trim() || null)
      .nullable()
      .optional(),
    fileName: z
      .string()
      .transform((v) => v.trim() || null)
      .nullable()
      .optional(),
    fileSize: z
      .number()
      .int()
      .positive()
      .nullable()
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.typeSlug === "link" && !data.url) {
      ctx.addIssue({
        code: "custom",
        message: "URL is required for links",
        path: ["url"],
      });
    }
    if (FILE_TYPES.has(data.typeSlug) && !data.fileUrl) {
      ctx.addIssue({
        code: "custom",
        message: "A file must be uploaded",
        path: ["fileUrl"],
      });
    }
  });

export type CreateItemResult =
  | { success: true; data: ItemDetail }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export async function createItem(raw: {
  typeSlug: string;
  title: string;
  description: string;
  content: string;
  url: string;
  language: string;
  tags: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number | null;
  collectionIds?: string[];
}): Promise<CreateItemResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = createItemSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { typeSlug, title, description, content, url, language, tags, fileUrl, fileName, fileSize } =
    parsed.data;

  const allTypes = await prisma.itemType.findMany({ where: { isSystem: true } });
  const matched = allTypes.find(
    (t) => t.name.toLowerCase() === typeSlug.toLowerCase()
  );
  if (!matched) {
    return { success: false, error: "Invalid item type" };
  }

  let contentType: "TEXT" | "FILE" | "URL";
  if (typeSlug === "link") {
    contentType = "URL";
  } else if (FILE_TYPES.has(typeSlug)) {
    contentType = "FILE";
  } else {
    contentType = "TEXT";
  }

  const created = await createItemInDb(session.user.id, {
    title,
    description: description ?? null,
    content: content ?? null,
    url: url ?? null,
    fileUrl: fileUrl ?? null,
    fileName: fileName ?? null,
    fileSize: fileSize ?? null,
    language: language ?? null,
    tags,
    collectionIds: raw.collectionIds ?? [],
    itemTypeId: matched.id,
    contentType,
  });

  return { success: true, data: created };
}

const updateItemSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z
    .string()
    .transform((v) => v.trim() || null)
    .nullable()
    .optional(),
  content: z
    .string()
    .transform((v) => v.trim() || null)
    .nullable()
    .optional(),
  url: z.preprocess(
    (v) => (!v || v === "" ? null : v),
    z.string().url("Must be a valid URL").nullable()
  ),
  language: z
    .string()
    .transform((v) => v.trim() || null)
    .nullable()
    .optional(),
  tags: z.string().transform((v) =>
    v
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
  ),
});

export type UpdateItemResult =
  | { success: true; data: ItemDetail }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export async function updateItem(
  itemId: string,
  raw: {
    title: string;
    description: string;
    content: string;
    url: string;
    language: string;
    tags: string;
    collectionIds?: string[];
  }
): Promise<UpdateItemResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = updateItemSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { title, description, content, url, language, tags } = parsed.data;

  const updated = await updateItemInDb(itemId, session.user.id, {
    title,
    description: description ?? null,
    content: content ?? null,
    url: url ?? null,
    language: language ?? null,
    tags,
    collectionIds: raw.collectionIds ?? [],
  });

  if (!updated) {
    return { success: false, error: "Item not found" };
  }

  return { success: true, data: updated };
}

export type DeleteItemResult =
  | { success: true }
  | { success: false; error: string };

export async function deleteItem(itemId: string): Promise<DeleteItemResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const item = await prisma.item.findFirst({
      where: { id: itemId, userId: session.user.id },
      select: { fileUrl: true },
    });

    if (!item) {
      return { success: false, error: "Item not found" };
    }

    if (item.fileUrl) {
      try {
        const key = r2KeyFromUrl(item.fileUrl);
        await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
      } catch {
        // Don't block deletion if R2 delete fails
      }
    }

    await prisma.item.delete({
      where: { id: itemId, userId: session.user.id },
    });

    return { success: true };
  } catch {
    return { success: false, error: "Item not found or already deleted" };
  }
}

export type ToggleFavoriteItemResult =
  | { success: true; isFavorite: boolean }
  | { success: false; error: string };

export async function toggleFavoriteItem(
  itemId: string
): Promise<ToggleFavoriteItemResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const item = await prisma.item.findFirst({
    where: { id: itemId, userId: session.user.id },
    select: { isFavorite: true },
  });

  if (!item) {
    return { success: false, error: "Item not found" };
  }

  const updated = await prisma.item.update({
    where: { id: itemId },
    data: { isFavorite: !item.isFavorite },
    select: { isFavorite: true },
  });

  return { success: true, isFavorite: updated.isFavorite };
}

export type TogglePinItemResult =
  | { success: true; isPinned: boolean }
  | { success: false; error: string };

export async function togglePinItem(
  itemId: string
): Promise<TogglePinItemResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const item = await prisma.item.findFirst({
    where: { id: itemId, userId: session.user.id },
    select: { isPinned: true },
  });

  if (!item) {
    return { success: false, error: "Item not found" };
  }

  const updated = await prisma.item.update({
    where: { id: itemId },
    data: { isPinned: !item.isPinned },
    select: { isPinned: true },
  });

  return { success: true, isPinned: updated.isPinned };
}
