"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { FolderOpen, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { iconMap } from "@/lib/icon-map";
import { cn } from "@/lib/utils";
import ItemDrawer from "@/components/dashboard/ItemDrawer";
import type { FavoriteItem, FavoriteCollection } from "@/lib/db/favorites";

type SortKey = "name" | "date" | "type";

const SORT_LABELS: Record<SortKey, string> = { name: "Name", date: "Date", type: "Type" };

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function sortItems(items: FavoriteItem[], sort: SortKey): FavoriteItem[] {
  return [...items].sort((a, b) => {
    if (sort === "name") return a.title.localeCompare(b.title);
    if (sort === "type") {
      const typeCmp = a.itemType.name.localeCompare(b.itemType.name);
      return typeCmp !== 0 ? typeCmp : a.title.localeCompare(b.title);
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

function sortCollections(collections: FavoriteCollection[], sort: SortKey): FavoriteCollection[] {
  return [...collections].sort((a, b) => {
    if (sort === "date") {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
    return a.name.localeCompare(b.name);
  });
}

export default function FavoritesContent({
  items,
  collections,
  isPro = false,
}: {
  items: FavoriteItem[];
  collections: FavoriteCollection[];
  isPro?: boolean;
}) {
  const [sort, setSort] = useState<SortKey>("date");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const sortedItems = useMemo(() => sortItems(items, sort), [items, sort]);
  const sortedCollections = useMemo(() => sortCollections(collections, sort), [collections, sort]);

  const hasAny = items.length > 0 || collections.length > 0;

  return (
    <div className="space-y-8 p-6">
      {/* Page header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
            <Star className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Favorites</h1>
            <p className="text-sm text-muted-foreground">
              {hasAny
                ? `${items.length} ${items.length === 1 ? "item" : "items"}, ${collections.length} ${collections.length === 1 ? "collection" : "collections"}`
                : "No favorites yet"}
            </p>
          </div>
        </div>

        {hasAny && (
          <div className="flex items-center gap-1 rounded-md border border-border bg-muted/30 p-0.5">
            {(["name", "date", "type"] as SortKey[]).map((key) => (
              <Button
                key={key}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-7 px-3 font-mono text-xs transition-colors",
                  sort === key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setSort(key)}
              >
                {SORT_LABELS[key]}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      {!hasAny ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <Star className="h-10 w-10 text-muted-foreground/40" />
          <p className="font-mono text-sm text-muted-foreground">
            Star items and collections to find them here
          </p>
        </div>
      ) : (
        <>
          {sortedItems.length > 0 && (
            <section>
              <h2 className="mb-3 font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Items ({sortedItems.length})
              </h2>
              <div className="divide-y divide-border overflow-hidden rounded-md border border-border">
                {sortedItems.map((item) => {
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
            </section>
          )}

          {sortedCollections.length > 0 && (
            <section>
              <h2 className="mb-3 font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Collections ({sortedCollections.length})
              </h2>
              <div className="divide-y divide-border overflow-hidden rounded-md border border-border">
                {sortedCollections.map((col) => (
                  <Link
                    key={col.id}
                    href={`/collections/${col.id}`}
                    className="flex items-center gap-3 px-3 py-2 font-mono text-sm transition-colors hover:bg-muted/50"
                  >
                    <FolderOpen
                      className="h-4 w-4 shrink-0"
                      style={{ color: col.dominantColor }}
                    />
                    <span className="min-w-0 flex-1 truncate text-foreground">
                      {col.name}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {col.itemCount} {col.itemCount === 1 ? "item" : "items"}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {formatDate(col.updatedAt)}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <ItemDrawer itemId={selectedId} onCloseAction={() => setSelectedId(null)} isPro={isPro} />
    </div>
  );
}
