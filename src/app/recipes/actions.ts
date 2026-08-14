"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db";
import { ingredients, recipes, recipeIngredients } from "@/db/schema";
import type { IngredientCategory } from "@/db/schema";
import { eq } from "drizzle-orm";

export type RecipeIngredientInput = {
  name: string;
  quantity: string | null;
  unit: string | null;
  optional: boolean;
};

export type CreateRecipeInput = {
  name: string;
  description: string | null;
  instructions: string | null;
  cookTimeMinutes: number | null;
  ingredients: RecipeIngredientInput[];
};

// ─── Create a recipe with its required ingredients ────────
export async function createRecipe(input: CreateRecipeInput) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const name = input.name.trim();
  if (!name) throw new Error("Recipe name is required");

  const rows = input.ingredients
    .map((i) => ({ ...i, name: i.name.trim().toLowerCase() }))
    .filter((i) => i.name.length > 0);

  if (rows.length === 0) throw new Error("Add at least one ingredient");

  const [recipe] = await db
    .insert(recipes)
    .values({
      userId: session.user.id,
      name,
      description: input.description || null,
      instructions: input.instructions || null,
      cookTimeMinutes: input.cookTimeMinutes,
    })
    .returning();

  for (const row of rows) {
    // Get-or-create the ingredient by name. Unlike pantry's upsert, we don't
    // overwrite category on conflict — an ingredient may already be properly
    // categorized from the pantry, and a recipe save shouldn't reset it to "other".
    await db
      .insert(ingredients)
      .values({ name: row.name, category: "other" as IngredientCategory })
      .onConflictDoNothing({ target: ingredients.name });

    const [ingredient] = await db
      .select()
      .from(ingredients)
      .where(eq(ingredients.name, row.name))
      .limit(1);

    await db.insert(recipeIngredients).values({
      recipeId: recipe.id,
      ingredientId: ingredient.id,
      quantity: row.quantity || null,
      unit: row.unit || null,
      optional: row.optional ? 1 : 0,
    });
  }

  revalidatePath("/recipes");
  return recipe;
}

// ─── Get all recipes for the current user ──────────────────
export async function getRecipes() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return db
    .select()
    .from(recipes)
    .where(eq(recipes.userId, session.user.id))
    .orderBy(recipes.name);
}

// ─── Get a single recipe with its required ingredients ─────
export async function getRecipeWithIngredients(recipeId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [recipe] = await db
    .select()
    .from(recipes)
    .where(eq(recipes.id, recipeId))
    .limit(1);

  if (!recipe || recipe.userId !== session.user.id) return null;

  const items = await db
    .select({
      id: recipeIngredients.id,
      name: ingredients.name,
      category: ingredients.category,
      quantity: recipeIngredients.quantity,
      unit: recipeIngredients.unit,
      optional: recipeIngredients.optional,
    })
    .from(recipeIngredients)
    .innerJoin(ingredients, eq(recipeIngredients.ingredientId, ingredients.id))
    .where(eq(recipeIngredients.recipeId, recipeId))
    .orderBy(ingredients.name);

  return { recipe, ingredients: items };
}
