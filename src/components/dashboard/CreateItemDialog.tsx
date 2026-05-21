"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Code, File as FileIcon, FolderOpen, Image as ImageIcon, Link as LinkIcon, Loader2, Sparkles, StickyNote, Tag, Terminal, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CodeEditor } from "@/components/ui/code-editor";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { FileUpload } from "@/components/ui/file-upload";
import type { UploadResult } from "@/components/ui/file-upload";
import { createItem } from "@/actions/items";
import { generateAutoTags } from "@/actions/ai";
import { getUserCollectionsForSelector } from "@/actions/collections";
import { CollectionMultiSelect } from "@/components/dashboard/CollectionMultiSelect";
import { fieldLabel, FieldError } from "@/components/dashboard/form-helpers";

const ITEM_TYPES = [
  { slug: "snippet", label: "Snippet", icon: Code },
  { slug: "prompt",  label: "Prompt",  icon: Sparkles },
  { slug: "command", label: "Command", icon: Terminal },
  { slug: "note",    label: "Note",    icon: StickyNote },
  { slug: "link",    label: "Link",    icon: LinkIcon },
  { slug: "file",    label: "File",    icon: FileIcon },
  { slug: "image",   label: "Image",   icon: ImageIcon },
] as const;

export type TypeSlug = (typeof ITEM_TYPES)[number]["slug"];

const CONTENT_TYPES  = new Set<TypeSlug>(["snippet", "prompt", "command", "note"]);
const LANGUAGE_TYPES = new Set<TypeSlug>(["snippet", "command"]);
const FILE_TYPES     = new Set<TypeSlug>(["file", "image"]);

type CreateForm = {
  title: string;
  description: string;
  content: string;
  language: string;
  url: string;
  tags: string;
};

const DEFAULT_FORM: CreateForm = {
  title: "",
  description: "",
  content: "",
  language: "",
  url: "",
  tags: "",
};

interface CreateItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: TypeSlug;
  isPro?: boolean;
}

export default function CreateItemDialog({ open, onOpenChange, defaultType, isPro = false }: CreateItemDialogProps) {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<TypeSlug>(defaultType ?? "snippet");
  const [form, setForm] = useState<CreateForm>(DEFAULT_FORM);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [collectionIds, setCollectionIds] = useState<string[]>([]);
  const [userCollections, setUserCollections] = useState<{ id: string; name: string }[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  useEffect(() => {
    if (open) {
      getUserCollectionsForSelector().then(setUserCollections);
    } else {
      setSelectedType(defaultType ?? "snippet");
      setForm(DEFAULT_FORM);
      setUploadResult(null);
      setFieldErrors({});
      setCollectionIds([]);
      setAiSuggestions([]);
      setIsLoadingAI(false);
    }
  }, [open, defaultType]);

  async function handleSuggestTags() {
    setIsLoadingAI(true);
    setAiSuggestions([]);
    const result = await generateAutoTags({ title: form.title, content: form.content });
    setIsLoadingAI(false);
    if (result.success) {
      const existing = form.tags
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
    const existing = form.tags.trim();
    setField("tags", existing ? `${existing}, ${tag}` : tag);
    setAiSuggestions((prev) => prev.filter((t) => t !== tag));
  }

  function rejectSuggestion(tag: string) {
    setAiSuggestions((prev) => prev.filter((t) => t !== tag));
  }

  function setField(key: keyof CreateForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleCreate() {
    setSaving(true);
    setFieldErrors({});

    const result = await createItem({
      typeSlug: selectedType,
      ...form,
      fileUrl: uploadResult?.url ?? "",
      fileName: uploadResult?.fileName ?? "",
      fileSize: uploadResult?.fileSize ?? null,
      collectionIds,
    });

    setSaving(false);

    if (result.success) {
      onOpenChange(false);
      router.refresh();
      toast.success("Item created");
    } else {
      if (result.fieldErrors) {
        setFieldErrors(result.fieldErrors);
      }
      toast.error(result.error);
    }
  }

  const isFileType    = FILE_TYPES.has(selectedType);
  const showContent   = CONTENT_TYPES.has(selectedType);
  const showLanguage  = LANGUAGE_TYPES.has(selectedType);
  const showUrl       = selectedType === "link";

  const canSubmit =
    form.title.trim().length > 0 &&
    (!showUrl || form.url.trim().length > 0) &&
    (!isFileType || !!uploadResult) &&
    !saving;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Item</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 overflow-y-auto py-1 pr-1">
          {/* Type selector */}
          <div>
            {fieldLabel("Type")}
            <Select
              value={selectedType}
              onValueChange={(val) => {
                setSelectedType(val as TypeSlug);
                setUploadResult(null);
              }}
            >
              <SelectTrigger className="w-full">
                {(() => {
                  const type = ITEM_TYPES.find((t) => t.slug === selectedType)!;
                  const Icon = type.icon;
                  return (
                    <span className="flex items-center gap-1.5">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      {type.label}
                    </span>
                  );
                })()}
              </SelectTrigger>
              <SelectContent>
                {ITEM_TYPES.map(({ slug, label, icon: Icon }) => (
                  <SelectItem key={slug} value={slug}>
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div>
            {fieldLabel("Title")}
            <Input
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="Title"
              className="text-sm"
              aria-invalid={!!fieldErrors.title}
            />
            <FieldError errors={fieldErrors.title} />
          </div>

          {/* Description */}
          <div>
            {fieldLabel("Description")}
            <Textarea
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Optional description"
              className="min-h-[64px] resize-y text-sm"
            />
          </div>

          {/* File / Image upload */}
          {isFileType && (
            <div>
              {fieldLabel(selectedType === "image" ? "Image" : "File")}
              <FileUpload
                itemType={selectedType as "file" | "image"}
                uploadResult={uploadResult}
                onUpload={setUploadResult}
                onClear={() => setUploadResult(null)}
              />
              <FieldError errors={fieldErrors.fileUrl} />
            </div>
          )}

          {/* Content */}
          {showContent && (
            <div>
              {fieldLabel("Content")}
              {showLanguage ? (
                <CodeEditor
                  value={form.content}
                  onChange={(val) => setField("content", val)}
                  language={form.language || undefined}
                />
              ) : (
                <MarkdownEditor
                  value={form.content}
                  onChange={(val) => setField("content", val)}
                />
              )}
            </div>
          )}

          {/* Language */}
          {showLanguage && (
            <div>
              {fieldLabel("Language")}
              <Input
                value={form.language}
                onChange={(e) => setField("language", e.target.value)}
                placeholder="e.g. typescript"
                className="text-sm"
              />
            </div>
          )}

          {/* URL */}
          {showUrl && (
            <div>
              {fieldLabel("URL")}
              <Input
                value={form.url}
                onChange={(e) => setField("url", e.target.value)}
                placeholder="https://..."
                type="url"
                className="text-sm"
                aria-invalid={!!fieldErrors.url}
              />
              <FieldError errors={fieldErrors.url} />
            </div>
          )}

          {/* Tags */}
          <div>
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
                  disabled={isLoadingAI || !form.title.trim()}
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
              value={form.tags}
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
          </div>

          {/* Collections */}
          <div>
            <div className="mb-1.5 flex items-center gap-1.5">
              <FolderOpen className="h-3 w-3 text-muted-foreground" />
              {fieldLabel("Collections")}
            </div>
            <CollectionMultiSelect
              collections={userCollections}
              selectedIds={collectionIds}
              onChange={setCollectionIds}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!canSubmit}>
            {saving ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
