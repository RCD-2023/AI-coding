"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ItemForCard } from "@/lib/db/items";
import ItemCard from "@/components/dashboard/ItemCard";
import ImageThumbnailCard from "@/components/dashboard/ImageThumbnailCard";
import FileListRow from "@/components/dashboard/FileListRow";
import ItemDrawer from "@/components/dashboard/ItemDrawer";

interface ItemsWithDrawerProps {
  items: ItemForCard[];
  className?: string;
  variant?: "default" | "gallery" | "list";
}

export default function ItemsWithDrawer({ items, className, variant = "default" }: ItemsWithDrawerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <>
      {variant === "list" ? (
        <div className={cn("overflow-hidden rounded-lg border bg-card divide-y divide-border", className)}>
          {items.map((item) => (
            <FileListRow
              key={item.id}
              item={item}
              onSelect={() => setSelectedId(item.id)}
            />
          ))}
        </div>
      ) : (
        <div className={cn(className)}>
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className="block w-full text-left"
              onClick={() => setSelectedId(item.id)}
            >
              {variant === "gallery" ? (
                <ImageThumbnailCard item={item} />
              ) : (
                <ItemCard item={item} />
              )}
            </button>
          ))}
        </div>
      )}
      <ItemDrawer itemId={selectedId} onCloseAction={() => setSelectedId(null)} />
    </>
  );
}
