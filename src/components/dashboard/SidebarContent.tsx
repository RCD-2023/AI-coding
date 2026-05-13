"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Settings, Star, User } from "lucide-react";
import type { SidebarData } from "@/lib/db/sidebar";
import type { SessionUser } from "@/components/dashboard/DashboardShell";
import { iconMap } from "@/lib/icon-map";
import { UserAvatar } from "@/components/UserAvatar";
import { signOutAction } from "@/actions/auth";

export default function SidebarContent({
  sidebarData,
  user,
}: {
  sidebarData: SidebarData | null;
  user: SessionUser | null;
}) {
  const [collectionsOpen, setCollectionsOpen] = useState(true);

  const itemTypes = sidebarData?.itemTypes ?? [];
  const favorites = sidebarData?.favorites ?? [];
  const recents = sidebarData?.recents ?? [];

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-3">
        {/* Types */}
        <div className="mb-4">
          <p className="mb-1 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Types
          </p>
          <nav className="space-y-0.5">
            {itemTypes.map((type) => {
              const Icon = iconMap[type.icon];
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
                    {type.name.charAt(0).toUpperCase() + type.name.slice(1)}s
                    {type.isPro && (
                      <Badge
                        variant="outline"
                        className="h-4 px-1 text-[10px] font-medium leading-none text-muted-foreground"
                      >
                        Pro
                      </Badge>
                    )}
                  </span>
                  <span className="text-xs">{type.count}</span>
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
              {favorites.length > 0 && (
                <div className="mb-3">
                  <p className="mb-1 px-2 text-xs text-muted-foreground">
                    Favorites
                  </p>
                  <nav className="space-y-0.5">
                    {favorites.map((col) => (
                      <Link
                        key={col.id}
                        href={`/collections/${col.id}`}
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        <Star
                          className="h-3 w-3 shrink-0"
                          style={{ color: col.dominantColor, fill: col.dominantColor }}
                        />
                        <span className="flex-1 truncate">{col.name}</span>
                        <span className="text-xs">{col.itemCount}</span>
                      </Link>
                    ))}
                  </nav>
                </div>
              )}

              {/* Recents */}
              {recents.length > 0 && (
                <div className="mb-2">
                  <p className="mb-1 px-2 text-xs text-muted-foreground">
                    Recents
                  </p>
                  <nav className="space-y-0.5">
                    {recents.map((col) => (
                      <Link
                        key={col.id}
                        href={`/collections/${col.id}`}
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: col.dominantColor }}
                        />
                        <span className="flex-1 truncate">{col.name}</span>
                        <span className="text-xs">{col.itemCount}</span>
                      </Link>
                    ))}
                  </nav>
                </div>
              )}

              {/* View all button */}
              <Link href="/collections" className="mt-2 block">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  View All Collections
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* User area */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent"
            >
              <UserAvatar name={user?.name} image={user?.image} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {user?.name ?? "User"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user?.email ?? ""}
                </p>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-48">
              <DropdownMenuItem>
                <Link href="/profile" className="flex w-full items-center gap-2">
                  <User className="h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOutAction()}>
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link
            href="/profile"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
