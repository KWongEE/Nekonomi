"use client";

import { useState, useTransition } from "react";
import { leaveHousehold } from "./actions";

export function LeaveHouseholdButton() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        onClick={() =>
          startTransition(async () => {
            setError(null);
            try {
              await leaveHousehold();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Something went wrong");
            }
          })
        }
        disabled={isPending}
        className="rounded-xl border border-slate-700 px-6 py-3 text-sm font-semibold text-red-400 transition hover:border-red-400/40 hover:bg-red-400/5 active:scale-95 disabled:opacity-50"
      >
        {isPending ? "Leaving…" : "Leave Household"}
      </button>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
