"use client";

import { useRef, useState, useTransition } from "react";
import { addStoreToIngredient } from "./actions";

export function AddStoreForm({ ingredientId }: { ingredientId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    const name = formData.get("name") as string;
    startTransition(async () => {
      try {
        await addStoreToIngredient(ingredientId, name);
        formRef.current?.reset();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex items-center gap-1.5">
      <input
        name="name"
        type="text"
        required
        placeholder="+ store"
        className="w-24 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-100 placeholder-slate-500 outline-none ring-amber-400 transition focus:border-amber-400 focus:ring-1"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-semibold text-amber-400 transition hover:bg-slate-700 disabled:opacity-50"
      >
        {isPending ? "…" : "Add"}
      </button>
      {error && <p className="text-[10px] text-red-400">{error}</p>}
    </form>
  );
}
