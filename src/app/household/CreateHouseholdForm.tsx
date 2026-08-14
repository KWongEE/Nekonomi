"use client";

import { useState, useTransition } from "react";
import { createHousehold } from "./actions";

export function CreateHouseholdForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await createHousehold(name);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        placeholder="Household name (e.g. The Wongs)"
        className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none ring-amber-400 transition focus:border-amber-400 focus:ring-1"
      />
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-amber-400 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-amber-300 active:scale-95 disabled:opacity-50"
      >
        {isPending ? "Creating…" : "Create Household"}
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </form>
  );
}
