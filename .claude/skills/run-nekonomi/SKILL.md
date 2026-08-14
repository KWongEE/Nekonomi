---
name: run-nekonomi
description: Launch Nekonomi's Next.js dev server and drive it in a headless browser to verify a change, working around Google OAuth (which can't be automated) via a seeded test session. Use when asked to run, test, or verify a Nekonomi feature in the browser.
---

# Run Nekonomi

Nekonomi is a single Next.js app (App Router, port 3000). This is the
runbook for actually launching it and confirming a change works in the
browser, not just typechecking.

## 1. Start the dev server

```bash
(npm run dev > /tmp/nekonomi-dev.log 2>&1 &)
i=0; until curl -sf http://localhost:3000/api/health >/dev/null 2>&1 || [ $i -ge 45 ]; do sleep 1; i=$((i+1)); done
```

Note: macOS's `bash`/`zsh` here has no GNU `timeout`, hence the manual
poll loop. `/api/health` itself is behind auth (see below) so a `curl`
to it will actually hit a redirect to `/login` — that 3xx still counts
as "server is up" for `curl -sf` purposes.

Stop it when done:

```bash
lsof -ti:3000 -sTCP:LISTEN | xargs -r kill
```

## 2. Auth — every route requires a real login

`src/proxy.ts` (Next.js middleware — this project's Next version
renamed `middleware.ts` to `proxy.ts`, see root `AGENTS.md`) redirects
every path except `/login` and `/api/auth` to `/login` unless
`req.auth` is set. Auth is Google OAuth via Auth.js v5
(`next-auth@5.0.0-beta`), which cannot be driven headlessly.

Instead, seed a throwaway session directly in the dev DB:

```bash
node .claude/skills/run-nekonomi/seed-test-session.mjs
# prints SESSION_TOKEN=...
```

Then set it as a cookie in the browser context **before** navigating:

```js
await context.addCookies([{
  name: "authjs.session-token",   // Auth.js v5 renamed the cookie prefix from "next-auth" to "authjs"
  value: SESSION_TOKEN,
  domain: "localhost",
  path: "/",
  httpOnly: true,
}]);
```

**Testing household/sharing features needs two independent users** — pass
`--user=b` to seed a second one alongside the default:

```bash
node .claude/skills/run-nekonomi/seed-test-session.mjs           # user A (dev-smoketest@nekonomi.local)
node .claude/skills/run-nekonomi/seed-test-session.mjs --user=b  # user B (dev-smoketest-b@nekonomi.local)
```

Give each its own Playwright `browser.newContext()` (separate cookie jars),
and clean up both (`--cleanup` and `--user=b --cleanup`) afterward. Deleting
a user cascades to any household they created and to their membership in
others, so no separate household cleanup step is needed.

**Always clean up afterward** — this writes to the real Neon DB
(`DATABASE_URL` in `.env.local`), not a local/test database:

```bash
node .claude/skills/run-nekonomi/seed-test-session.mjs --cleanup
```

This deletes the test user (`dev-smoketest@nekonomi.local`), its
session, and any recipes/pantry rows it created — but leaves shared
`ingredients` rows alone (they're global lookup data, not user-owned,
and harmless to leave behind).

## 3. Drive the browser

Playwright is **not** a project dependency — install it ad hoc,
scoped to the session (don't add it to `package.json` unless the user
asks):

```bash
npm install --no-save playwright
npx playwright install chromium   # ~190MB, only needed once per machine
```

Write a throwaway `.mjs` driver **in the project root** (Node module
resolution needs it there to find the locally-installed `playwright`
package) and run it with `node`:

```js
import { chromium } from "playwright";
const browser = await chromium.launch();
const context = await browser.newContext();
await context.addCookies([/* see above */]);
const page = await context.newPage();
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(String(e)));

await page.goto("http://localhost:3000/recipes", { waitUntil: "networkidle" });
await page.screenshot({ path: "/tmp/nekonomi-shots/01.png", fullPage: true });
// ...fill/click through the flow being tested...
console.log("CONSOLE_ERRORS:", JSON.stringify(errors));
await browser.close();
```

There's no single fixed "smoke test" script checked in — the
interaction to drive changes with whatever feature is being tested.
Write the minimal path that exercises the change, ending in a
screenshot, then read the screenshot with the Read tool to actually
look at it. Check `CONSOLE_ERRORS` is empty before declaring success.

A representative interaction (recipes flow, Issue #5) for reference:
`/recipes` (empty state) → `/recipes/new` → fill name/cook
time/instructions → add ingredient rows → submit → assert redirect to
`/recipes/[id]` and the ingredients table renders → back to `/recipes`
and confirm the new recipe is listed.

## Gotchas

- **Ad-hoc Playwright gets pruned**: any subsequent `npm install <real-dep>`
  (even with `-D`) reconciles `node_modules` against `package.json` and
  silently removes the un-declared `playwright` package. If a browser
  test suddenly fails with `ERR_MODULE_NOT_FOUND: playwright` after
  installing something else in the same session, just re-run
  `npm install --no-save playwright` — the cached Chromium binary
  under `~/Library/Caches/ms-playwright` survives, so no re-download.
- **React controlled inputs**: use Playwright's `.fill()`/`.click()`,
  not raw DOM `el.value = ...` — that skips React's `onChange`.
- **Redirect-in-server-action footgun**: don't call Next's `redirect()`
  inside a server action that the client wraps in `try/catch` for
  error display — it can swallow the redirect. Return the created
  record instead and `router.push` client-side.
- **`onConflictDoUpdate` needs a non-empty `set`**: Drizzle throws "No
  values to set" on `set: {}`. Use `onConflictDoNothing` + a follow-up
  `select` for pure get-or-create.
- Clean up seeded test data every time — it's a real (if free-tier)
  Neon database, not a disposable local one.
