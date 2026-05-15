"use client";

import { useRouter } from "next/navigation";
import { Layers } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { iconMap } from "@/lib/icon-map";
import type { SearchData } from "@/lib/db/search";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchData: SearchData | null;
  onItemSelect: (itemId: string) => void;
}

export default function CommandPalette({
  open,
  onOpenChange,
  searchData,
  onItemSelect,
}: CommandPaletteProps) {
  const router = useRouter();

  const handleItemSelect = (itemId: string) => {
    onOpenChange(false);
    onItemSelect(itemId);
  };

  const handleCollectionSelect = (collectionId: string) => {
    onOpenChange(false);
    router.push(`/collections/${collectionId}`);
  };

  const items = searchData?.items ?? [];
  const collections = searchData?.collections ?? [];

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search"
      description="Search items and collections"
    >
      <Command>
      <CommandInput placeholder="Search items and collections..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {items.length > 0 && (
          <CommandGroup heading="Items">
            {items.map((item) => {
              const Icon = iconMap[item.itemType.icon];
              return (
                <CommandItem
                  key={item.id}
                  value={item.title}
                  onSelect={() => handleItemSelect(item.id)}
                >
                  {Icon && (
                    <div
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded"
                      style={{ backgroundColor: `${item.itemType.color}20` }}
                    >
                      <Icon className="h-3 w-3" style={{ color: item.itemType.color }} />
                    </div>
                  )}
                  <span className="truncate">{item.title}</span>
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                    {item.itemType.name}
                  </span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {items.length > 0 && collections.length > 0 && <CommandSeparator />}

        {collections.length > 0 && (
          <CommandGroup heading="Collections">
            {collections.map((col) => (
              <CommandItem
                key={col.id}
                value={col.name}
                onSelect={() => handleCollectionSelect(col.id)}
              >
                <Layers className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{col.name}</span>
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                  {col.itemCount} {col.itemCount === 1 ? "item" : "items"}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
      </Command>
    </CommandDialog>
  );
}
