import Link from "next/link";
import { Bookmark, FolderOpen, Layers, Pin, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { auth } from "@/auth";
import { getDashboardData } from "@/lib/db/collections";
import { getDashboardItems } from "@/lib/db/items";
import CollectionCard from "@/components/dashboard/CollectionCard";
import ItemsWithDrawer from "@/components/dashboard/ItemsWithDrawer";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id ?? "";

  const [collections, items] = await Promise.all([
    userId ? getDashboardData(userId) : null,
    userId ? getDashboardItems(userId) : null,
  ]);

  const stats = [
    { label: "Total Items",          value: collections?.stats.totalItems         ?? 0, icon: Layers },
    { label: "Collections",          value: collections?.stats.totalCollections   ?? 0, icon: FolderOpen },
    { label: "Favorite Items",       value: collections?.stats.favoriteItems      ?? 0, icon: Star },
    { label: "Favorite Collections", value: collections?.stats.favoriteCollections ?? 0, icon: Bookmark },
  ];

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Your developer knowledge hub
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Collections */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Collections</h2>
          <Link
            href="/collections"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            View all
          </Link>
        </div>
        {collections?.collections.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {collections.collections.map((col) => (
              <Link key={col.id} href={`/collections/${col.id}`}>
                <CollectionCard collection={col} />
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No collections yet.</p>
        )}
      </section>

      {/* Pinned items */}
      {items?.pinned.length ? (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Pin className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Pinned</h2>
          </div>
          <ItemsWithDrawer items={items.pinned} className="space-y-3" />
        </section>
      ) : null}

      {/* Recent items */}
      {items?.recent.length ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            Recent Items
          </h2>
          <ItemsWithDrawer items={items.recent} className="space-y-3" />
        </section>
      ) : null}
    </div>
  );
}