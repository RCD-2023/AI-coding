import type { CollectionForCard } from "@/lib/db/collections";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { iconMap } from "@/lib/icon-map";

export default function CollectionCard({
  collection,
}: {
  collection: CollectionForCard;
}) {
  return (
    <Card
      className="cursor-pointer border-l-[3px] transition-colors hover:bg-accent/5"
      style={{ borderLeftColor: collection.dominantColor }}
    >
      <CardContent className="p-4">
        <div className="mb-1 flex items-start justify-between gap-2">
          <h3 className="font-medium text-foreground leading-snug">
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
  );
}