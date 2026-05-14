"use client";

import { useTransition } from "react";
import { removePantryItem } from "./actions";

export function RemoveButton({ pantryId }: { pantryId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => removePantryItem(pantryId))}
      disabled={isPending}
      aria-label="Remove item from pantry"
      className="rounded-lg px-2 py-1 text-xs text-slate-500 transition hover:bg-slate-700 hover:text-red-400 disabled:opacity-40"
    >
      {isPending ? "…" : "✕"}
    </button>
  );
}
