"use client";

import { useTransition } from "react";
import { removeStoreFromIngredient } from "./actions";

export function RemoveStoreButton({
  ingredientId,
  storeId,
}: {
  ingredientId: string;
  storeId: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => removeStoreFromIngredient(ingredientId, storeId))}
      disabled={isPending}
      aria-label="Remove store tag"
      className="ml-1 text-slate-500 transition hover:text-red-400 disabled:opacity-40"
    >
      {isPending ? "…" : "✕"}
    </button>
  );
}
