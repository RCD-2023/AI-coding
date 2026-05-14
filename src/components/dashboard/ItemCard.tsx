"use client";

import { useState } from "react";
import type { ItemForCard } from "@/lib/db/items";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Copy, Check } from "lucide-react";
import { iconMap } from "@/lib/icon-map";

export default function ItemCard({ item }: { item: ItemForCard }) {
  const [copied, setCopied] = useState(false);
  const Icon = iconMap[item.itemType.icon] ?? null;
  const { color } = item.itemType;
  const date = new Date(item.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const copyValue = item.content ?? item.url;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!copyValue) return;
    navigator.clipboard.writeText(copyValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Card
      className="group relative h-full cursor-pointer border-l-[3px] transition-colors hover:bg-accent/5"
      style={{ borderLeftColor: color }}
    >
      <CardContent className="flex items-start gap-3 p-4">
        {/* Type icon */}
        <div
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
          style={{ backgroundColor: `${color}20` }}
        >
          {Icon && <Icon className="h-4 w-4" style={{ color }} />}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-center justify-between gap-2">
            <p className="truncate font-medium text-foreground">{item.title}</p>
            {item.isFavorite && (
              <Star className="h-3.5 w-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
            )}
          </div>
          {item.description && (
            <p className="mb-2 text-xs text-muted-foreground line-clamp-1">
              {item.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-1">
            <Badge
              variant="secondary"
              className="px-1.5 py-0 text-xs"
              style={{ color }}
            >
              {item.itemType.name}
            </Badge>
            {item.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="px-1.5 py-0 text-xs"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Date */}
        <span className="shrink-0 text-xs text-muted-foreground">{date}</span>

        {/* Copy — absolute bottom-right */}
        {copyValue && (
          <button
            type="button"
            onClick={handleCopy}
            className="absolute bottom-3 right-3 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
            aria-label="Copy content"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </CardContent>
    </Card>
  );
}
