import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getRecipes } from "./actions";

export const metadata = {
  title: "Recipes — Nekonomi",
  description: "Browse and manage your recipes.",
};

export default async function RecipesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const recipes = await getRecipes();

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-2xl space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-50">
              🍳 My Recipes
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              {recipes.length === 0
                ? "No recipes yet — create your first one below."
                : `${recipes.length} recipe${recipes.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <Link
            href="/recipes/new"
            className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-amber-300 active:scale-95"
          >
            + New Recipe
          </Link>
        </div>

        {/* Recipe list */}
        {recipes.length > 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
            {recipes.map((recipe, i) => (
              <Link
                key={recipe.id}
                href={`/recipes/${recipe.id}`}
                className={`flex items-center justify-between px-5 py-4 transition hover:bg-slate-800/50 ${
                  i !== 0 ? "border-t border-slate-800/60" : ""
                }`}
              >
                <div>
                  <p className="font-medium text-slate-100">{recipe.name}</p>
                  {recipe.description && (
                    <p className="mt-0.5 text-xs text-slate-500">
                      {recipe.description}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-slate-500">
                  {recipe.cookTimeMinutes ? `${recipe.cookTimeMinutes} min` : "—"}
                </span>
              </Link>
            ))}
          </div>
        )}

        {recipes.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-800 p-10 text-center text-slate-500">
            You haven't added any recipes yet.
          </div>
        )}
      </div>
    </div>
  );
}
