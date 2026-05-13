"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Code, Link as LinkIcon, Sparkles, StickyNote, Tag, Terminal } from "lucide-react";
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
import { createItem } from "@/actions/items";

const ITEM_TYPES = [
  { slug: "snippet", label: "Snippet", icon: Code },
  { slug: "prompt", label: "Prompt", icon: Sparkles },
  { slug: "command", label: "Command", icon: Terminal },
  { slug: "note", label: "Note", icon: StickyNote },
  { slug: "link", label: "Link", icon: LinkIcon },
] as const;

export type TypeSlug = (typeof ITEM_TYPES)[number]["slug"];

const CONTENT_TYPES = new Set<TypeSlug>(["snippet", "prompt", "command", "note"]);
const LANGUAGE_TYPES = new Set<TypeSlug>(["snippet", "command"]);

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

interface CreateItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: TypeSlug;
}

export default function CreateItemDialog({ open, onOpenChange, defaultType }: CreateItemDialogProps) {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<TypeSlug>(defaultType ?? "snippet");
  const [form, setForm] = useState<CreateForm>(DEFAULT_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setSelectedType(defaultType ?? "snippet");
      setForm(DEFAULT_FORM);
      setFieldErrors({});
    }
  }, [open, defaultType]);

  function setField(key: keyof CreateForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleCreate() {
    setSaving(true);
    setFieldErrors({});

    const result = await createItem({ typeSlug: selectedType, ...form });

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

  const showContent = CONTENT_TYPES.has(selectedType);
  const showLanguage = LANGUAGE_TYPES.has(selectedType);
  const showUrl = selectedType === "link";

  const canSubmit =
    form.title.trim().length > 0 && (!showUrl || form.url.trim().length > 0) && !saving;

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
              onValueChange={(val) => setSelectedType(val as TypeSlug)}
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
            <div className="mb-1.5 flex items-center gap-1.5">
              <Tag className="h-3 w-3 text-muted-foreground" />
              {fieldLabel("Tags")}
            </div>
            <Input
              value={form.tags}
              onChange={(e) => setField("tags", e.target.value)}
              placeholder="react, hooks, typescript"
              className="text-sm"
            />
            <p className="mt-1 text-xs text-muted-foreground">Comma-separated</p>
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
