"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateItemInDb } from "@/lib/db/items";
import type { ItemDetail } from "@/lib/db/items";

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
    await prisma.item.delete({
      where: { id: itemId, userId: session.user.id },
    });
    return { success: true };
  } catch {
    return { success: false, error: "Item not found or already deleted" };
  }
}
