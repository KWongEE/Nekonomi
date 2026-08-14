#!/usr/bin/env node
// Seeds (or removes) a throwaway NextAuth/Auth.js session for headless browser
// testing, since Google OAuth can't be driven automatically.
//
// Usage (run from the project root so DATABASE_URL resolves via .env.local):
//   node .claude/skills/run-nekonomi/seed-test-session.mjs                 seed: create/reuse test user + session, print SESSION_TOKEN
//   node .claude/skills/run-nekonomi/seed-test-session.mjs --cleanup       remove all data owned by the test user, then the user

import dotenv from "dotenv";
import postgres from "postgres";
import crypto from "node:crypto";

dotenv.config({ path: ".env.local" });

const TEST_EMAIL = "dev-smoketest@nekonomi.local";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL not set — run this from the project root (.env.local not found).");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

async function cleanup() {
  const [user] = await sql`select id from users where email = ${TEST_EMAIL}`;
  if (!user) {
    console.log("No test user found — nothing to clean up.");
    return;
  }
  const recipeIds = (
    await sql`select id from recipes where user_id = ${user.id}`
  ).map((r) => r.id);
  for (const id of recipeIds) {
    await sql`delete from recipe_ingredients where recipe_id = ${id}`;
  }
  await sql`delete from recipes where user_id = ${user.id}`;
  await sql`delete from pantry where user_id = ${user.id}`;
  await sql`delete from sessions where "userId" = ${user.id}`;
  await sql`delete from users where id = ${user.id}`;
  console.log(`Cleaned up ${recipeIds.length} recipe(s), pantry items, and the test user.`);
}

async function seed() {
  let [user] = await sql`select id from users where email = ${TEST_EMAIL}`;
  if (!user) {
    [user] = await sql`
      insert into users (id, name, email, created_on)
      values (${crypto.randomUUID()}, 'Smoke Test', ${TEST_EMAIL}, now())
      returning id
    `;
  }

  const sessionToken = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  // One live session per test user — drop any stale one first.
  await sql`delete from sessions where "userId" = ${user.id}`;
  await sql`
    insert into sessions ("sessionToken", "userId", expires)
    values (${sessionToken}, ${user.id}, ${expires})
  `;

  console.log(`USER_ID=${user.id}`);
  console.log(`SESSION_TOKEN=${sessionToken}`);
  console.log(
    `\nSet this cookie before navigating in Playwright:\n` +
      `{ name: "authjs.session-token", value: "${sessionToken}", domain: "localhost", path: "/", httpOnly: true }`
  );
}

const mode = process.argv.includes("--cleanup") ? "cleanup" : "seed";
(mode === "cleanup" ? cleanup() : seed())
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => sql.end());
