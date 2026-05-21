"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import CreateItemDialog from "@/components/dashboard/CreateItemDialog";
import type { TypeSlug } from "@/components/dashboard/CreateItemDialog";

interface AddItemButtonProps {
  typeSlug: TypeSlug;
  label: string;
  isPro?: boolean;
}

export default function AddItemButton({ typeSlug, label, isPro = false }: AddItemButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="mr-1 h-4 w-4" />
        New {label}
      </Button>
      <CreateItemDialog open={open} onOpenChange={setOpen} defaultType={typeSlug} isPro={isPro} />
    </>
  );
}
