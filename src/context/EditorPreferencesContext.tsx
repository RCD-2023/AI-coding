"use client";

import { createContext, useContext, useState } from "react";
import {
  DEFAULT_EDITOR_PREFERENCES,
  type EditorPreferences,
} from "@/lib/editor-preferences";

type ContextValue = {
  prefs: EditorPreferences;
  setPrefs: (prefs: EditorPreferences) => void;
};

const EditorPreferencesContext = createContext<ContextValue>({
  prefs: DEFAULT_EDITOR_PREFERENCES,
  setPrefs: () => {},
});

export function EditorPreferencesProvider({
  children,
  initial,
}: {
  children: React.ReactNode;
  initial: EditorPreferences;
}) {
  const [prefs, setPrefs] = useState<EditorPreferences>(initial);
  return (
    <EditorPreferencesContext.Provider value={{ prefs, setPrefs }}>
      {children}
    </EditorPreferencesContext.Provider>
  );
}

export function useEditorPreferences() {
  return useContext(EditorPreferencesContext);
}
