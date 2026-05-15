"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Menu, PanelLeft, Plus, Search } from "lucide-react";
import dynamic from "next/dynamic";
import SidebarContent from "./SidebarContent";
import CreateItemDialog from "./CreateItemDialog";
import CreateCollectionDialog from "./CreateCollectionDialog";
import type { SidebarData } from "@/lib/db/sidebar";
import type { SearchData } from "@/lib/db/search";

const CommandPalette = dynamic(() => import("./CommandPalette"), { ssr: false });
const ItemDrawer = dynamic(() => import("./ItemDrawer"), { ssr: false });

export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export default function DashboardShell({
  children,
  sidebarData,
  searchData,
  user,
}: {
  children: React.ReactNode;
  sidebarData: SidebarData | null;
  searchData: SearchData | null;
  user: SessionUser | null;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [createItemOpen, setCreateItemOpen] = useState(false);
  const [createCollectionOpen, setCreateCollectionOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteItemId, setPaletteItemId] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center border-b border-border bg-card px-4">
        {/* Logo + toggle */}
        <div className="flex w-60 shrink-0 items-center gap-1">
          {/* Mobile toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:hidden"
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>
          {/* Desktop toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden h-8 w-8 md:flex"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 px-1">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
              S
            </div>
            <span className="font-semibold text-foreground">DevStash</span>
          </div>
        </div>

        {/* Search — centered */}
        <div className="flex flex-1 justify-center">
          <div
            className="relative flex w-full max-w-sm cursor-pointer items-center"
            onClick={() => setPaletteOpen(true)}
          >
            <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="cursor-pointer pl-8 pr-16"
              readOnly
            />
            <kbd className="pointer-events-none absolute right-2.5 flex items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        </div>

        {/* Actions */}
        <div className="flex w-60 shrink-0 items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setCreateCollectionOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            New Collection
          </Button>
          <Button size="sm" onClick={() => setCreateItemOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            New Item
          </Button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <aside
          className={cn(
            "hidden flex-col border-r border-border bg-card transition-all duration-200 md:flex",
            sidebarOpen ? "w-60" : "w-0 overflow-hidden border-r-0"
          )}
        >
          <SidebarContent sidebarData={sidebarData} user={user} />
        </aside>

        {/* Mobile sheet */}
        <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
          <SheetContent side="left" className="w-60 bg-card p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SidebarContent sidebarData={sidebarData} user={user} />
          </SheetContent>
        </Sheet>

        {/* Main */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      <CreateItemDialog open={createItemOpen} onOpenChange={setCreateItemOpen} />
      <CreateCollectionDialog open={createCollectionOpen} onOpenChange={setCreateCollectionOpen} />
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        searchData={searchData}
        onItemSelect={(id) => setPaletteItemId(id)}
      />
      <ItemDrawer itemId={paletteItemId} onCloseAction={() => setPaletteItemId(null)} />
    </div>
  );
}
