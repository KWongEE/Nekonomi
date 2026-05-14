"use client";

import { useRef, useState, useTransition } from "react";
import { addPantryItem } from "./actions";

export function AddItemForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await addPantryItem(formData);
        formRef.current?.reset();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Ingredient name */}
        <input
          id="ingredient-name"
          name="name"
          type="text"
          required
          placeholder="Ingredient (e.g. eggs)"
          className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none ring-amber-400 transition focus:border-amber-400 focus:ring-1"
        />
        {/* Quantity — optional */}
        <input
          id="ingredient-quantity"
          name="quantity"
          type="number"
          min="0"
          step="any"
          placeholder="Qty"
          className="w-24 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none ring-amber-400 transition focus:border-amber-400 focus:ring-1"
        />
        {/* Unit — optional */}
        <input
          id="ingredient-unit"
          name="unit"
          type="text"
          placeholder="Unit (e.g. cups)"
          className="w-32 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none ring-amber-400 transition focus:border-amber-400 focus:ring-1"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-amber-400 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-amber-300 active:scale-95 disabled:opacity-50"
        >
          {isPending ? "Adding…" : "+ Add"}
        </button>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </form>
  );
}
