"use client";

import { useState, useTransition } from "react";
import { regenerateInviteCode } from "./actions";

export function RegenerateCodeButton() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        onClick={() =>
          startTransition(async () => {
            setError(null);
            try {
              await regenerateInviteCode();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Something went wrong");
            }
          })
        }
        disabled={isPending}
        className="text-xs text-slate-500 underline decoration-dotted transition hover:text-amber-400 disabled:opacity-40"
      >
        {isPending ? "Regenerating…" : "Regenerate code"}
      </button>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
