"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { iconMap } from "@/lib/icon-map";
import { fieldLabel, FieldError } from "@/components/dashboard/form-helpers";
import {
  useItemDrawer,
  CONTENT_TYPES,
  LANGUAGE_TYPES,
  FILE_TYPES,
} from "@/components/dashboard/hooks/useItemDrawer";
import { DrawerActionBar } from "@/components/dashboard/DrawerActionBar";
import { DrawerBody } from "@/components/dashboard/DrawerBody";

interface ItemDrawerProps {
  itemId: string | null;
  onCloseAction: () => void;
}

function DrawerSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex gap-2">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-6 w-3/4" />
      <div className="flex gap-2 border-y py-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-8 rounded-md" />
        ))}
      </div>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-16 w-full rounded-md" />
      <Skeleton className="h-4 w-16" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-5 w-28 rounded-md" />
    </div>
  );
}

export default function ItemDrawer({ itemId, onCloseAction }: ItemDrawerProps) {
  const {
    item,
    loading,
    isEditing,
    saving,
    deleting,
    deleteDialogOpen,
    setDeleteDialogOpen,
    editForm,
    fieldErrors,
    enterEditMode,
    cancelEdit,
    handleSave,
    handleDelete,
    setField,
  } = useItemDrawer({ itemId, onCloseAction });

  const Icon = item ? (iconMap[item.itemType.icon] ?? null) : null;
  const typeName     = item?.itemType.name.toLowerCase() ?? "";
  const showContent  = CONTENT_TYPES.has(typeName);
  const showLanguage = LANGUAGE_TYPES.has(typeName);
  const showUrl      = typeName === "link";
  const showFile     = FILE_TYPES.has(typeName);

  return (
    <Sheet
      open={!!itemId}
      onOpenChange={(open) => {
        if (!open) onCloseAction();
      }}
    >
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden p-0 data-[side=right]:sm:max-w-md data-[side=right]:lg:max-w-[600px]"
        showCloseButton
      >
        {loading || (itemId && !item) ? (
          <DrawerSkeleton />
        ) : item ? (
          <div className="flex h-full flex-col overflow-y-auto">
            {/* Header */}
            <SheetHeader className="border-b px-5 pb-3 pt-5">
              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                <Badge
                  variant="secondary"
                  className="px-2 py-0.5 text-xs"
                  style={{ color: item.itemType.color }}
                >
                  {item.itemType.name}s
                </Badge>
                {!isEditing && item.language && (
                  <Badge variant="secondary" className="px-2 py-0.5 text-xs">
                    {item.language}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 pr-8">
                {Icon && (
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                    style={{ backgroundColor: `${item.itemType.color}20` }}
                  >
                    <Icon className="h-4 w-4" style={{ color: item.itemType.color }} />
                  </div>
                )}
                {isEditing ? (
                  <div className="flex-1">
                    <Input
                      value={editForm.title}
                      onChange={(e) => setField("title", e.target.value)}
                      placeholder="Title"
                      className="h-8 text-sm font-semibold"
                      aria-invalid={!!fieldErrors.title}
                    />
                    <FieldError errors={fieldErrors.title} />
                  </div>
                ) : (
                  <SheetTitle className="text-base font-semibold leading-tight">
                    {item.title}
                  </SheetTitle>
                )}
              </div>
            </SheetHeader>

            <DrawerActionBar
              isEditing={isEditing}
              saving={saving}
              deleting={deleting}
              editForm={editForm}
              item={item}
              itemId={itemId}
              showFile={showFile}
              onCancel={cancelEdit}
              onSave={handleSave}
              onEdit={enterEditMode}
              onDelete={() => setDeleteDialogOpen(true)}
            />

            <DrawerBody
              item={item}
              isEditing={isEditing}
              editForm={editForm}
              fieldErrors={fieldErrors}
              setField={setField}
              showContent={showContent}
              showLanguage={showLanguage}
              showUrl={showUrl}
              showFile={showFile}
              typeName={typeName}
            />
          </div>
        ) : null}
      </SheetContent>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete item?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &ldquo;{item?.title}&rdquo;. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}
