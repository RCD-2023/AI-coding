"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  createCollectionInDb,
  updateCollectionInDb,
  deleteCollectionInDb,
  getCollectionsForSelector,
} from "@/lib/db/collections";
import { FREE_COLLECTIONS_LIMIT } from "@/lib/constants";
import { checkCollectionLimit } from "@/lib/usage-limits";
import { requireAuth, parseOrError } from "@/lib/actions/helpers";
import { nullableString } from "@/lib/schemas/common";

const collectionSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: nullableString,
});

export type CreateCollectionResult =
  | { success: true }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export async function createCollection(raw: {
  name: string;
  description: string;
}): Promise<CreateCollectionResult> {
  const authResult = await requireAuth();
  if (!authResult) return { success: false, error: "Unauthorized" };
  const { userId } = authResult;

  const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { isPro: true } });
  if (!dbUser?.isPro) {
    const { allowed } = await checkCollectionLimit(userId);
    if (!allowed) {
      return {
        success: false,
        error: `Free plan is limited to ${FREE_COLLECTIONS_LIMIT} collections. Upgrade to Pro for unlimited collections.`,
      };
    }
  }

  const parsed = parseOrError(collectionSchema, raw);
  if (!("data" in parsed)) return parsed;
  const { name, description } = parsed.data;

  await createCollectionInDb(userId, { name, description: description ?? null });
  return { success: true };
}

export async function getUserCollectionsForSelector(): Promise<{ id: string; name: string }[]> {
  const authResult = await requireAuth();
  if (!authResult) return [];
  return getCollectionsForSelector(authResult.userId);
}

export type UpdateCollectionResult =
  | { success: true }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export async function updateCollection(
  collectionId: string,
  raw: { name: string; description: string }
): Promise<UpdateCollectionResult> {
  const authResult = await requireAuth();
  if (!authResult) return { success: false, error: "Unauthorized" };
  const { userId } = authResult;

  const parsed = parseOrError(collectionSchema, raw);
  if (!("data" in parsed)) return parsed;
  const { name, description } = parsed.data;

  await updateCollectionInDb(collectionId, userId, { name, description: description ?? null });
  return { success: true };
}

export type DeleteCollectionResult =
  | { success: true }
  | { success: false; error: string };

export async function deleteCollection(
  collectionId: string
): Promise<DeleteCollectionResult> {
  const authResult = await requireAuth();
  if (!authResult) return { success: false, error: "Unauthorized" };
  await deleteCollectionInDb(collectionId, authResult.userId);
  return { success: true };
}

export type ToggleFavoriteCollectionResult =
  | { success: true; isFavorite: boolean }
  | { success: false; error: string };

export async function toggleFavoriteCollection(
  collectionId: string
): Promise<ToggleFavoriteCollectionResult> {
  const authResult = await requireAuth();
  if (!authResult) return { success: false, error: "Unauthorized" };
  const { userId } = authResult;

  const collection = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
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
