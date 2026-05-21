"use server";

import { z } from "zod";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/prisma";
import { r2, R2_BUCKET, r2KeyFromUrl } from "@/lib/r2";
import { createItemInDb, updateItemInDb, toggleItemField } from "@/lib/db/items";
import type { ItemDetail } from "@/lib/db/items";
import { FREE_ITEMS_LIMIT } from "@/lib/constants";
import { checkItemLimit } from "@/lib/usage-limits";
import { requireAuth, parseOrError } from "@/lib/actions/helpers";
import { nullableString, nullableUrl, tagsField } from "@/lib/schemas/common";

const FILE_TYPES = new Set(["file", "image"]);

const createItemSchema = z
  .object({
    typeSlug: z.string().min(1),
    title: z.string().trim().min(1, "Title is required"),
    description: nullableString,
    content: nullableString,
    url: nullableUrl,
    language: nullableString,
    tags: tagsField,
    fileUrl: nullableString,
    fileName: nullableString,
    fileSize: z.number().int().positive().nullable().optional(),
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
  const authResult = await requireAuth();
  if (!authResult) return { success: false, error: "Unauthorized" };
  const { userId } = authResult;

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPro: true },
  });
  const isPro = dbUser?.isPro ?? false;

  if (!isPro) {
    const { allowed } = await checkItemLimit(userId);
    if (!allowed) {
      return {
        success: false,
        error: `Free plan is limited to ${FREE_ITEMS_LIMIT} items. Upgrade to Pro for unlimited items.`,
      };
    }
  }

  const parsed = parseOrError(createItemSchema, raw);
  if (!("data" in parsed)) return parsed;
  const { typeSlug, title, description, content, url, language, tags, fileUrl, fileName, fileSize } =
    parsed.data;

  const allTypes = await prisma.itemType.findMany({ where: { isSystem: true } });
  const matched = allTypes.find(
    (t) => t.name.toLowerCase() === typeSlug.toLowerCase()
  );
  if (!matched) return { success: false, error: "Invalid item type" };

  if (!isPro && FILE_TYPES.has(typeSlug)) {
    return { success: false, error: "File and image uploads require a Pro subscription." };
  }

  let contentType: "TEXT" | "FILE" | "URL";
  if (typeSlug === "link") {
    contentType = "URL";
  } else if (FILE_TYPES.has(typeSlug)) {
    contentType = "FILE";
  } else {
    contentType = "TEXT";
  }

  const created = await createItemInDb(userId, {
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
  description: nullableString,
  content: nullableString,
  url: nullableUrl,
  language: nullableString,
  tags: tagsField,
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
  const authResult = await requireAuth();
  if (!authResult) return { success: false, error: "Unauthorized" };
  const { userId } = authResult;

  const parsed = parseOrError(updateItemSchema, raw);
  if (!("data" in parsed)) return parsed;
  const { title, description, content, url, language, tags } = parsed.data;

  const updated = await updateItemInDb(itemId, userId, {
    title,
    description: description ?? null,
    content: content ?? null,
    url: url ?? null,
    language: language ?? null,
    tags,
    collectionIds: raw.collectionIds ?? [],
  });

  if (!updated) return { success: false, error: "Item not found" };
  return { success: true, data: updated };
}

export type DeleteItemResult =
  | { success: true }
  | { success: false; error: string };

export async function deleteItem(itemId: string): Promise<DeleteItemResult> {
  const authResult = await requireAuth();
  if (!authResult) return { success: false, error: "Unauthorized" };
  const { userId } = authResult;

  try {
    const item = await prisma.item.findFirst({
      where: { id: itemId, userId },
      select: { fileUrl: true },
    });

    if (!item) return { success: false, error: "Item not found" };

    if (item.fileUrl) {
      try {
        const key = r2KeyFromUrl(item.fileUrl);
        await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
      } catch {
        // Don't block deletion if R2 delete fails
      }
    }

    await prisma.item.delete({
      where: { id: itemId, userId },
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
  const authResult = await requireAuth();
  if (!authResult) return { success: false, error: "Unauthorized" };
  const { userId } = authResult;

  const newValue = await toggleItemField(itemId, userId, "isFavorite");
  if (newValue === null) return { success: false, error: "Item not found" };
  return { success: true, isFavorite: newValue };
}

export type TogglePinItemResult =
  | { success: true; isPinned: boolean }
  | { success: false; error: string };

export async function togglePinItem(
  itemId: string
): Promise<TogglePinItemResult> {
  const authResult = await requireAuth();
  if (!authResult) return { success: false, error: "Unauthorized" };
  const { userId } = authResult;

  const newValue = await toggleItemField(itemId, userId, "isPinned");
  if (newValue === null) return { success: false, error: "Item not found" };
  return { success: true, isPinned: newValue };
}
