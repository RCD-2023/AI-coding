"use client";

import { useState } from "react";
import { iconMap } from "@/lib/icon-map";
import ItemDrawer from "@/components/dashboard/ItemDrawer";
import type { FavoriteItem } from "@/lib/db/favorites";

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function FavoritesItemsList({ items }: { items: FavoriteItem[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <>
      <div className="divide-y divide-border overflow-hidden rounded-md border border-border">
        {items.map((item) => {
          const Icon = iconMap[item.itemType.icon];
          return (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              className="flex cursor-pointer items-center gap-3 px-3 py-2 font-mono text-sm transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              onClick={() => setSelectedId(item.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedId(item.id);
                }
              }}
            >
              {Icon && (
                <Icon
                  className="h-4 w-4 shrink-0"
                  style={{ color: item.itemType.color }}
                />
              )}
              <span className="min-w-0 flex-1 truncate text-foreground">
                {item.title}
              </span>
              <span
                className="shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium"
                style={{
                  backgroundColor: `${item.itemType.color}22`,
                  color: item.itemType.color,
                }}
              >
                {item.itemType.name}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {formatDate(item.updatedAt)}
              </span>
            </div>
          );
        })}
      </div>
      <ItemDrawer itemId={selectedId} onCloseAction={() => setSelectedId(null)} />
    </>
  );
}
