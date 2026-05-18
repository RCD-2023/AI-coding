"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import type { EditorProps, OnMount, BeforeMount } from "@monaco-editor/react";
import { Check, Copy } from "lucide-react";
import { useEditorPreferences } from "@/context/EditorPreferencesContext";
import monokai from "@/lib/themes/monokai.json";
import githubDark from "@/lib/themes/github-dark.json";

const MIN_HEIGHT = 120;
const MAX_HEIGHT = 400;

const MonacoEditor = dynamic<EditorProps>(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div style={{ height: MIN_HEIGHT }} className="w-full animate-pulse bg-[#1e1e1e]" />
  ),
});

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: string;
  readOnly?: boolean;
}

export function CodeEditor({ value, onChange, language, readOnly = false }: CodeEditorProps) {
  const { prefs } = useEditorPreferences();
  const [copied, setCopied] = useState(false);
  const [height, setHeight] = useState(MIN_HEIGHT);

  const handleBeforeMount = useCallback<BeforeMount>((monaco) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    monaco.editor.defineTheme("monokai", monokai as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    monaco.editor.defineTheme("github-dark", githubDark as any);
  }, []);

  const handleMount = useCallback<OnMount>((editor) => {
    const updateHeight = () => {
      const contentHeight = editor.getContentHeight();
      setHeight(Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, contentHeight)));
    };
    editor.onDidContentSizeChange(updateHeight);
    updateHeight();
  }, []);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [value]);

  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-[#1e1e1e]">
      {/* macOS chrome header */}
      <div className="flex items-center border-b border-white/10 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>
        {language && (
          <span className="ml-3 text-[11px] text-white/40">{language}</span>
        )}
        <button
          type="button"
          onClick={handleCopy}
          className="ml-auto flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-white/40 transition-colors hover:bg-white/10 hover:text-white/70"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      {/* Monaco editor */}
      <MonacoEditor
        height={height}
        value={value}
        language={language?.toLowerCase() || "plaintext"}
        theme={prefs.theme}
        beforeMount={handleBeforeMount}
        onMount={handleMount}
        onChange={readOnly ? undefined : (val) => onChange?.(val ?? "")}
        options={{
          readOnly,
          minimap: { enabled: prefs.minimap },
          scrollBeyondLastLine: false,
          fontSize: prefs.fontSize,
          tabSize: prefs.tabSize,
          lineNumbers: "off",
          folding: false,
          wordWrap: prefs.wordWrap ? "on" : "off",
          renderLineHighlight: "none",
          padding: { top: 12, bottom: 12 },
          scrollbar: {
            verticalScrollbarSize: 5,
            alwaysConsumeMouseWheel: false,
          },
          overviewRulerLanes: 0,
          automaticLayout: true,
          renderValidationDecorations: "off",
        }}
      />
    </div>
  );
}