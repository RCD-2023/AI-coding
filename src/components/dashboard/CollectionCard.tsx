import { mockItemTypes } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import {
  Code,
  File,
  Image,
  Link as LinkIcon,
  Sparkles,
  Star,
  StickyNote,
  Terminal,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image,
  Link: LinkIcon,
};

type Collection = {
  id: string;
  name: string;
  description: string;
  isFavorite: boolean;
  itemCount: number;
  itemTypeIds: string[];
};

export default function CollectionCard({
  collection,
}: {
  collection: Collection;
}) {
  const dominantType = mockItemTypes.find(
    (t) => t.id === collection.itemTypeIds[0]
  );
  const accentColor = dominantType?.color ?? "#6b7280";

  return (
    <Card
      className="border-l-[3px] transition-colors hover:bg-accent/5 cursor-pointer"
      style={{ borderLeftColor: accentColor }}
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
            {collection.itemTypeIds.slice(0, 4).map((typeId) => {
              const type = mockItemTypes.find((t) => t.id === typeId);
              if (!type) return null;
              const Icon = iconMap[type.icon];
              return Icon ? (
                <Icon
                  key={typeId}
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