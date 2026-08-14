"use client";

import { useTransition } from "react";
import { removeTagFromRecipe } from "./actions";

export function RemoveTagButton({
  recipeId,
  tagId,
}: {
  recipeId: string;
  tagId: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => removeTagFromRecipe(recipeId, tagId))}
      disabled={isPending}
      aria-label="Remove tag"
      className="ml-1 text-slate-500 transition hover:text-red-400 disabled:opacity-40"
    >
      {isPending ? "…" : "✕"}
    </button>
  );
}
