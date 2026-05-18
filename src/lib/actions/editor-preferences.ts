"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  editorPreferencesSchema,
  type EditorPreferences,
} from "@/lib/editor-preferences";

export async function updateEditorPreferences(
  prefs: EditorPreferences
): Promise<{ success: true } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = editorPreferencesSchema.safeParse(prefs);
  if (!parsed.success) return { error: "Invalid preferences" };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { editorPreferences: parsed.data },
  });

  return { success: true };
}
