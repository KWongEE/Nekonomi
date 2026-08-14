// Pure DB pipeline for grocery -> pantry migration. Deliberately has no
// "use server"/auth()/revalidatePath — those are Next.js request-scoped
// concerns that don't exist when this is called directly from a test, so
// they live in the thin wrapper in actions.ts instead. This file is what
// the integration tests import.
import { db } from "@/db";
import { pantry, groceryList } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { getHouseholdMemberIds } from "@/lib/household";

export async function migrateGroceryItemToPantry(groceryItemId: string, userId: string) {
  const memberIds = await getHouseholdMemberIds(userId);

  const [item] = await db
    .select()
    .from(groceryList)
    .where(and(eq(groceryList.id, groceryItemId), inArray(groceryList.userId, memberIds)))
    .limit(1);

  if (!item) throw new Error("Grocery item not found");

  // Idempotent: a double-click or retry on an already-migrated item is a no-op.
  if (item.status === "purchased") return;

  const [existingPantryRow] = await db
    .select()
    .from(pantry)
    .where(and(inArray(pantry.userId, memberIds), eq(pantry.ingredientId, item.ingredientId)))
    .limit(1);

  // Boolean-presence philosophy (same as the rest of the app): if it's
  // already in the pantry, don't create a second row for it.
  if (!existingPantryRow) {
    await db.insert(pantry).values({
      userId,
      ingredientId: item.ingredientId,
      quantity: item.quantity,
      unit: item.unit,
    });
  }

  await db
    .update(groceryList)
    .set({ status: "purchased", updatedOn: new Date() })
    .where(eq(groceryList.id, groceryItemId));
}
