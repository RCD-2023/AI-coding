"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Check, File as FileIcon, FolderOpen, Loader2, Sparkles, Tag, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CodeEditor } from "@/components/ui/code-editor";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { formatBytes } from "@/lib/utils";
import { fieldLabel, FieldError } from "@/components/dashboard/form-helpers";
import { CollectionMultiSelect } from "@/components/dashboard/CollectionMultiSelect";
import { generateAutoTags } from "@/actions/ai";
import type { ItemDetail } from "@/lib/db/items";
import type { EditForm } from "@/components/dashboard/hooks/useItemDrawer";

interface DrawerBodyProps {
  item: ItemDetail;
  isEditing: boolean;
  editForm: EditForm;
  fieldErrors: Record<string, string[]>;
  setField: (key: keyof EditForm, value: string) => void;
  showContent: boolean;
  showLanguage: boolean;
  showUrl: boolean;
  showFile: boolean;
  typeName: string;
  userCollections: { id: string; name: string }[];
  collectionIds: string[];
  onCollectionIdsChange: (ids: string[]) => void;
  isPro?: boolean;
}

export function DrawerBody({
  item,
  isEditing,
  editForm,
  fieldErrors,
  setField,
  showContent,
  showLanguage,
  showUrl,
  showFile,
  typeName,
  userCollections,
  collectionIds,
  onCollectionIdsChange,
  isPro = false,
}: DrawerBodyProps) {
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setAiSuggestions([]);
      setIsLoadingAI(false);
    }
  }, [isEditing]);

  async function handleSuggestTags() {
    setIsLoadingAI(true);
    setAiSuggestions([]);
    const result = await generateAutoTags({
      title: editForm.title,
      content: editForm.content,
    });
    setIsLoadingAI(false);
    if (result.success) {
      const existing = editForm.tags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      const newTags = result.tags.filter((t) => !existing.includes(t));
      setAiSuggestions(newTags);
      if (newTags.length === 0) toast.info("No new tags to suggest.");
    } else {
      toast.error(result.error);
    }
  }

  function acceptSuggestion(tag: string) {
    const existing = editForm.tags.trim();
    setField("tags", existing ? `${existing}, ${tag}` : tag);
    setAiSuggestions((prev) => prev.filter((t) => t !== tag));
  }

  function rejectSuggestion(tag: string) {
    setAiSuggestions((prev) => prev.filter((t) => t !== tag));
  }

  return (
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

      {/* Image preview */}
      {!isEditing && typeName === "image" && item.fileUrl && (
        <section>
          {fieldLabel("Image")}
          <Image
            src={item.fileUrl}
            alt={item.fileName ?? item.title}
            width={1200}
            height={900}
            className="w-full rounded-md object-contain"
            style={{ height: "auto" }}
          />
          {item.fileName && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              {item.fileName}
              {item.fileSize ? ` · ${formatBytes(item.fileSize)}` : ""}
            </p>
          )}
        </section>
      )}

      {/* File info */}
      {!isEditing && typeName === "file" && item.fileUrl && (
        <section>
          {fieldLabel("File")}
          <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2.5">
            <FileIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {item.fileName ?? "Unknown file"}
              </p>
              {item.fileSize && (
                <p className="text-xs text-muted-foreground">{formatBytes(item.fileSize)}</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Content */}
      {isEditing && showContent ? (
        <section>
          {fieldLabel("Content")}
          {showLanguage ? (
            <CodeEditor
              value={editForm.content}
              onChange={(val) => setField("content", val)}
              language={editForm.language || undefined}
            />
          ) : (
            <MarkdownEditor
              value={editForm.content}
              onChange={(val) => setField("content", val)}
            />
          )}
        </section>
      ) : (
        !isEditing &&
        item.content && (
          <section>
            {fieldLabel("Content")}
            {showLanguage ? (
              <CodeEditor
                value={item.content}
                language={item.language ?? undefined}
                readOnly
              />
            ) : (
              <MarkdownEditor value={item.content} readOnly />
            )}
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
          <div className="mb-1.5 flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5">
              <Tag className="h-3 w-3 text-muted-foreground" />
              {fieldLabel("Tags")}
            </div>
            {isPro && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={handleSuggestTags}
                disabled={isLoadingAI || !editForm.title.trim()}
              >
                {isLoadingAI ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                {isLoadingAI ? "Suggesting…" : "Suggest Tags"}
              </Button>
            )}
          </div>
          <Input
            value={editForm.tags}
            onChange={(e) => setField("tags", e.target.value)}
            placeholder="react, hooks, typescript"
            className="text-sm"
          />
          <p className="mt-1 text-xs text-muted-foreground">Comma-separated</p>
          {aiSuggestions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {aiSuggestions.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-0.5 rounded-full border bg-muted/50 px-2 py-0.5 text-xs"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => acceptSuggestion(tag)}
                    className="ml-0.5 rounded-full p-0.5 text-green-500 hover:bg-green-500/10"
                    title="Accept"
                  >
                    <Check className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => rejectSuggestion(tag)}
                    className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    title="Reject"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
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
                <Badge key={tag} variant="secondary" className="px-2 py-0.5 text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </section>
        )
      )}

      {/* Collections */}
      {isEditing ? (
        <section>
          <div className="mb-1.5 flex items-center gap-1.5">
            <FolderOpen className="h-3 w-3 text-muted-foreground" />
            {fieldLabel("Collections")}
          </div>
          <CollectionMultiSelect
            collections={userCollections}
            selectedIds={collectionIds}
            onChange={onCollectionIdsChange}
          />
        </section>
      ) : (
        item.collections.length > 0 && (
          <section>
            <div className="mb-1.5 flex items-center gap-1.5">
              <FolderOpen className="h-3 w-3 text-muted-foreground" />
              {fieldLabel("Collections")}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {item.collections.map((col) => (
                <Badge key={col.id} variant="outline" className="px-2 py-0.5 text-xs">
                  {col.name}
                </Badge>
              ))}
            </div>
          </section>
        )
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
                timeZone: "UTC",
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
                timeZone: "UTC",
              })}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
