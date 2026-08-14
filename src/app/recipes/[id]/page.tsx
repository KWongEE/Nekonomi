import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getRecipeWithIngredients } from "../actions";
import { AddTagForm } from "../AddTagForm";
import { RemoveTagButton } from "../RemoveTagButton";
import { PlanMealButton } from "../PlanMealButton";
import { HomeLink } from "@/components/HomeLink";

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const result = await getRecipeWithIngredients(id);
  if (!result) notFound();

  const { recipe, ingredients, tags } = result;

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-2xl space-y-8">

        {/* Header */}
        <div>
          <div className="flex items-center gap-2">
            <HomeLink />
            <span className="text-slate-700">/</span>
            <Link
              href="/recipes"
              className="text-xs text-slate-500 transition hover:text-slate-300"
            >
              All recipes
            </Link>
          </div>
          <div className="mt-2 flex items-start justify-between">
            <h1 className="text-2xl font-bold tracking-tight text-slate-50">
              {recipe.name}
            </h1>
            {recipe.cookTimeMinutes && (
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                ⏱ {recipe.cookTimeMinutes} min
              </span>
            )}
          </div>
          {recipe.description && (
            <p className="mt-2 text-sm text-slate-400">{recipe.description}</p>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-2">
          {tags.map((tag) => (
            <span
              key={tag.id}
              className="flex items-center rounded-full bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-400"
            >
              {tag.name}
              <RemoveTagButton recipeId={recipe.id} tagId={tag.id} />
            </span>
          ))}
          <AddTagForm recipeId={recipe.id} />
        </div>

        {/* Ingredients */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
          <div className="border-b border-slate-800 px-5 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
              Ingredients ({ingredients.length})
            </h2>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {ingredients.map((item, i) => (
                <tr
                  key={item.id}
                  className={`${i !== 0 ? "border-t border-slate-800/60" : ""}`}
                >
                  <td className="px-5 py-3 font-medium capitalize text-slate-100">
                    {item.name}
                    {item.optional === 1 && (
                      <span className="ml-2 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-normal uppercase tracking-wide text-slate-500">
                        Optional
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right text-slate-400">
                    {item.quantity ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-right text-slate-400">
                    {item.unit ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Instructions */}
        {recipe.instructions && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-slate-400">
              Instructions
            </h2>
            <p className="whitespace-pre-wrap text-sm text-slate-300">
              {recipe.instructions}
            </p>
          </div>
        )}

        <PlanMealButton recipeId={recipe.id} />
      </div>
    </div>
  );
}
