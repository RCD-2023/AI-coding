import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getItemsByTypeSlug } from "@/lib/db/items";
import { iconMap } from "@/lib/icon-map";
import ItemsWithDrawer from "@/components/dashboard/ItemsWithDrawer";
import AddItemButton from "@/components/dashboard/AddItemButton";
import type { TypeSlug } from "@/components/dashboard/CreateItemDialog";

const DIALOG_TYPE_SLUGS = new Set<string>(["snippet", "prompt", "command", "note", "link", "file", "image"]);

export default async function ItemsTypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;

  const session = await auth();
  const userId = session?.user?.id ?? "";

  const result = userId ? await getItemsByTypeSlug(userId, type) : null;

  if (!result) notFound();

  const { items, itemType } = result;
  const Icon = iconMap[itemType.icon] ?? null;
  const typeSlug = itemType.name.toLowerCase();
  const isDialogType = DIALOG_TYPE_SLUGS.has(typeSlug);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {Icon && (
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
              style={{ backgroundColor: `${itemType.color}20` }}
            >
              <Icon className="h-5 w-5" style={{ color: itemType.color }} />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-foreground capitalize">
              {itemType.name}s
            </h1>
            <p className="text-sm text-muted-foreground">
              {items.length} {items.length === 1 ? "item" : "items"}
            </p>
          </div>
        </div>
        {isDialogType && (
          <AddItemButton typeSlug={typeSlug as TypeSlug} label={itemType.name} />
        )}
      </div>

      {/* Grid */}
      {items.length > 0 ? (
        <ItemsWithDrawer
          items={items}
          className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3"
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          No {itemType.name.toLowerCase()}s yet.
        </p>
      )}
    </div>
  );
}
