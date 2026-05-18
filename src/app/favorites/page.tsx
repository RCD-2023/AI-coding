import Link from "next/link";
import { Star, FolderOpen } from "lucide-react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getFavoritesData } from "@/lib/db/favorites";
import { iconMap } from "@/lib/icon-map";
import FavoritesItemsList from "@/components/dashboard/FavoritesItemsList";

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function FavoritesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const { items, collections } = await getFavoritesData(session.user.id);
  const hasAny = items.length > 0 || collections.length > 0;

  return (
    <div className="space-y-8 p-6">
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

      {!hasAny ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <Star className="h-10 w-10 text-muted-foreground/40" />
          <p className="font-mono text-sm text-muted-foreground">
            Star items and collections to find them here
          </p>
        </div>
      ) : (
        <>
          {items.length > 0 && (
            <section>
              <h2 className="mb-3 font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Items ({items.length})
              </h2>
              <FavoritesItemsList items={items} />
            </section>
          )}

          {collections.length > 0 && (
            <section>
              <h2 className="mb-3 font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Collections ({collections.length})
              </h2>
              <div className="divide-y divide-border overflow-hidden rounded-md border border-border">
                {collections.map((col) => {
                  const FolderIcon = FolderOpen;
                  return (
                    <Link
                      key={col.id}
                      href={`/collections/${col.id}`}
                      className="flex items-center gap-3 px-3 py-2 font-mono text-sm transition-colors hover:bg-muted/50"
                    >
                      <FolderIcon
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
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
