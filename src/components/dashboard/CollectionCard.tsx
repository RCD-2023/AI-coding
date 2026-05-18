"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Star, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { iconMap } from "@/lib/icon-map";
import type { CollectionForCard } from "@/lib/db/collections";
import EditCollectionDialog from "@/components/dashboard/EditCollectionDialog";
import DeleteCollectionDialog from "@/components/dashboard/DeleteCollectionDialog";
import { toggleFavoriteCollection } from "@/actions/collections";

export default function CollectionCard({
  collection,
}: {
  collection: CollectionForCard;
}) {
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
      <div className="relative">
        <Link href={`/collections/${collection.id}`} className="block">
          <Card
            className="cursor-pointer border-l-[3px] transition-colors hover:bg-accent/5"
            style={{ borderLeftColor: collection.dominantColor }}
          >
            <CardContent className="p-4">
              <div className="mb-1 flex items-start justify-between gap-2">
                <h3 className="font-medium text-foreground leading-snug pr-6">
                  {collection.name}
                </h3>
                {collection.isFavorite && (
                  <Star className="h-3.5 w-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
                )}
              </div>
              <p className="mb-3 text-xs text-muted-foreground line-clamp-2">
                {collection.description}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {collection.types.slice(0, 4).map((type) => {
                    const Icon = iconMap[type.icon];
                    return Icon ? (
                      <Icon
                        key={type.name}
                        className="h-3.5 w-3.5"
                        style={{ color: type.color }}
                      />
                    ) : null;
                  })}
                </div>
                <span className="text-xs text-muted-foreground">
                  {collection.itemCount} items
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* 3-dot menu — positioned over card, stops link navigation */}
        <div className="absolute right-2 top-2" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-6 w-6 items-center justify-center rounded-sm transition-colors hover:bg-accent focus-visible:outline-none">
              <MoreHorizontal className="h-3.5 w-3.5" />
              <span className="sr-only">Collection options</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <Pencil className="mr-2 h-3.5 w-3.5" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleFavorite} disabled={isPending}>
                <Star
                  className="mr-2 h-3.5 w-3.5"
                  style={collection.isFavorite ? { fill: "#facc15", color: "#facc15" } : {}}
                />
                {collection.isFavorite ? "Unfavorite" : "Favorite"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
      />
    </>
  );
}
