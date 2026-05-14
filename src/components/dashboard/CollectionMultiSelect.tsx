"use client";

import { ChevronDown, FolderOpen } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Collection = { id: string; name: string };

interface CollectionMultiSelectProps {
  collections: Collection[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function CollectionMultiSelect({
  collections,
  selectedIds,
  onChange,
}: CollectionMultiSelectProps) {
  const [open, setOpen] = useState(false);

  function toggle(id: string) {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((s) => s !== id)
        : [...selectedIds, id]
    );
  }

  const label =
    selectedIds.length === 0
      ? "None"
      : selectedIds.length === 1
        ? (collections.find((c) => c.id === selectedIds[0])?.name ?? "1 collection")
        : `${selectedIds.length} collections`;

  if (collections.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">No collections yet</p>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm hover:bg-accent/50"
      >
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <FolderOpen className="h-3.5 w-3.5" />
          <span className={cn(selectedIds.length > 0 && "text-foreground")}>
            {label}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {collections.map((col) => {
            const selected = selectedIds.includes(col.id);
            return (
              <button
                key={col.id}
                type="button"
                onClick={() => toggle(col.id)}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-xs transition-colors",
                  selected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                )}
              >
                {col.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
