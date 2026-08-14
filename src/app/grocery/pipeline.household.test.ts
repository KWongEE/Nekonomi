import { describe, it, expect, beforeEach, afterEach, afterAll } from "vitest";
import crypto from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { users, households, ingredients, pantry, groceryList } from "@/db/schema";
import { migrateGroceryItemToPantry } from "./pipeline";

// Integration tests for the household-scoping added on top of the pipeline
// tested in pipeline.test.ts — separate file/user pool so its hooks don't
// interfere with the single-user scenarios there.
const EMAIL_A = "vitest-household-a@nekonomi.local";
const EMAIL_B = "vitest-household-b@nekonomi.local";
const EMAIL_OUTSIDER = "vitest-household-outsider@nekonomi.local";
const TEST_INGREDIENT_NAMES = ["vitest-household-butter", "vitest-household-cheese"];

async function cleanupByEmail(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) return;
  await db.delete(pantry).where(eq(pantry.userId, user.id));
  await db.delete(groceryList).where(eq(groceryList.userId, user.id));
  await db.delete(users).where(eq(users.id, user.id));
}

async function seedIngredient(name: string) {
  await db.insert(ingredients).values({ name }).onConflictDoNothing({ target: ingredients.name });
  const [ing] = await db.select().from(ingredients).where(eq(ingredients.name, name)).limit(1);
  return ing;
}

let userA: typeof users.$inferSelect;
let userB: typeof users.$inferSelect;
let householdId: string;

beforeEach(async () => {
  await cleanupByEmail(EMAIL_A);
  await cleanupByEmail(EMAIL_B);
  await cleanupByEmail(EMAIL_OUTSIDER);

  const [a] = await db
    .insert(users)
    .values({ id: crypto.randomUUID(), name: "Vitest A", email: EMAIL_A })
    .returning();
  const [b] = await db
    .insert(users)
    .values({ id: crypto.randomUUID(), name: "Vitest B", email: EMAIL_B })
    .returning();
  userA = a;
  userB = b;

  const [household] = await db
    .insert(households)
    .values({
      name: "Vitest Household",
      createdBy: a.id,
      inviteCode: crypto.randomBytes(4).toString("hex").toUpperCase(),
    })
    .returning();
  householdId = household.id;

  await db.update(users).set({ householdId }).where(inArray(users.id, [a.id, b.id]));
});

afterEach(async () => {
  await db.delete(households).where(eq(households.id, householdId));
  await cleanupByEmail(EMAIL_A);
  await cleanupByEmail(EMAIL_B);
  await cleanupByEmail(EMAIL_OUTSIDER);
});

describe("migrateGroceryItemToPantry — household sharing", () => {
  it("lets one household member check off an item another member added", async () => {
    const butter = await seedIngredient("vitest-household-butter");
    const [item] = await db
      .insert(groceryList)
      .values({ userId: userA.id, ingredientId: butter.id })
      .returning();

    await migrateGroceryItemToPantry(item.id, userB.id); // B checks off A's item

    const [pantryRow] = await db.select().from(pantry).where(eq(pantry.ingredientId, butter.id));
    expect(pantryRow).toBeDefined();

    const [updated] = await db.select().from(groceryList).where(eq(groceryList.id, item.id));
    expect(updated.status).toBe("purchased");
  });

  it("does not duplicate a pantry row if a different household member already owns the ingredient", async () => {
    const cheese = await seedIngredient("vitest-household-cheese");
    await db.insert(pantry).values({ userId: userB.id, ingredientId: cheese.id }); // B already has it
    const [item] = await db
      .insert(groceryList)
      .values({ userId: userA.id, ingredientId: cheese.id })
      .returning();

    await migrateGroceryItemToPantry(item.id, userA.id); // A checks off their own item

    const pantryRows = await db.select().from(pantry).where(eq(pantry.ingredientId, cheese.id));
    expect(pantryRows.length).toBe(1); // still just B's original row
  });

  it("throws if the item belongs to someone outside the caller's household", async () => {
    const [outsider] = await db
      .insert(users)
      .values({ id: crypto.randomUUID(), name: "Vitest Outsider", email: EMAIL_OUTSIDER })
      .returning();
    const butter = await seedIngredient("vitest-household-butter");
    const [item] = await db
      .insert(groceryList)
      .values({ userId: userA.id, ingredientId: butter.id })
      .returning();

    await expect(migrateGroceryItemToPantry(item.id, outsider.id)).rejects.toThrow(
      "Grocery item not found"
    );
  });

  afterAll(async () => {
    await db.delete(ingredients).where(inArray(ingredients.name, TEST_INGREDIENT_NAMES));
  });
});
