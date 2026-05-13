"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ItemForCard } from "@/lib/db/items";
import ItemCard from "@/components/dashboard/ItemCard";
import ItemDrawer from "@/components/dashboard/ItemDrawer";

interface ItemsWithDrawerProps {
  items: ItemForCard[];
  className?: string;
}

export default function ItemsWithDrawer({ items, className }: ItemsWithDrawerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <>
      <div className={cn(className)}>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className="block w-full text-left"
            onClick={() => setSelectedId(item.id)}
          >
            <ItemCard item={item} />
          </button>
        ))}
      </div>
      <ItemDrawer itemId={selectedId} onCloseAction={() => setSelectedId(null)} />
    </>
  );
}
