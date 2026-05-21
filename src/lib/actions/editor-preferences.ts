"use server";

import { prisma } from "@/lib/prisma";
import {
  editorPreferencesSchema,
  type EditorPreferences,
} from "@/lib/editor-preferences";
import { requireAuth } from "@/lib/actions/helpers";

export async function updateEditorPreferences(
  prefs: EditorPreferences
): Promise<{ success: true } | { error: string }> {
  const authResult = await requireAuth();
  if (!authResult) return { error: "Unauthorized" };

  const parsed = editorPreferencesSchema.safeParse(prefs);
  if (!parsed.success) return { error: "Invalid preferences" };

  await prisma.user.update({
    where: { id: authResult.userId },
    data: { editorPreferences: parsed.data },
  });

  return { success: true };
}
