"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateItem, deleteItem } from "@/actions/items";
import { getUserCollectionsForSelector } from "@/actions/collections";
import type { ItemDetail } from "@/lib/db/items";

export const CONTENT_TYPES  = new Set(["snippet", "prompt", "command", "note"]);
export const LANGUAGE_TYPES = new Set(["snippet", "command"]);
export const FILE_TYPES     = new Set(["file", "image"]);

export type EditForm = {
  title: string;
  description: string;
  content: string;
  language: string;
  url: string;
  tags: string;
};

interface UseItemDrawerOptions {
  itemId: string | null;
  onCloseAction: () => void;
}

export function useItemDrawer({ itemId, onCloseAction }: UseItemDrawerOptions) {
  const router = useRouter();
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({
    title: "",
    description: "",
    content: "",
    language: "",
    url: "",
    tags: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [collectionIds, setCollectionIds] = useState<string[]>([]);
  const [userCollections, setUserCollections] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!itemId) return;

    /* eslint-disable react-hooks/set-state-in-effect */
    setLoading(true);
    setItem(null);
    setIsEditing(false);
    setDeleteDialogOpen(false);
    /* eslint-enable react-hooks/set-state-in-effect */

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
    setCollectionIds(item.collections.map((c) => c.id));
    setFieldErrors({});
    setIsEditing(true);
    getUserCollectionsForSelector().then(setUserCollections);
  }

  function cancelEdit() {
    setIsEditing(false);
    setFieldErrors({});
  }

  async function handleSave() {
    if (!item || !itemId) return;
    setSaving(true);
    setFieldErrors({});

    const result = await updateItem(itemId, { ...editForm, collectionIds });

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

  async function handleDelete() {
    if (!itemId) return;
    setDeleting(true);
    const result = await deleteItem(itemId);
    setDeleting(false);
    if (result.success) {
      toast.success("Item deleted");
      setDeleteDialogOpen(false);
      onCloseAction();
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  function setField(key: keyof EditForm, value: string) {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  }

  return {
    item,
    loading,
    isEditing,
    saving,
    deleting,
    deleteDialogOpen,
    setDeleteDialogOpen,
    editForm,
    fieldErrors,
    collectionIds,
    setCollectionIds,
    userCollections,
    enterEditMode,
    cancelEdit,
    handleSave,
    handleDelete,
    setField,
  };
}
