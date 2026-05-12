# MoodLoop — Frontend

A bilingual (English / Arabic) Next.js app for **MoodLoop**, an employee well‑being platform. Employees submit short Arabic reflections; HR sees aggregated, K‑anonymous department insights powered by an AraBERT model on the backend.

## Tech stack

- **Next.js 16** (App Router) + **React 19**
- **TypeScript 5.7**
- **Tailwind CSS v4** + **shadcn/ui** (new‑york style, neutral base, Lucide icons)
- **Radix UI** primitives, **Framer Motion**, **Recharts**, **react-hook-form** + **zod**
- **next-pwa** for installable PWA support

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
```

Other scripts:

```bash
npm run build
npm run start
npm run lint
```

> The repo ships both `package-lock.json` and `pnpm-lock.yaml`; `package-lock.json` is the maintained one — use npm.

## Environment

Create `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

This points at the FastAPI backend (`MOODLOOP-backedn/`). All HTTP calls are routed through `lib/api.ts`, which reads `access_token` from `localStorage` and sends `Authorization: Bearer <token>`.

> The backend's CORS allow‑list defaults to `localhost:5173`. To run the Next.js dev server against the real backend you must either add `:3000` to the backend CORS list or run the frontend on `:5173`.

## Project structure

```
app/
  layout.tsx          # Root layout
  page.tsx            # Single client page — swaps views via context
  test-model/         # Debug page for AraBERT /reflections/predict-only
  globals.css         # Tailwind v4 theme tokens
components/
  home-page.tsx
  auth-page.tsx
  employee-portal.tsx
  hr-dashboard.tsx
  hr-messages.tsx
  hr-profile.tsx
  admin-dashboard.tsx
  ui/                 # shadcn/ui primitives
lib/
  api.ts              # API client + token handling
  app-context.tsx     # Global state, translations, departments, emotions
  password-strength.ts
  utils.ts
hooks/
public/
```

## Routing model

There are essentially **no Next.js routes**. `app/page.tsx` is a single `"use client"` component that swaps between:

- `home`
- `login` / `register`
- `employee-portal`
- `hr-dashboard`

…based on a `view` field in `AppContext`. To add a new screen, add a `view` value and a component — not a new `app/<route>/page.tsx`, unless you intend to introduce real URL routing.

The only standalone route is `app/test-model/page.tsx`, a debug UI for the AraBERT predictor.

## Global state

`lib/app-context.tsx` owns:

- `user`, `view`, `language` (`"en"` | `"ar"`), `authMode`, `userType`, `toasts`, loading flags
- `translations.en` / `translations.ar` — **all** user‑facing strings live here; the app is bilingual, do not hardcode English in components
- `departments` and `emotions` — canonical lists (id, label, labelAr, emoji, color)

State is persisted to `localStorage["moodloop_session"]` (user + language) and rehydrated on mount, auto‑routing returning users into their portal.

Use `useApp()` to read/write context.

## Auth

- JWT is stored in `localStorage["access_token"]`, separate from the `moodloop_session` blob — **both must be cleared on a true logout**.
- JWT payload from backend: `sub` = stringified `employee_id`, `role` = `"hr"` or `"employee"`.
- The frontend never decodes the token; it round‑trips it and tracks identity separately in context.

## Backend contracts to respect

- **K‑anonymity:** the backend refuses to emit a department alarm unless ≥ 5 employees reflected in the window. HR‑facing UI must handle empty/null department data without crashing.
- **Arabic reflections only**, length 100–1000 chars. Match this on the client to avoid 422s from `POST /reflections`.
- Endpoint prefixes are inconsistent (`/auth/*`, `/users/*`, `/reflections/*`, `/alarms/*`, but HR uses `/api/hr/*`). `lib/api.ts` already encodes the right prefix per call — match its style when adding endpoints.

## Build quirks

- `next.config.mjs` sets `typescript.ignoreBuildErrors: true` and `images.unoptimized: true`. **Type errors will not fail `next build`** — run `npx tsc --noEmit` for real type checking.
- `.gitignore` excludes v0.app runtime artifacts (`__v0_runtime_loader.js`, `__v0_devtools.tsx`, `__v0_jsx-dev-runtime.ts`); the project was scaffolded with v0 and may regenerate these locally.
- `frontG/moodloop/` is an unused Vite scaffold left over from initialization. The real app is at the repo root (`frontG/app`, `frontG/components`).

## Path alias

`@/*` maps to the project root, e.g. `@/components/ui/button`, `@/lib/utils`, `@/hooks/use-toast`.

## Related

- Backend lives in the sibling directory `MOODLOOP-backedn/` (FastAPI + AraBERT). See its own `CLAUDE.md` for router layout, the reflections pipeline, K‑anonymity rules, and migrations.
