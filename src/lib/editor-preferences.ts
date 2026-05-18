import { z } from "zod";

export const FONT_SIZES = [12, 13, 14, 15, 16, 18, 20] as const;
export const TAB_SIZES = [2, 4] as const;
export const EDITOR_THEMES = ["vs-dark", "monokai", "github-dark"] as const;

export const editorPreferencesSchema = z.object({
  fontSize: z.number().refine(
    (v): v is (typeof FONT_SIZES)[number] => (FONT_SIZES as readonly number[]).includes(v),
    { message: "Invalid font size" }
  ),
  tabSize: z.number().refine(
    (v): v is (typeof TAB_SIZES)[number] => (TAB_SIZES as readonly number[]).includes(v),
    { message: "Invalid tab size" }
  ),
  wordWrap: z.boolean(),
  minimap: z.boolean(),
  theme: z.enum(EDITOR_THEMES),
});

export type EditorPreferences = z.infer<typeof editorPreferencesSchema>;

export const DEFAULT_EDITOR_PREFERENCES: EditorPreferences = {
  fontSize: 12,
  tabSize: 2,
  wordWrap: true,
  minimap: false,
  theme: "vs-dark",
};

export function parseEditorPreferences(raw: unknown): EditorPreferences {
  const result = editorPreferencesSchema.safeParse(raw);
  return result.success ? result.data : DEFAULT_EDITOR_PREFERENCES;
}
