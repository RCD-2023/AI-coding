"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  Edit,
  FolderOpen,
  Pin,
  Star,
  Tag,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { iconMap } from "@/lib/icon-map";
import { updateItem } from "@/actions/items";
import type { ItemDetail } from "@/lib/db/items";

// Item types that show the Content field
const CONTENT_TYPES = new Set(["snippet", "prompt", "command", "note"]);
// Item types that show the Language field
const LANGUAGE_TYPES = new Set(["snippet", "command"]);

interface ItemDrawerProps {
  itemId: string | null;
  onClose: () => void;
}

type EditForm = {
  title: string;
  description: string;
  content: string;
  language: string;
  url: string;
  tags: string;
};

function fieldLabel(text: string) {
  return (
    <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {text}
    </p>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="mt-1 text-xs text-destructive">{errors[0]}</p>;
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

export default function ItemDrawer({ itemId, onClose }: ItemDrawerProps) {
  const router = useRouter();
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({
    title: "",
    description: "",
    content: "",
    language: "",
    url: "",
    tags: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!itemId) {
      setItem(null);
      setIsEditing(false);
      return;
    }

    setLoading(true);
    setItem(null);
    setIsEditing(false);

    fetch(`/api/items/${itemId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setItem(data))
      .finally(() => setLoading(false));
  }, [itemId]);

  function enterEditMode() {
    if (!item) return;
    setEditForm({
      title: item.title,
      description: item.description ?? "",
      content: item.content ?? "",
      language: item.language ?? "",
      url: item.url ?? "",
      tags: item.tags.join(", "),
    });
    setFieldErrors({});
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
    setFieldErrors({});
  }

  async function handleSave() {
    if (!item || !itemId) return;
    setSaving(true);
    setFieldErrors({});

    const result = await updateItem(itemId, editForm);

    setSaving(false);

    if (result.success) {
      setItem(result.data);
      setIsEditing(false);
      router.refresh();
      toast.success("Item saved");
    } else {
      if (result.fieldErrors) {
        setFieldErrors(result.fieldErrors);
      }
      toast.error(result.error);
    }
  }

  function setField(key: keyof EditForm, value: string) {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  }

  const Icon = item ? (iconMap[item.itemType.icon] ?? null) : null;
  const typeName = item?.itemType.name.toLowerCase() ?? "";
  const showContent = CONTENT_TYPES.has(typeName);
  const showLanguage = LANGUAGE_TYPES.has(typeName);
  const showUrl = typeName === "link";

  return (
    <Sheet
      open={!!itemId}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
        showCloseButton
      >
        {loading || (itemId && !item) ? (
          <DrawerSkeleton />
        ) : item ? (
          <div className="flex h-full flex-col overflow-y-auto">
            {/* Header */}
            <SheetHeader className="border-b px-5 pb-3 pt-5">
              {/* Type + language badges */}
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

              {/* Title */}
              <div className="flex items-center gap-2 pr-8">
                {Icon && (
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                    style={{ backgroundColor: `${item.itemType.color}20` }}
                  >
                    <Icon
                      className="h-4 w-4"
                      style={{ color: item.itemType.color }}
                    />
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

            {/* Action bar */}
            {isEditing ? (
              <div className="flex items-center justify-end gap-2 border-b px-4 py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={cancelEdit}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!editForm.title.trim() || saving}
                >
                  {saving ? "Saving…" : "Save"}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1 border-b px-4 py-2">
                <Button variant="ghost" size="icon-sm" title="Favorite">
                  <Star
                    className="h-4 w-4"
                    style={
                      item.isFavorite
                        ? { fill: "#facc15", color: "#facc15" }
                        : {}
                    }
                  />
                </Button>
                <Button variant="ghost" size="icon-sm" title="Pin">
                  <Pin
                    className={`h-4 w-4 ${item.isPinned ? "fill-foreground" : ""}`}
                  />
                </Button>
                <Button variant="ghost" size="icon-sm" title="Copy">
                  <Copy className="h-4 w-4" />
                </Button>
                <div className="ml-auto flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Edit"
                    onClick={enterEditMode}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Delete"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Body */}
            <div className="flex flex-col gap-5 px-5 py-4">
              {/* Description */}
              {isEditing ? (
                <section>
                  {fieldLabel("Description")}
                  <Textarea
                    value={editForm.description}
                    onChange={(e) => setField("description", e.target.value)}
                    placeholder="Optional description"
                    className="min-h-[72px] resize-y text-sm"
                  />
                </section>
              ) : (
                item.description && (
                  <section>
                    {fieldLabel("Description")}
                    <p className="text-sm text-foreground">{item.description}</p>
                  </section>
                )
              )}

              {/* Content */}
              {isEditing && showContent ? (
                <section>
                  {fieldLabel("Content")}
                  <Textarea
                    value={editForm.content}
                    onChange={(e) => setField("content", e.target.value)}
                    placeholder="Item content"
                    className="min-h-[120px] resize-y font-mono text-xs"
                  />
                </section>
              ) : (
                !isEditing &&
                item.content && (
                  <section>
                    {fieldLabel("Content")}
                    <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-md bg-muted p-3 text-xs text-foreground">
                      {item.content}
                    </pre>
                  </section>
                )
              )}

              {/* Language */}
              {isEditing && showLanguage ? (
                <section>
                  {fieldLabel("Language")}
                  <Input
                    value={editForm.language}
                    onChange={(e) => setField("language", e.target.value)}
                    placeholder="e.g. typescript"
                    className="text-sm"
                  />
                </section>
              ) : (
                !isEditing &&
                item.url && (
                  <section>
                    {fieldLabel("URL")}
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-sm text-primary underline-offset-4 hover:underline"
                    >
                      {item.url}
                    </a>
                  </section>
                )
              )}

              {/* URL */}
              {isEditing && showUrl ? (
                <section>
                  {fieldLabel("URL")}
                  <Input
                    value={editForm.url}
                    onChange={(e) => setField("url", e.target.value)}
                    placeholder="https://..."
                    type="url"
                    className="text-sm"
                    aria-invalid={!!fieldErrors.url}
                  />
                  <FieldError errors={fieldErrors.url} />
                </section>
              ) : (
                !isEditing &&
                item.url && (
                  <section>
                    {fieldLabel("URL")}
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-sm text-primary underline-offset-4 hover:underline"
                    >
                      {item.url}
                    </a>
                  </section>
                )
              )}

              {/* Tags */}
              {isEditing ? (
                <section>
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <Tag className="h-3 w-3 text-muted-foreground" />
                    {fieldLabel("Tags")}
                  </div>
                  <Input
                    value={editForm.tags}
                    onChange={(e) => setField("tags", e.target.value)}
                    placeholder="react, hooks, typescript"
                    className="text-sm"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Comma-separated
                  </p>
                </section>
              ) : (
                item.tags.length > 0 && (
                  <section>
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <Tag className="h-3 w-3 text-muted-foreground" />
                      {fieldLabel("Tags")}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {item.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="px-2 py-0.5 text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </section>
                )
              )}

              {/* Collections — display only */}
              {item.collections.length > 0 && (
                <section>
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <FolderOpen className="h-3 w-3 text-muted-foreground" />
                    {fieldLabel("Collections")}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {item.collections.map((col) => (
                      <Badge
                        key={col.id}
                        variant="outline"
                        className="px-2 py-0.5 text-xs"
                      >
                        {col.name}
                      </Badge>
                    ))}
                  </div>
                </section>
              )}

              {/* Details — display only */}
              <section className="border-t pt-4">
                {fieldLabel("Details")}
                <dl className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <dt>Created</dt>
                    <dd>
                      {new Date(item.createdAt).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Updated</dt>
                    <dd>
                      {new Date(item.updatedAt).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </dd>
                  </div>
                </dl>
              </section>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
