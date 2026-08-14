"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db";
import { groceryList, ingredients } from "@/db/schema";
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

// ─── Check off a grocery item: migrates it into the pantry ────────
export async function checkOffGroceryItem(groceryItemId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  await migrateGroceryItemToPantry(groceryItemId, session.user.id);

  revalidatePath("/grocery");
  revalidatePath("/pantry");
}
