import { mockItemTypes } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

type Item = {
  id: string;
  title: string;
  description?: string | null;
  itemTypeId: string;
  isFavorite: boolean;
  tags: string[];
  createdAt: string;
};

export default function ItemCard({ item }: { item: Item }) {
  const type = mockItemTypes.find((t) => t.id === item.itemTypeId);
  const Icon = type ? iconMap[type.icon] : null;
  const date = new Date(item.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <Card className="transition-colors hover:bg-accent/5 cursor-pointer">
      <CardContent className="flex items-start gap-3 p-4">
        {/* Type icon */}
        <div
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
          style={{ backgroundColor: `${type?.color ?? "#6b7280"}20` }}
        >
          {Icon && (
            <Icon className="h-4 w-4" style={{ color: type?.color }} />
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-center justify-between gap-2">
            <p className="truncate font-medium text-foreground">{item.title}</p>
            {item.isFavorite && (
              <Star className="h-3.5 w-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
            )}
          </div>
          {item.description && (
            <p className="mb-2 text-xs text-muted-foreground line-clamp-1">
              {item.description}
            </p>
          )}
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.tags.slice(0, 4).map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="px-1.5 py-0 text-xs"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Date */}
        <span className="shrink-0 text-xs text-muted-foreground">{date}</span>
      </CardContent>
    </Card>
  );
}