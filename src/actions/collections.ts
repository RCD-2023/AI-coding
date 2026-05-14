"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { createCollectionInDb } from "@/lib/db/collections";

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
