"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createRecipe, type RecipeIngredientInput } from "./actions";

const EMPTY_ROW: RecipeIngredientInput = {
  name: "",
  quantity: "",
  unit: "",
  optional: false,
};

export function RecipeForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [cookTimeMinutes, setCookTimeMinutes] = useState("");
  const [rows, setRows] = useState<RecipeIngredientInput[]>([{ ...EMPTY_ROW }]);

  function updateRow(index: number, patch: Partial<RecipeIngredientInput>) {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row))
    );
  }

  function addRow() {
    setRows((prev) => [...prev, { ...EMPTY_ROW }]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const recipe = await createRecipe({
          name,
          description: description || null,
          instructions: instructions || null,
          cookTimeMinutes: cookTimeMinutes ? Number(cookTimeMinutes) : null,
          ingredients: rows,
        });
        router.push(`/recipes/${recipe.id}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  const inputClass =
    "w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none ring-amber-400 transition focus:border-amber-400 focus:ring-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Recipe metadata */}
      <div className="space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Recipe name (e.g. Pancakes)"
          className={inputClass}
        />
        <div className="flex gap-3">
          <input
            value={cookTimeMinutes}
            onChange={(e) => setCookTimeMinutes(e.target.value)}
            type="number"
            min="0"
            placeholder="Cook time (min)"
            className={`${inputClass} w-40`}
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description (optional)"
            className={inputClass}
          />
        </div>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Instructions (optional)"
          rows={4}
          className={inputClass}
        />
      </div>

      {/* Ingredients */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-400">
          Ingredients
        </h2>
        <div className="space-y-2">
          {rows.map((row, i) => (
            <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                value={row.name}
                onChange={(e) => updateRow(i, { name: e.target.value })}
                placeholder="Ingredient (e.g. eggs)"
                className={`${inputClass} flex-1`}
              />
              <input
                value={row.quantity ?? ""}
                onChange={(e) => updateRow(i, { quantity: e.target.value })}
                type="number"
                min="0"
                step="any"
                placeholder="Qty"
                className={`${inputClass} sm:w-20`}
              />
              <input
                value={row.unit ?? ""}
                onChange={(e) => updateRow(i, { unit: e.target.value })}
                placeholder="Unit"
                className={`${inputClass} sm:w-28`}
              />
              <label className="flex items-center gap-2 whitespace-nowrap text-xs text-slate-400 sm:w-24">
                <input
                  type="checkbox"
                  checked={row.optional}
                  onChange={(e) => updateRow(i, { optional: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-800 accent-amber-400"
                />
                Optional
              </label>
              <button
                type="button"
                onClick={() => removeRow(i)}
                disabled={rows.length === 1}
                aria-label="Remove ingredient"
                className="rounded-lg px-2 py-1 text-xs text-slate-500 transition hover:bg-slate-700 hover:text-red-400 disabled:opacity-30"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addRow}
          className="mt-4 rounded-lg border border-dashed border-slate-700 px-4 py-2 text-sm text-slate-400 transition hover:border-amber-400 hover:text-amber-400"
        >
          + Add Ingredient
        </button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-amber-400 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-amber-300 active:scale-95 disabled:opacity-50"
      >
        {isPending ? "Creating…" : "Create Recipe"}
      </button>
    </form>
  );
}
