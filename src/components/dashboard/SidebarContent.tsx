"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  mockCollections,
  mockItemTypes,
  mockTypeCounts,
  mockUser,
} from "@/lib/mock-data";
import {
  ChevronDown,
  Code,
  File,
  Image,
  Link as LinkIcon,
  Settings,
  Sparkles,
  Star,
  StickyNote,
  Terminal,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image,
  Link: LinkIcon,
};

export default function SidebarContent() {
  const [collectionsOpen, setCollectionsOpen] = useState(true);
  const favoriteCollections = mockCollections.filter((c) => c.isFavorite);
  const allCollections = mockCollections.filter((c) => !c.isFavorite);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-3">
        {/* Types */}
        <div className="mb-4">
          <p className="mb-1 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Types
          </p>
          <nav className="space-y-0.5">
            {mockItemTypes.map((type) => {
              const Icon = iconMap[type.icon];
              const count = mockTypeCounts[type.id] ?? 0;
              const href = `/items/${type.name.toLowerCase()}s`;
              return (
                <Link
                  key={type.id}
                  href={href}
                  className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <span className="flex items-center gap-2">
                    {Icon && (
                      <Icon
                        className="h-4 w-4 shrink-0"
                        style={{ color: type.color }}
                      />
                    )}
                    {type.name}
                  </span>
                  <span className="text-xs">{count}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Collections */}
        <div>
          <button
            onClick={() => setCollectionsOpen(!collectionsOpen)}
            className="mb-1 flex w-full items-center justify-between px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
          >
            Collections
            <ChevronDown
              className={cn(
                "h-3 w-3 transition-transform duration-200",
                collectionsOpen ? "rotate-0" : "-rotate-90"
              )}
            />
          </button>

          {collectionsOpen && (
            <>
              {/* Favorites */}
              {favoriteCollections.length > 0 && (
                <div className="mb-3">
                  <p className="mb-1 px-2 text-xs text-muted-foreground">
                    Favorites
                  </p>
                  <nav className="space-y-0.5">
                    {favoriteCollections.map((col) => (
                      <Link
                        key={col.id}
                        href={`/collections/${col.id}`}
                        className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        <span className="truncate">{col.name}</span>
                        <Star className="h-3 w-3 shrink-0 fill-yellow-400 text-yellow-400" />
                      </Link>
                    ))}
                  </nav>
                </div>
              )}

              {/* All Collections */}
              {allCollections.length > 0 && (
                <div>
                  <p className="mb-1 px-2 text-xs text-muted-foreground">
                    All Collections
                  </p>
                  <nav className="space-y-0.5">
                    {allCollections.map((col) => (
                      <Link
                        key={col.id}
                        href={`/collections/${col.id}`}
                        className="flex items-center rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        <span className="truncate">{col.name}</span>
                      </Link>
                    ))}
                  </nav>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* User area */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
            {mockUser.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {mockUser.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {mockUser.email}
            </p>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}