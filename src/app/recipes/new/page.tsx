import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { RecipeForm } from "../RecipeForm";
import { HomeLink } from "@/components/HomeLink";

export const metadata = {
  title: "New Recipe — Nekonomi",
  description: "Add a new recipe and its required ingredients.",
};

export default async function NewRecipePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-2xl space-y-8">
        <HomeLink />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-50">
            🍳 New Recipe
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Add a recipe and the ingredients it requires.
          </p>
        </div>

        <RecipeForm />
      </div>
    </div>
  );
}
