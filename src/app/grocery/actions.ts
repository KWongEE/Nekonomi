"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db";
import { groceryList, ingredients } from "@/db/schema";
import type { IngredientCategory } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { migrateGroceryItemToPantry } from "./pipeline";

// ─── Get the current user's pending grocery list items ─────────────
export async function getGroceryList() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return db
    .select({
      id: groceryList.id,
      ingredientId: ingredients.id,
      name: ingredients.name,
      category: ingredients.category,
      quantity: groceryList.quantity,
      unit: groceryList.unit,
    })
    .from(groceryList)
    .innerJoin(ingredients, eq(groceryList.ingredientId, ingredients.id))
    .where(and(eq(groceryList.userId, session.user.id), eq(groceryList.status, "pending")))
    .orderBy(ingredients.name);
}

// ─── Manually add an ingredient to the grocery list ────────────────
export async function addGroceryItem(
  rawName: string,
  quantity: string | null,
  unit: string | null
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const userId = session.user.id;

  const name = rawName.trim().toLowerCase();
  if (!name) throw new Error("Ingredient name is required");

  await db
    .insert(ingredients)
    .values({ name, category: "other" as IngredientCategory })
    .onConflictDoNothing({ target: ingredients.name });
  const [ingredient] = await db.select().from(ingredients).where(eq(ingredients.name, name)).limit(1);

  const [existingPending] = await db
    .select({ id: groceryList.id })
    .from(groceryList)
    .where(
      and(
        eq(groceryList.userId, userId),
        eq(groceryList.ingredientId, ingredient.id),
        eq(groceryList.status, "pending")
      )
    )
    .limit(1);

  if (!existingPending) {
    await db.insert(groceryList).values({ userId, ingredientId: ingredient.id, quantity, unit });
  }

  revalidatePath("/grocery");
}

// ─── Check off a grocery item: migrates it into the pantry ────────
export async function checkOffGroceryItem(groceryItemId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  await migrateGroceryItemToPantry(groceryItemId, session.user.id);

  revalidatePath("/grocery");
  revalidatePath("/pantry");
}
