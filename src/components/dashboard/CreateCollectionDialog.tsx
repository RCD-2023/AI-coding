"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";
import { createCollection } from "@/actions/collections";
import { fieldLabel, FieldError } from "@/components/dashboard/form-helpers";

type Form = { name: string; description: string };
const DEFAULT_FORM: Form = { name: "", description: "" };

interface CreateCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateCollectionDialog({
  open,
  onOpenChange,
}: CreateCollectionDialogProps) {
  const router = useRouter();
  const [form, setForm] = useState<Form>(DEFAULT_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setForm(DEFAULT_FORM);
      setFieldErrors({});
    }
  }, [open]);

  function setField(key: keyof Form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleCreate() {
    setSaving(true);
    setFieldErrors({});

    const result = await createCollection(form);

    setSaving(false);

    if (result.success) {
      onOpenChange(false);
      router.refresh();
      toast.success("Collection created");
    } else {
      if (result.fieldErrors) setFieldErrors(result.fieldErrors);
      toast.error(result.error);
    }
  }

  const canSubmit = form.name.trim().length > 0 && !saving;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Collection</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          <div>
            {fieldLabel("Name")}
            <Input
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="Collection name"
              className="text-sm"
              aria-invalid={!!fieldErrors.name}
            />
            <FieldError errors={fieldErrors.name} />
          </div>

          <div>
            {fieldLabel("Description")}
            <Textarea
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Optional description"
              className="min-h-[80px] resize-y text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
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
