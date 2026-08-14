"use client";

import { useRef, useState, useTransition } from "react";
import { addTagToRecipe } from "./actions";

export function AddTagForm({ recipeId }: { recipeId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    const name = formData.get("name") as string;
    startTransition(async () => {
      try {
        await addTagToRecipe(recipeId, name);
        formRef.current?.reset();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex items-center gap-2">
      <input
        name="name"
        type="text"
        required
        placeholder="Add a tag (e.g. vegan)"
        className="w-40 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 outline-none ring-amber-400 transition focus:border-amber-400 focus:ring-1"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-amber-400 transition hover:bg-slate-700 disabled:opacity-50"
      >
        {isPending ? "…" : "+ Add"}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </form>
  );
}
