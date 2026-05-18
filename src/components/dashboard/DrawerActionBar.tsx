"use client";

import { Copy, Download, Edit, Pin, Star, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import type { ItemDetail } from "@/lib/db/items";
import type { EditForm } from "@/components/dashboard/hooks/useItemDrawer";

interface DrawerActionBarProps {
  isEditing: boolean;
  saving: boolean;
  deleting: boolean;
  toggling: boolean;
  editForm: EditForm;
  item: ItemDetail;
  itemId: string | null;
  showFile: boolean;
  onCancel: () => void;
  onSave: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onFavorite: () => void;
}

export function DrawerActionBar({
  isEditing,
  saving,
  deleting,
  toggling,
  editForm,
  item,
  itemId,
  showFile,
  onCancel,
  onSave,
  onEdit,
  onDelete,
  onFavorite,
}: DrawerActionBarProps) {
  if (isEditing) {
    return (
      <div className="flex items-center justify-end gap-2 border-b px-4 py-2">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={onSave}
          disabled={!editForm.title.trim() || saving}
        >
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 border-b px-4 py-2">
      <Button
        variant="ghost"
        size="icon-sm"
        title={item.isFavorite ? "Remove from favorites" : "Add to favorites"}
        onClick={onFavorite}
        disabled={toggling}
      >
        <Star
          className="h-4 w-4"
          style={item.isFavorite ? { fill: "#facc15", color: "#facc15" } : {}}
        />
      </Button>
      <Button variant="ghost" size="icon-sm" title="Pin">
        <Pin className={`h-4 w-4 ${item.isPinned ? "fill-foreground" : ""}`} />
      </Button>
      <Button variant="ghost" size="icon-sm" title="Copy">
        <Copy className="h-4 w-4" />
      </Button>
      {showFile && itemId && (
        <a
          href={`/api/items/${itemId}/download`}
          download
          title="Download"
          className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
        >
          <Download className="h-4 w-4" />
        </a>
      )}
      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="icon-sm" title="Edit" onClick={onEdit}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          title="Delete"
          className="text-destructive hover:text-destructive"
          onClick={onDelete}
          disabled={deleting}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
