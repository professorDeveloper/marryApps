---
name: verify
description: How to verify changes in this repo (Vite + React dashboard behind auth)
---

# Verifying changes in frontv2

## Build/typecheck (fast sanity, not a substitute for runtime verification)
- `npx tsc --noEmit -p tsconfig.json` — typecheck
- `npm run build` — production build via vite

## Dev server
- `npm run dev` starts Vite. In this environment a dev server is often already
  running on **port 8081** (check with `lsof -i :8081` before starting a new one).
- HMR is on, so editing `src/**` updates an already-open browser tab live.
- `logs/missing-i18n.log` gets appended to by the running app — ignore stray
  diffs to it unless you intentionally touched i18n.

## No browser automation / no test login available
- This app requires an authenticated session (dashboard behind login) and no
  test credentials or Playwright/Puppeteer setup were found in the repo.
- Searching `.env*`/auth files for bypass creds gets blocked by the permission
  classifier as "credential exploration" — don't go down that path; ask the
  user instead if GUI verification is essential.
- The user's own browser is often already logged in and pointed at the app
  (e.g. localhost:8081) — the fastest real verification is often to ask them
  to reload the already-open page after an HMR-eligible change.

## Logic-level verification without a browser
For pure-logic changes (Redux slices, hooks, utils) that are hard to reach
live without login, exercise the **actual modified source file** directly
with the project's own `esbuild` (already in `node_modules/.bin/esbuild`, no
extra installs needed — `tsx`/`ts-node` are NOT installed and `npx` will
refuse to auto-install them):

```bash
node_modules/.bin/esbuild src/path/to/file.ts --bundle --platform=node \
  --format=cjs --external:<peer-deps-like-@reduxjs/toolkit-or-dayjs> \
  --outfile=./.verify-tmp.cjs
node -e "require('./.verify-tmp.cjs'); /* mock globals (e.g. localStorage), assert */"
rm ./.verify-tmp.cjs
```

This runs the real transpiled module (not a hand-reimplementation), letting
you simulate things like a stale `localStorage` payload and assert on the
computed output. Clean up the temp `.cjs` files afterward — don't commit them.
