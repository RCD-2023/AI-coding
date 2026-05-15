"use client";

import { ChevronDown, FolderOpen } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  function toggle(id: string) {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((s) => s !== id)
        : [...selectedIds, id]
    );
  }

  const label =
    selectedIds.length === 0
      ? "Select collections…"
      : selectedIds.length === 1
        ? (collections.find((c) => c.id === selectedIds[0])?.name ?? "1 collection")
        : `${selectedIds.length} collections`;

  if (collections.length === 0) {
    return <p className="text-xs text-muted-foreground">No collections yet</p>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-8 w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm whitespace-nowrap outline-none transition-colors hover:bg-accent/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-placeholder:text-muted-foreground">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <FolderOpen className="h-3.5 w-3.5 shrink-0" />
          <span className={selectedIds.length > 0 ? "text-foreground" : ""}>
            {label}
          </span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-full min-w-[200px]">
        {collections.map((col) => (
          <DropdownMenuCheckboxItem
            key={col.id}
            checked={selectedIds.includes(col.id)}
            onCheckedChange={() => toggle(col.id)}
          >
            {col.name}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
