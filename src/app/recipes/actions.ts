"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db";
import { ingredients, recipes, recipeIngredients, tags, recipeTags } from "@/db/schema";
import type { IngredientCategory } from "@/db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";

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

// ─── Get all recipes for the current user, optionally filtered by ────
// tags — a recipe must carry ALL of tagIds to match (AND, not OR).
export async function getRecipes(tagIds?: string[]) {
  const session = await auth();
  if (!session?.user?.id) return [];
  const userId = session.user.id;

  let recipeRows;
  if (!tagIds || tagIds.length === 0) {
    recipeRows = await db
      .select()
      .from(recipes)
      .where(eq(recipes.userId, userId))
      .orderBy(recipes.name);
  } else {
    const matches = await db
      .select({ recipeId: recipeTags.recipeId })
      .from(recipeTags)
      .where(inArray(recipeTags.tagId, tagIds))
      .groupBy(recipeTags.recipeId)
      .having(sql`count(distinct ${recipeTags.tagId}) = ${tagIds.length}`);

    const matchingIds = matches.map((m) => m.recipeId);
    if (matchingIds.length === 0) return [];

    recipeRows = await db
      .select()
      .from(recipes)
      .where(and(eq(recipes.userId, userId), inArray(recipes.id, matchingIds)))
      .orderBy(recipes.name);
  }

  if (recipeRows.length === 0) return [];

  const tagRows = await db
    .select({ recipeId: recipeTags.recipeId, id: tags.id, name: tags.name })
    .from(recipeTags)
    .innerJoin(tags, eq(recipeTags.tagId, tags.id))
    .where(inArray(recipeTags.recipeId, recipeRows.map((r) => r.id)));

  const tagsByRecipe = new Map<string, { id: string; name: string }[]>();
  for (const row of tagRows) {
    const list = tagsByRecipe.get(row.recipeId) ?? [];
    list.push({ id: row.id, name: row.name });
    tagsByRecipe.set(row.recipeId, list);
  }

  return recipeRows.map((r) => ({ ...r, tags: tagsByRecipe.get(r.id) ?? [] }));
}

// ─── Get a single recipe with its required ingredients and tags ───
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

  const recipeTagRows = await db
    .select({ id: tags.id, name: tags.name })
    .from(recipeTags)
    .innerJoin(tags, eq(recipeTags.tagId, tags.id))
    .where(eq(recipeTags.recipeId, recipeId))
    .orderBy(tags.name);

  return { recipe, ingredients: items, tags: recipeTagRows };
}

// ─── All tags in the system (for filter chips / tag picker) ───────
export async function getAllTags() {
  return db.select().from(tags).orderBy(tags.name);
}

async function assertOwnsRecipe(recipeId: string, userId: string) {
  const [recipe] = await db
    .select({ id: recipes.id })
    .from(recipes)
    .where(and(eq(recipes.id, recipeId), eq(recipes.userId, userId)))
    .limit(1);
  if (!recipe) throw new Error("Recipe not found");
}

// ─── Attach a tag to a recipe (creates the tag if new) ─────────────
export async function addTagToRecipe(recipeId: string, rawName: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  await assertOwnsRecipe(recipeId, session.user.id);

  const name = rawName.trim().toLowerCase();
  if (!name) throw new Error("Tag name is required");

  await db.insert(tags).values({ name }).onConflictDoNothing({ target: tags.name });
  const [tag] = await db.select().from(tags).where(eq(tags.name, name)).limit(1);

  await db
    .insert(recipeTags)
    .values({ recipeId, tagId: tag.id })
    .onConflictDoNothing({ target: [recipeTags.recipeId, recipeTags.tagId] });

  revalidatePath(`/recipes/${recipeId}`);
  revalidatePath("/recipes");
}

// ─── Remove a tag from a recipe (the tag itself is left intact) ───
export async function removeTagFromRecipe(recipeId: string, tagId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  await assertOwnsRecipe(recipeId, session.user.id);

  await db
    .delete(recipeTags)
    .where(and(eq(recipeTags.recipeId, recipeId), eq(recipeTags.tagId, tagId)));

  revalidatePath(`/recipes/${recipeId}`);
  revalidatePath("/recipes");
}
