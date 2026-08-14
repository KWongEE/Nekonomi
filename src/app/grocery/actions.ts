"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db";
import { groceryList, ingredients, stores, ingredientStores } from "@/db/schema";
import type { IngredientCategory } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { migrateGroceryItemToPantry } from "./pipeline";

// ─── Get the current user's pending grocery list items, optionally ──
// filtered by store — matches ANY selected store (OR), since picking
// multiple stores means "everything I need from any of these places
// I'm visiting," not "items that belong to every store at once."
export async function getGroceryList(storeIds?: string[]) {
  const session = await auth();
  if (!session?.user?.id) return [];
  const userId = session.user.id;

  let matchingIngredientIds: string[] | null = null;
  if (storeIds && storeIds.length > 0) {
    const matches = await db
      .select({ ingredientId: ingredientStores.ingredientId })
      .from(ingredientStores)
      .where(inArray(ingredientStores.storeId, storeIds));
    matchingIngredientIds = [...new Set(matches.map((m) => m.ingredientId))];
    if (matchingIngredientIds.length === 0) return [];
  }

  const conditions = [eq(groceryList.userId, userId), eq(groceryList.status, "pending")];
  if (matchingIngredientIds) conditions.push(inArray(groceryList.ingredientId, matchingIngredientIds));

  const items = await db
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
    .where(and(...conditions))
    .orderBy(ingredients.name);

  if (items.length === 0) return [];

  const storeRows = await db
    .select({ ingredientId: ingredientStores.ingredientId, id: stores.id, name: stores.name })
    .from(ingredientStores)
    .innerJoin(stores, eq(ingredientStores.storeId, stores.id))
    .where(inArray(ingredientStores.ingredientId, items.map((i) => i.ingredientId)));

  const storesByIngredient = new Map<string, { id: string; name: string }[]>();
  for (const row of storeRows) {
    const list = storesByIngredient.get(row.ingredientId) ?? [];
    list.push({ id: row.id, name: row.name });
    storesByIngredient.set(row.ingredientId, list);
  }

  return items.map((i) => ({ ...i, stores: storesByIngredient.get(i.ingredientId) ?? [] }));
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

// ─── All stores in the system (for filter chips) ───────────────────
export async function getAllStores() {
  return db.select().from(stores).orderBy(stores.name);
}

// ─── Tag an ingredient with a store (creates the store if new) ─────
export async function addStoreToIngredient(ingredientId: string, rawName: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const name = rawName.trim().toLowerCase();
  if (!name) throw new Error("Store name is required");

  await db.insert(stores).values({ name }).onConflictDoNothing({ target: stores.name });
  const [store] = await db.select().from(stores).where(eq(stores.name, name)).limit(1);

  await db
    .insert(ingredientStores)
    .values({ ingredientId, storeId: store.id })
    .onConflictDoNothing({ target: [ingredientStores.ingredientId, ingredientStores.storeId] });

  revalidatePath("/grocery");
}

// ─── Remove a store tag from an ingredient ─────────────────────────
export async function removeStoreFromIngredient(ingredientId: string, storeId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  await db
    .delete(ingredientStores)
    .where(and(eq(ingredientStores.ingredientId, ingredientId), eq(ingredientStores.storeId, storeId)));

  revalidatePath("/grocery");
}
