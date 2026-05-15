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
import { updateCollection } from "@/actions/collections";
import { fieldLabel, FieldError } from "@/components/dashboard/form-helpers";

type Form = { name: string; description: string };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection: { id: string; name: string; description: string | null };
}

export default function EditCollectionDialog({ open, onOpenChange, collection }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<Form>({ name: collection.name, description: collection.description ?? "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ name: collection.name, description: collection.description ?? "" });
      setFieldErrors({});
    }
  }, [open, collection.name, collection.description]);

  function setField(key: keyof Form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setFieldErrors({});

    const result = await updateCollection(collection.id, form);

    setSaving(false);

    if (result.success) {
      onOpenChange(false);
      router.refresh();
      toast.success("Collection updated");
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
          <DialogTitle>Edit Collection</DialogTitle>
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSubmit}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
