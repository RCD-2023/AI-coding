import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getItemsByTypeSlug } from "@/lib/db/items";
import { ITEMS_PER_PAGE } from "@/lib/constants";
import { iconMap } from "@/lib/icon-map";
import ItemsWithDrawer from "@/components/dashboard/ItemsWithDrawer";
import AddItemButton from "@/components/dashboard/AddItemButton";
import PaginationControls from "@/components/dashboard/PaginationControls";
import { buttonVariants } from "@/components/ui/button";
import { Lock, Zap } from "lucide-react";
import type { TypeSlug } from "@/components/dashboard/CreateItemDialog";

const PRO_ONLY_TYPES = new Set(["files", "images"]);

const DIALOG_TYPE_SLUGS = new Set<string>(["snippet", "prompt", "command", "note", "link", "file", "image"]);

export default async function ItemsTypePage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [{ type }, { page: pageParam }] = await Promise.all([params, searchParams]);

  const page = Math.max(1, parseInt((Array.isArray(pageParam) ? pageParam[0] : pageParam) ?? "1", 10) || 1);

  const session = await auth();
  const userId = session?.user?.id ?? "";
  const isPro = session?.user?.isPro ?? false;

  if (PRO_ONLY_TYPES.has(type) && !isPro) {
    const label = type === "images" ? "Images" : "Files";
    return (
      <div className="flex flex-col items-center justify-center gap-6 p-6 text-center" style={{ minHeight: "60vh" }}>
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Lock className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">{label} are a Pro feature</h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            Upgrade to Pro to upload and manage {label.toLowerCase()}, plus get unlimited items and collections.
          </p>
        </div>
        <Link href="/billing" className={buttonVariants()}>
          <Zap className="mr-2 h-4 w-4" />
          Upgrade to Pro
        </Link>
      </div>
    );
  }

  const result = userId ? await getItemsByTypeSlug(userId, type, page) : null;

  if (!result) notFound();

  const { items, itemType, total } = result;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const Icon = iconMap[itemType.icon] ?? null;
  const typeSlug = itemType.name.toLowerCase();
  const isDialogType = DIALOG_TYPE_SLUGS.has(typeSlug);
  const isGallery = typeSlug === "image";
  const isFileList = typeSlug === "file";

  const variant = isGallery ? "gallery" : isFileList ? "list" : "default";
  const gridClass = isFileList
    ? undefined
    : "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3";

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
              {total} {total === 1 ? "item" : "items"}
            </p>
          </div>
        </div>
        {isDialogType && (
          <AddItemButton typeSlug={typeSlug as TypeSlug} label={itemType.name} isPro={isPro} />
        )}
      </div>

      {/* Items */}
      {items.length > 0 ? (
        <>
          <ItemsWithDrawer items={items} variant={variant} className={gridClass} isPro={isPro} />
          <PaginationControls
            currentPage={page}
            totalPages={totalPages}
            basePath={`/items/${type}`}
          />
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          No {itemType.name.toLowerCase()}s yet.
        </p>
      )}
    </div>
  );
}
