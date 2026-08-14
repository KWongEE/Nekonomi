"use client";

import { useState, useTransition } from "react";
import { removeMember } from "./actions";

export function RemoveMemberButton({ memberId }: { memberId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        onClick={() =>
          startTransition(async () => {
            setError(null);
            try {
              await removeMember(memberId);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Something went wrong");
            }
          })
        }
        disabled={isPending}
        aria-label="Remove member"
        className="rounded-lg px-2 py-1 text-xs text-slate-500 transition hover:bg-slate-700 hover:text-red-400 disabled:opacity-40"
      >
        {isPending ? "…" : "Remove"}
      </button>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
