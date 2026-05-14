"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Menu, PanelLeft, Plus, Search } from "lucide-react";
import SidebarContent from "./SidebarContent";
import CreateItemDialog from "./CreateItemDialog";
import CreateCollectionDialog from "./CreateCollectionDialog";
import type { SidebarData } from "@/lib/db/sidebar";

export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export default function DashboardShell({
  children,
  sidebarData,
  user,
}: {
  children: React.ReactNode;
  sidebarData: SidebarData | null;
  user: SessionUser | null;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [createItemOpen, setCreateItemOpen] = useState(false);
  const [createCollectionOpen, setCreateCollectionOpen] = useState(false);

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
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search items..." className="pl-8" />
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
    </div>
  );
}
