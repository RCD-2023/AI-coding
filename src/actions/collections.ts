"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  createCollectionInDb,
  updateCollectionInDb,
  deleteCollectionInDb,
  getCollectionsForSelector,
} from "@/lib/db/collections";

const createCollectionSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z
    .string()
    .transform((v) => v.trim() || null)
    .nullable()
    .optional(),
});

export type CreateCollectionResult =
  | { success: true }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export async function createCollection(raw: {
  name: string;
  description: string;
}): Promise<CreateCollectionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = createCollectionSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { name, description } = parsed.data;

  await createCollectionInDb(session.user.id, {
    name,
    description: description ?? null,
  });

  return { success: true };
}

export async function getUserCollectionsForSelector(): Promise<{ id: string; name: string }[]> {
  const session = await auth();
  if (!session?.user?.id) return [];
  return getCollectionsForSelector(session.user.id);
}

const updateCollectionSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z
    .string()
    .transform((v) => v.trim() || null)
    .nullable()
    .optional(),
});

export type UpdateCollectionResult =
  | { success: true }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export async function updateCollection(
  collectionId: string,
  raw: { name: string; description: string }
): Promise<UpdateCollectionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  const parsed = updateCollectionSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { name, description } = parsed.data;

  await updateCollectionInDb(collectionId, session.user.id, {
    name,
    description: description ?? null,
  });

  return { success: true };
}

export type DeleteCollectionResult =
  | { success: true }
  | { success: false; error: string };

export async function deleteCollection(
  collectionId: string
): Promise<DeleteCollectionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  await deleteCollectionInDb(collectionId, session.user.id);

  return { success: true };
}

export type ToggleFavoriteCollectionResult =
  | { success: true; isFavorite: boolean }
  | { success: false; error: string };

export async function toggleFavoriteCollection(
  collectionId: string
): Promise<ToggleFavoriteCollectionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  const collection = await prisma.collection.findFirst({
    where: { id: collectionId, userId: session.user.id },
    select: { isFavorite: true },
  });

  if (!collection) return { success: false, error: "Collection not found" };

  const updated = await prisma.collection.update({
    where: { id: collectionId },
    data: { isFavorite: !collection.isFavorite },
    select: { isFavorite: true },
  });

  return { success: true, isFavorite: updated.isFavorite };
}
