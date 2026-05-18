"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import EditCollectionDialog from "@/components/dashboard/EditCollectionDialog";
import DeleteCollectionDialog from "@/components/dashboard/DeleteCollectionDialog";
import { toggleFavoriteCollection } from "@/actions/collections";

interface Props {
  collection: { id: string; name: string; description: string | null; isFavorite: boolean };
}

export default function CollectionDetailActions({ collection }: Props) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleFavorite() {
    startTransition(async () => {
      await toggleFavoriteCollection(collection.id);
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleFavorite}
          disabled={isPending}
          title={collection.isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Star
            className={`h-4 w-4 ${collection.isFavorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
          />
          <span className="sr-only">Favorite</span>
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setEditOpen(true)} title="Edit collection">
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Edit</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDeleteOpen(true)}
          title="Delete collection"
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete</span>
        </Button>
      </div>

      <EditCollectionDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        collection={collection}
      />
      <DeleteCollectionDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        collection={collection}
        onDeleted={() => router.push("/collections")}
      />
    </>
  );
}
