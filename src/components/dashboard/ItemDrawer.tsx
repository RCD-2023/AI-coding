"use client";

import { useEffect, useState } from "react";
import {
  Copy,
  Edit,
  FolderOpen,
  Pin,
  Star,
  Tag,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { iconMap } from "@/lib/icon-map";
import type { ItemDetail } from "@/lib/db/items";

interface ItemDrawerProps {
  itemId: string | null;
  onClose: () => void;
}

function DrawerSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex gap-2">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-6 w-3/4" />
      <div className="flex gap-2 border-y py-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-8 rounded-md" />
        ))}
      </div>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-16 w-full rounded-md" />
      <Skeleton className="h-4 w-16" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-5 w-28 rounded-md" />
    </div>
  );
}

export default function ItemDrawer({ itemId, onClose }: ItemDrawerProps) {
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!itemId) {
      setItem(null);
      return;
    }

    setLoading(true);
    setItem(null);

    fetch(`/api/items/${itemId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setItem(data))
      .finally(() => setLoading(false));
  }, [itemId]);

  const Icon = item ? (iconMap[item.itemType.icon] ?? null) : null;

  return (
    <Sheet open={!!itemId} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col gap-0 p-0 overflow-hidden" showCloseButton>
        {loading || (itemId && !item) ? (
          <DrawerSkeleton />
        ) : item ? (
          <div className="flex flex-col h-full overflow-y-auto">
            {/* Header */}
            <SheetHeader className="px-5 pt-5 pb-3 border-b">
              {/* Type + language badges */}
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                <Badge
                  variant="secondary"
                  className="text-xs px-2 py-0.5"
                  style={{ color: item.itemType.color }}
                >
                  {item.itemType.name}s
                </Badge>
                {item.language && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    {item.language}
                  </Badge>
                )}
              </div>

              {/* Title with type icon */}
              <div className="flex items-center gap-2 pr-8">
                {Icon && (
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                    style={{ backgroundColor: `${item.itemType.color}20` }}
                  >
                    <Icon className="h-4 w-4" style={{ color: item.itemType.color }} />
                  </div>
                )}
                <SheetTitle className="text-base font-semibold leading-tight">
                  {item.title}
                </SheetTitle>
              </div>
            </SheetHeader>

            {/* Action bar */}
            <div className="flex items-center gap-1 px-4 py-2 border-b">
              <Button variant="ghost" size="icon-sm" title="Favorite">
                <Star
                  className="h-4 w-4"
                  style={item.isFavorite ? { fill: "#facc15", color: "#facc15" } : {}}
                />
              </Button>
              <Button variant="ghost" size="icon-sm" title="Pin">
                <Pin className={`h-4 w-4 ${item.isPinned ? "fill-foreground" : ""}`} />
              </Button>
              <Button variant="ghost" size="icon-sm" title="Copy">
                <Copy className="h-4 w-4" />
              </Button>
              <div className="ml-auto flex items-center gap-1">
                <Button variant="ghost" size="icon-sm" title="Edit">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon-sm" title="Delete" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Body */}
            <div className="flex flex-col gap-5 px-5 py-4">
              {/* Description */}
              {item.description && (
                <section>
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Description
                  </p>
                  <p className="text-sm text-foreground">{item.description}</p>
                </section>
              )}

              {/* Content */}
              {item.content && (
                <section>
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Content
                  </p>
                  <pre className="rounded-md bg-muted p-3 text-xs text-foreground overflow-x-auto whitespace-pre-wrap break-words">
                    {item.content}
                  </pre>
                </section>
              )}

              {/* URL */}
              {item.url && (
                <section>
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    URL
                  </p>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary underline-offset-4 hover:underline break-all"
                  >
                    {item.url}
                  </a>
                </section>
              )}

              {/* Tags */}
              {item.tags.length > 0 && (
                <section>
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <Tag className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Tags
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="px-2 py-0.5 text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </section>
              )}

              {/* Collections */}
              {item.collections.length > 0 && (
                <section>
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <FolderOpen className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Collections
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {item.collections.map((col) => (
                      <Badge key={col.id} variant="outline" className="px-2 py-0.5 text-xs">
                        {col.name}
                      </Badge>
                    ))}
                  </div>
                </section>
              )}

              {/* Details */}
              <section className="border-t pt-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Details
                </p>
                <dl className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <dt>Created</dt>
                    <dd>{new Date(item.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Updated</dt>
                    <dd>{new Date(item.updatedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</dd>
                  </div>
                </dl>
              </section>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
