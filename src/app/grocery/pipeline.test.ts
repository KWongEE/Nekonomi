import { describe, it, expect, beforeEach, afterEach, afterAll } from "vitest";
import crypto from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { users, ingredients, pantry, groceryList } from "@/db/schema";
import { migrateGroceryItemToPantry } from "./pipeline";

// Real integration tests against the live dev database (Neon) — this
// pipeline crosses two tables, so a pure-function test wouldn't actually
// exercise the dedup logic against real data. Each test seeds its own
// user, ingredients, and grocery item, and cleans up after itself; a
// beforeEach also proactively clears any stale row left by a crashed run.
const TEST_EMAIL = "vitest-grocery-pipeline@nekonomi.local";
const TEST_INGREDIENT_NAMES = ["vitest-milk", "vitest-eggs", "vitest-flour"];

async function cleanupUser(userId: string) {
  await db.delete(pantry).where(eq(pantry.userId, userId));
  await db.delete(groceryList).where(eq(groceryList.userId, userId));
  await db.delete(users).where(eq(users.id, userId));
}

async function seedIngredient(name: string) {
  await db.insert(ingredients).values({ name }).onConflictDoNothing({ target: ingredients.name });
  const [ing] = await db.select().from(ingredients).where(eq(ingredients.name, name)).limit(1);
  return ing;
}

let userId: string;

beforeEach(async () => {
  const [stale] = await db.select().from(users).where(eq(users.email, TEST_EMAIL)).limit(1);
  if (stale) await cleanupUser(stale.id);

  const [user] = await db
    .insert(users)
    .values({ id: crypto.randomUUID(), name: "Vitest", email: TEST_EMAIL })
    .returning();
  userId = user.id;
});

afterEach(async () => {
  await cleanupUser(userId);
});

describe("migrateGroceryItemToPantry", () => {
  it("migrates a pending item into the pantry and marks it purchased", async () => {
    const milk = await seedIngredient("vitest-milk");
    const [item] = await db
      .insert(groceryList)
      .values({ userId, ingredientId: milk.id, quantity: "1", unit: "gallon" })
      .returning();

    await migrateGroceryItemToPantry(item.id, userId);

    const [pantryRow] = await db.select().from(pantry).where(eq(pantry.userId, userId));
    expect(pantryRow?.ingredientId).toBe(milk.id);
    expect(pantryRow?.unit).toBe("gallon");

    const [updated] = await db.select().from(groceryList).where(eq(groceryList.id, item.id));
    expect(updated.status).toBe("purchased");
  });

  it("does not create a duplicate pantry row if the ingredient is already owned", async () => {
    const eggs = await seedIngredient("vitest-eggs");
    await db.insert(pantry).values({ userId, ingredientId: eggs.id });
    const [item] = await db
      .insert(groceryList)
      .values({ userId, ingredientId: eggs.id })
      .returning();

    await migrateGroceryItemToPantry(item.id, userId);

    const pantryRows = await db.select().from(pantry).where(eq(pantry.userId, userId));
    expect(pantryRows.length).toBe(1);

    const [updated] = await db.select().from(groceryList).where(eq(groceryList.id, item.id));
    expect(updated.status).toBe("purchased"); // still marked purchased, even though nothing was inserted
  });

  it("is idempotent — re-running on an already-purchased item is a no-op", async () => {
    const flour = await seedIngredient("vitest-flour");
    const [item] = await db
      .insert(groceryList)
      .values({ userId, ingredientId: flour.id, status: "purchased" })
      .returning();

    await migrateGroceryItemToPantry(item.id, userId);

    const pantryRows = await db.select().from(pantry).where(eq(pantry.userId, userId));
    expect(pantryRows.length).toBe(0); // no migration re-triggered
  });

  it("throws if the grocery item doesn't belong to the calling user", async () => {
    const milk = await seedIngredient("vitest-milk");
    const [item] = await db
      .insert(groceryList)
      .values({ userId, ingredientId: milk.id })
      .returning();

    const someoneElsesId = crypto.randomUUID();
    await expect(migrateGroceryItemToPantry(item.id, someoneElsesId)).rejects.toThrow(
      "Grocery item not found"
    );

    // and the real owner's item should be untouched
    const [unchanged] = await db.select().from(groceryList).where(eq(groceryList.id, item.id));
    expect(unchanged.status).toBe("pending");
  });

  afterAll(async () => {
    await db.delete(ingredients).where(inArray(ingredients.name, TEST_INGREDIENT_NAMES));
  });
});
