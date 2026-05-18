"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { updateEditorPreferences } from "@/lib/actions/editor-preferences";
import { useEditorPreferences } from "@/context/EditorPreferencesContext";
import {
  FONT_SIZES,
  TAB_SIZES,
  EDITOR_THEMES,
  type EditorPreferences,
} from "@/lib/editor-preferences";

const THEME_LABELS: Record<EditorPreferences["theme"], string> = {
  "vs-dark": "VS Dark",
  monokai: "Monokai",
  "github-dark": "GitHub Dark",
};

export function EditorPreferencesForm() {
  const { prefs, setPrefs } = useEditorPreferences();
  const [, startTransition] = useTransition();

  function handleChange(patch: Partial<EditorPreferences>) {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    startTransition(async () => {
      const result = await updateEditorPreferences(next);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Editor preferences saved");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Font Size</p>
          <p className="text-xs text-muted-foreground">Editor font size in pixels</p>
        </div>
        <Select
          value={String(prefs.fontSize)}
          onValueChange={(v) => handleChange({ fontSize: Number(v) as EditorPreferences["fontSize"] })}
        >
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_SIZES.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}px
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Tab Size</p>
          <p className="text-xs text-muted-foreground">Number of spaces per tab</p>
        </div>
        <Select
          value={String(prefs.tabSize)}
          onValueChange={(v) => handleChange({ tabSize: Number(v) as EditorPreferences["tabSize"] })}
        >
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TAB_SIZES.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size} spaces
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Theme</p>
          <p className="text-xs text-muted-foreground">Color theme for the code editor</p>
        </div>
        <Select
          value={prefs.theme}
          onValueChange={(v) => handleChange({ theme: v as EditorPreferences["theme"] })}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EDITOR_THEMES.map((theme) => (
              <SelectItem key={theme} value={theme}>
                {THEME_LABELS[theme]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Word Wrap</p>
          <p className="text-xs text-muted-foreground">Wrap long lines to the editor width</p>
        </div>
        <Switch
          checked={prefs.wordWrap}
          onCheckedChange={(checked) => handleChange({ wordWrap: checked })}
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Minimap</p>
          <p className="text-xs text-muted-foreground">Show code overview on the right</p>
        </div>
        <Switch
          checked={prefs.minimap}
          onCheckedChange={(checked) => handleChange({ minimap: checked })}
        />
      </div>
    </div>
  );
}