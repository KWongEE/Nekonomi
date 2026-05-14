"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db";
import { ingredients, pantry } from "@/db/schema";
import type { IngredientCategory } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// ─── Add a pantry item ────────────────────────────────────
export async function addPantryItem(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const name = (formData.get("name") as string)?.trim().toLowerCase();
  const quantity = formData.get("quantity") as string | null;
  const unit = formData.get("unit") as string | null;
  const category = (formData.get("category") as IngredientCategory) ?? "other";

  if (!name) throw new Error("Ingredient name is required");

  // Upsert the ingredient (insert if name doesn't exist yet)
  const [ingredient] = await db
    .insert(ingredients)
    .values({ name, category })
    .onConflictDoUpdate({ target: ingredients.name, set: { category } })
    .returning();

  // Check if this user already has this ingredient in their pantry
  const existing = await db
    .select()
    .from(pantry)
    .where(
      and(
        eq(pantry.userId, session.user.id),
        eq(pantry.ingredientId, ingredient.id)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Already in pantry — just refresh the page
    revalidatePath("/pantry");
    return;
  }

  await db.insert(pantry).values({
    userId: session.user.id,
    ingredientId: ingredient.id,
    quantity: quantity || null,
    unit: unit || null,
  });

  revalidatePath("/pantry");
}

// ─── Get pantry items for the current user ────────────────
export async function getPantryItems() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const items = await db
    .select({
      pantryId: pantry.id,
      ingredientId: ingredients.id,
      name: ingredients.name,
      category: ingredients.category,
      quantity: pantry.quantity,
      unit: pantry.unit,
      updatedOn: pantry.updatedOn,
    })
    .from(pantry)
    .innerJoin(ingredients, eq(pantry.ingredientId, ingredients.id))
    .where(eq(pantry.userId, session.user.id))
    .orderBy(ingredients.name);

  return items;
}

// ─── Remove a pantry item ─────────────────────────────────
export async function removePantryItem(pantryId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  await db
    .delete(pantry)
    .where(and(eq(pantry.id, pantryId), eq(pantry.userId, session.user.id)));

  revalidatePath("/pantry");
}
