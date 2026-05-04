import Link from "next/link";
import { Bookmark, FolderOpen, Layers, Pin, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { mockCollections, mockItems, mockTypeCounts } from "@/lib/mock-data";
import CollectionCard from "@/components/dashboard/CollectionCard";
import ItemCard from "@/components/dashboard/ItemCard";

const totalItems = Object.values(mockTypeCounts).reduce((a, b) => a + b, 0);
const totalCollections = mockCollections.length;
const favoriteItemsCount = mockItems.filter((i) => i.isFavorite).length;
const favoriteCollectionsCount = mockCollections.filter((c) => c.isFavorite).length;

const stats = [
  { label: "Total Items", value: totalItems, icon: Layers },
  { label: "Collections", value: totalCollections, icon: FolderOpen },
  { label: "Favorite Items", value: favoriteItemsCount, icon: Star },
  { label: "Favorite Collections", value: favoriteCollectionsCount, icon: Bookmark },
];

const recentCollections = [...mockCollections].sort(
  (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
);

const pinnedItems = mockItems.filter((i) => i.isPinned);

const recentItems = [...mockItems]
  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  .slice(0, 10);

export default function DashboardPage() {
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recentCollections.map((col) => (
            <CollectionCard key={col.id} collection={col} />
          ))}
        </div>
      </section>

      {/* Pinned items */}
      {pinnedItems.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Pin className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Pinned</h2>
          </div>
          <div className="space-y-3">
            {pinnedItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Recent items */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-foreground">
          Recent Items
        </h2>
        <div className="space-y-3">
          {recentItems.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}