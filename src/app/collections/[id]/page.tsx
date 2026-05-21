import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getCollectionWithItems } from "@/lib/db/collections";
import { COLLECTIONS_PER_PAGE } from "@/lib/constants";
import ItemsWithDrawer from "@/components/dashboard/ItemsWithDrawer";
import CollectionDetailActions from "@/components/dashboard/CollectionDetailActions";
import PaginationControls from "@/components/dashboard/PaginationControls";

export default async function CollectionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [{ id }, { page: pageParam }] = await Promise.all([params, searchParams]);

  const page = Math.max(1, parseInt((Array.isArray(pageParam) ? pageParam[0] : pageParam) ?? "1", 10) || 1);

  const session = await auth();
  const userId = session?.user?.id ?? "";
  const isPro = session?.user?.isPro ?? false;

  const collection = userId ? await getCollectionWithItems(id, userId, page) : null;

  if (!collection) notFound();

  const totalPages = Math.ceil(collection.itemCount / COLLECTIONS_PER_PAGE);
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
        <>
          <ItemsWithDrawer
            items={collection.items}
            variant="default"
            className={gridClass}
            isPro={isPro}
          />
          <PaginationControls
            currentPage={page}
            totalPages={totalPages}
            basePath={`/collections/${id}`}
          />
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          No items in this collection yet.
        </p>
      )}
    </div>
  );
}
