"use client";

import Image from "next/image";
import { File as FileIcon, FolderOpen, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CodeEditor } from "@/components/ui/code-editor";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { formatBytes } from "@/lib/utils";
import { fieldLabel, FieldError } from "@/components/dashboard/form-helpers";
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
}: DrawerBodyProps) {
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
          <p className="mt-1 text-xs text-muted-foreground">Comma-separated</p>
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

      {/* Collections — display only */}
      {item.collections.length > 0 && (
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
