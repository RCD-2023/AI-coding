import type { ItemForCard } from "@/lib/db/items";
import { Star, ImageIcon } from "lucide-react";

export default function ImageThumbnailCard({ item }: { item: ItemForCard }) {
  return (
    <div className="group overflow-hidden rounded-lg border bg-card cursor-pointer transition-colors hover:border-border/80">
      <div className="aspect-video overflow-hidden bg-muted">
        {item.fileUrl ? (
          <img
            src={item.fileUrl}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
          </div>
        )}
      </div>
      <div className="flex items-center gap-1.5 px-3 py-2">
        <p className="flex-1 truncate text-sm font-medium text-foreground">{item.title}</p>
        {item.isFavorite && (
          <Star className="h-3.5 w-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
        )}
      </div>
    </div>
  );
}
