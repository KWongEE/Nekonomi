// Plain DB helper (no "use server"/auth()) — shared by every feature area's
// actions to scope reads/writes to a household instead of a single user.
// A user with no household just gets back their own id, preserving today's
// solo behavior unchanged.
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getHouseholdMemberIds(userId: string): Promise<string[]> {
  const [me] = await db
    .select({ householdId: users.householdId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!me?.householdId) return [userId];

  const members = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.householdId, me.householdId));

  return members.map((m) => m.id);
}
