"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db";
import { households, users } from "@/db/schema";
import { eq } from "drizzle-orm";

function generateInviteCode(): string {
  // No 0/O/1/I/L — avoids characters people misread when copying a code by hand.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

function revalidateHouseholdScopedPaths() {
  revalidatePath("/household");
  revalidatePath("/pantry");
  revalidatePath("/recipes");
  revalidatePath("/grocery");
  revalidatePath("/");
}

// ─── Get the current user's household, its members, and whether ───
// the caller is its creator. Returns null if not in a household.
export async function getMyHousehold() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [me] = await db
    .select({ householdId: users.householdId })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  if (!me?.householdId) return null;

  const [household] = await db.select().from(households).where(eq(households.id, me.householdId)).limit(1);
  if (!household) return null;

  const members = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.householdId, household.id))
    .orderBy(users.name);

  return { household, members, isCreator: household.createdBy === session.user.id };
}

// ─── Create a household and become its creator ─────────────────────
export async function createHousehold(rawName: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const userId = session.user.id;

  const [me] = await db.select({ householdId: users.householdId }).from(users).where(eq(users.id, userId)).limit(1);
  if (me?.householdId) throw new Error("Leave your current household before creating a new one");

  const name = rawName.trim();
  if (!name) throw new Error("Household name is required");

  await db.transaction(async (tx) => {
    const [household] = await tx
      .insert(households)
      .values({ name, createdBy: userId, inviteCode: generateInviteCode() })
      .returning();
    await tx.update(users).set({ householdId: household.id }).where(eq(users.id, userId));
  });

  revalidateHouseholdScopedPaths();
}

// ─── Join an existing household via its invite code ────────────────
export async function joinHousehold(rawCode: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const userId = session.user.id;

  const [me] = await db.select({ householdId: users.householdId }).from(users).where(eq(users.id, userId)).limit(1);
  if (me?.householdId) throw new Error("Leave your current household before joining another");

  const code = rawCode.trim().toUpperCase();
  if (!code) throw new Error("Invite code is required");

  const [household] = await db.select().from(households).where(eq(households.inviteCode, code)).limit(1);
  if (!household) throw new Error("Invalid invite code");

  await db.update(users).set({ householdId: household.id }).where(eq(users.id, userId));

  revalidateHouseholdScopedPaths();
}
