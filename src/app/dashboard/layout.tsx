import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center border-b border-border bg-card px-4">
        {/* Logo */}
        <div className="flex w-60 shrink-0 items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
            S
          </div>
          <span className="font-semibold text-foreground">DevStash</span>
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
          <Button variant="outline" size="sm">
            <Plus className="mr-1 h-4 w-4" />
            New Collection
          </Button>
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" />
            New Item
          </Button>
        </div>
      </header>
      {children}
    </div>
  );
}