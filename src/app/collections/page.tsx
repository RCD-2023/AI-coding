import { FolderOpen } from "lucide-react";
import { auth } from "@/auth";
import { getCollectionsForUserPaginated } from "@/lib/db/collections";
import { COLLECTIONS_PER_PAGE } from "@/lib/constants";
import CollectionCard from "@/components/dashboard/CollectionCard";
import PaginationControls from "@/components/dashboard/PaginationControls";

export default async function CollectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt((Array.isArray(pageParam) ? pageParam[0] : pageParam) ?? "1", 10) || 1);

  const session = await auth();
  const userId = session?.user?.id ?? "";

  const { collections, total } = userId
    ? await getCollectionsForUserPaginated(userId, page)
    : { collections: [], total: 0 };

  const totalPages = Math.ceil(total / COLLECTIONS_PER_PAGE);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
          <FolderOpen className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Collections</h1>
          <p className="text-sm text-muted-foreground">
            {total} {total === 1 ? "collection" : "collections"}
          </p>
        </div>
      </div>

      {collections.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((col) => (
              <CollectionCard key={col.id} collection={col} />
            ))}
          </div>
          <PaginationControls
            currentPage={page}
            totalPages={totalPages}
            basePath="/collections"
          />
        </>
      ) : (
        <p className="text-sm text-muted-foreground">No collections yet.</p>
      )}
    </div>
  );
}
