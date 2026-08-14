"use client";

import { useState, useTransition } from "react";
import { joinHousehold } from "./actions";

export function JoinHouseholdForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await joinHousehold(code);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        required
        placeholder="Invite code (e.g. 7F3K2Q)"
        className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm uppercase tracking-widest text-slate-100 placeholder-slate-500 outline-none ring-amber-400 transition focus:border-amber-400 focus:ring-1"
      />
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-amber-400 hover:text-amber-400 active:scale-95 disabled:opacity-50"
      >
        {isPending ? "Joining…" : "Join Household"}
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </form>
  );
}
