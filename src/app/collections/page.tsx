import Link from "next/link";
import { FolderOpen } from "lucide-react";
import { auth } from "@/auth";
import { getCollectionsForUser } from "@/lib/db/collections";
import CollectionCard from "@/components/dashboard/CollectionCard";

export default async function CollectionsPage() {
  const session = await auth();
  const userId = session?.user?.id ?? "";

  const collections = userId ? await getCollectionsForUser(userId) : [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
          <FolderOpen className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Collections</h1>
          <p className="text-sm text-muted-foreground">
            {collections.length} {collections.length === 1 ? "collection" : "collections"}
          </p>
        </div>
      </div>

      {collections.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((col) => (
            <Link key={col.id} href={`/collections/${col.id}`}>
              <CollectionCard collection={col} />
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No collections yet.</p>
      )}
    </div>
  );
}
