"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { planMeal } from "./actions";

export function PlanMealButton({ recipeId }: { recipeId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        await planMeal(recipeId);
        router.push("/grocery");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={isPending}
        className="w-full rounded-xl bg-amber-400 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-amber-300 active:scale-95 disabled:opacity-50"
      >
        {isPending ? "Planning…" : "🛒 Plan this Meal"}
      </button>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
