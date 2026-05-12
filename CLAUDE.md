# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> The workspace-level `../CLAUDE.md` covers cross-project context (frontend ↔ backend wiring, ports, CORS, K-anonymity, the unused `moodloop/` Vite scaffold). This file is the authoritative source for **frontend-only** specifics; when the two disagree, this one wins inside `frontG/`.

## Commands

```bash
npm install            # package-lock.json is authoritative; pnpm-lock.yaml is stale
npm run dev            # Next.js dev server on http://localhost:3000
npm run build
npm run start
npm run lint           # eslint .
npx tsc --noEmit       # real type-check — `next build` does NOT fail on type errors
```

No test runner is configured.

## Routing model — not Next.js routing

`app/page.tsx` is a single `"use client"` component that swaps between views based on a `view` field in React context:

```
home | login | register | employee-portal | hr-dashboard | admin-dashboard
```

`UserRole` is `"employee" | "hr" | "admin" | null`. There are essentially no Next.js routes — only `app/page.tsx`, `app/layout.tsx`, and the standalone `app/test-model/page.tsx` debug page for the AraBERT predictor (`POST /reflections/predict-only`).

**When adding a new screen, add a `view` value and a component — not a new `app/<route>/page.tsx`**, unless you are intentionally introducing real URL-based routing.

## Global state — `lib/app-context.tsx`

`AppProvider` owns: `user`, `view`, `language` (`"en"` | `"ar"`), `authMode`, `userType`, `toasts`, plus loading flags. It persists `{ user, language }` to `localStorage["moodloop_session"]` and on mount rehydrates returning users into `admin-dashboard` / `hr-dashboard` / `employee-portal` based on `user.role`.

Use `useApp()` to read/write. `logout()` clears context + `moodloop_session` but does **not** clear `localStorage["access_token"]` — clear that separately when wiring real logout.

The same file also owns:
- `translations.en` / `translations.ar` — every user-facing string. The app is bilingual; do not hardcode English in components. New strings go here, keyed in both languages.
- `departments` and `emotions` arrays — canonical lists used across forms and dashboards (`id`, `label`, `labelAr`, `emoji`, `color`).

## API client — `lib/api.ts`

All HTTP goes through `lib/api.ts`. It reads `localStorage["access_token"]` and sends `Authorization: Bearer <token>` on every call. `BASE_URL` comes from `NEXT_PUBLIC_API_URL` (`http://localhost:8000` in `.env.local`).

Backend endpoint prefixes are inconsistent (`/auth/*`, `/users/*`, `/reflections/*`, `/alarms/*`, but HR uses `/api/hr/*`). Match the existing per-call style when adding endpoints.

JWT payload: `sub` = stringified `employee_id`, `role` = `"hr"` | `"employee"` | `"admin"`. The frontend never decodes the token; user identity is tracked separately in `AppContext`.

## UI primitives

`components/ui/` is shadcn/ui (`new-york` style, neutral base, Lucide icons — see `components.json`). Path alias `@/*` maps to the project root: `@/components/ui/button`, `@/lib/utils`, `@/hooks/use-toast`. Tailwind v4 with CSS variables; theme tokens live in `app/globals.css`. **Prefer composing existing `components/ui/*` primitives over adding new dependencies.**

## Build quirks

- `next.config.mjs` sets `typescript.ignoreBuildErrors: true` and `images.unoptimized: true`. Type errors will not fail `next build` — run `npx tsc --noEmit` manually for real type checking. Don't assume green builds mean type-clean.
- Two lockfiles ship (`package-lock.json` + `pnpm-lock.yaml`); npm is the maintained one. Pick one when installing — don't commit both being modified.
- `.gitignore` excludes v0-runtime artifacts (`__v0_runtime_loader.js`, `__v0_devtools.tsx`, `__v0_jsx-dev-runtime.ts`); the project was scaffolded with v0.app and may regenerate these locally. Don't commit them.

## Cross-cutting things easy to get wrong

- **Two storage keys for auth**: JWT in `localStorage["access_token"]`, profile blob in `localStorage["moodloop_session"]`. Both must be cleared on true logout.
- **K-anonymity floor**: the backend refuses to emit a department alarm unless ≥ 5 employees reflected in the window. Any HR/admin UI displaying per-department data must handle empty/null responses gracefully rather than crash.
- **Arabic-only reflections, length 100–1000 chars**: mirror these bounds in submission forms to avoid backend 422s.
- **CORS**: backend allow-list is `localhost:5173` / `127.0.0.1:5173` — not `:3000`. Running `npm run dev` against the real backend requires either adding `:3000` to the backend CORS list or running the frontend on `:5173`. Don't silently change the dev port without checking.
