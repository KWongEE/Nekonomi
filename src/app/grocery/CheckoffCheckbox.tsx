"use client";

import { useTransition } from "react";
import { checkOffGroceryItem } from "./actions";

export function CheckoffCheckbox({ itemId }: { itemId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <input
      type="checkbox"
      disabled={isPending}
      onChange={() => startTransition(() => checkOffGroceryItem(itemId))}
      aria-label="Mark as purchased"
      className="h-4 w-4 rounded border-slate-700 bg-slate-800 accent-amber-400 disabled:opacity-40"
    />
  );
}
