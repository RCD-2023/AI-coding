import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getCollectionWithItems } from "@/lib/db/collections";
import ItemsWithDrawer from "@/components/dashboard/ItemsWithDrawer";
import CollectionDetailActions from "@/components/dashboard/CollectionDetailActions";

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth();
  const userId = session?.user?.id ?? "";

  const collection = userId ? await getCollectionWithItems(id, userId) : null;

  if (!collection) notFound();

  const gridClass = "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
            style={{ backgroundColor: `${collection.dominantColor}20` }}
          />
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {collection.name}
            </h1>
            {collection.description && (
              <p className="text-sm text-muted-foreground">
                {collection.description}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              {collection.itemCount}{" "}
              {collection.itemCount === 1 ? "item" : "items"}
            </p>
          </div>
        </div>

        <CollectionDetailActions collection={collection} />
      </div>

      {collection.items.length > 0 ? (
        <ItemsWithDrawer
          items={collection.items}
          variant="default"
          className={gridClass}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          No items in this collection yet.
        </p>
      )}
    </div>
  );
}
