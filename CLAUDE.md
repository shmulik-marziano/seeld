# CLAUDE.md

Guidance for AI assistants (Claude Code and others) working in this repository.

## Project Overview

**SEELD** (`seeld`) is a Hebrew, **RTL** web application for an Israeli financial &
insurance agency (סוכנות פיננסים וביטוח). It is a single React SPA that serves
**two distinct surfaces** from one codebase:

1. **Public marketing site** (`/`, `/insurances`, `/savings`, `/blog`, calculators,
   info pages, etc.) — content, lead capture, financial calculators, fund/track
   comparison tools.
2. **Agent platform** (`/app/*`) — an authenticated CRM/workflow product for
   insurance agents, organized around a 5-phase pipeline of named "tools"
   (Catch, Lens, Reveal, X-Ray, Wise, Stage, Sign, …). Includes a separate
   **PDage** module (`/app/pdage/*`) for policy deficiency correction.

The project was bootstrapped with **Lovable** (see `README.md`); changes pushed to
the repo are reflected back in Lovable. Production is deployed on **Vercel**
(see `vercel.json`) to `seeld.co.il`.

UI text, domain types, and many comments are in **Hebrew**. Preserve Hebrew copy
and RTL (`dir="rtl"`) conventions when editing.

## Tech Stack

- **Build/dev:** Vite 5 + `@vitejs/plugin-react-swc`
- **Language:** TypeScript 5.8, React 18.3
- **Routing:** `react-router-dom` v6 (`BrowserRouter`, single `<Routes>` in `src/App.tsx`)
- **Server state:** `@tanstack/react-query` v5
- **Backend:** **Supabase** (Postgres, Auth, Storage, Edge Functions in Deno)
- **Styling:** Tailwind CSS 3 + **shadcn/ui** (Radix primitives) + `tailwindcss-animate`
- **Forms/validation:** `react-hook-form` + `zod` + `@hookform/resolvers`
- **Animation:** `framer-motion`
- **PWA:** `vite-plugin-pwa` (autoUpdate, installable, RTL/Hebrew manifest)
- **Misc:** `recharts` (charts), `jspdf`/`jspdf-autotable`/`html2canvas` (PDF export),
  `xlsx`/`jszip` (file import/export), `react-markdown`, `sonner` (toasts), `date-fns`
- **Tests:** Vitest + Testing Library (unit), Playwright (e2e via Lovable config)
- **Lint:** ESLint 9 (flat config) + typescript-eslint

## Commands

The README references `npm`, but the repo also contains a `bun.lock`/`bun.lockb`.
Both `package-lock.json` and bun lockfiles are committed — prefer **npm** for
consistency with `vercel.json` (`buildCommand: "npm run build"`) unless told otherwise.

```sh
npm install          # install dependencies
npm run dev          # Vite dev server on http://localhost:8080 (host "::")
npm run build        # production build → dist/
npm run build:dev    # build in development mode
npm run preview      # preview the production build
npm run lint         # ESLint over the repo
npm run test         # vitest run (single pass)
npm run test:watch   # vitest watch mode
```

There is **no `typecheck` script**; rely on `npm run build` (or your editor) for
type errors. Always run `npm run lint` and `npm run test` before committing
significant changes.

## Repository Layout

```
src/
  App.tsx              # Root: providers + ALL routes (public, /app, /app/pdage). Large file.
  main.tsx             # Entry + top-level ErrorBoundary (renders Hebrew error fallback)
  index.css            # Tailwind layers + CSS variables / design tokens
  components/
    ui/                # shadcn/ui primitives (49 files) — generated, edit sparingly
    layout/            # AppLayout (agent sidebar/mobile tabs), PageHeader
    pdage/             # PDage module layout + components
    slides/, brand/, modals/, products/, customer/, settings/, status/,
    personal-area/, fund-finder/, pwa/   # feature-scoped components
    *.tsx              # Public-site components (Header, Footer, Hero, calculators, mega-menus…)
  pages/               # One component per route
    insurance/         # 15 insurance product pages
    savings/           # 11 savings/pension product pages
    tools/             # 22 agent platform tool pages (Catch, Lens, X-Ray, Wise…)
    pdage/             # PDage module pages
  contexts/AppContext.tsx   # Agent-app global state (customers, products, recommendations…)
  hooks/               # useAuth, use-toast, use-mobile, data hooks (useCmaFunds, useFundSearch…)
  integrations/supabase/
    client.ts          # Main Supabase client (app data) — GENERATED, do not hand-edit header
    site-client.ts     # "Site" Supabase client (auth + page_views); same project, different env vars
    types.ts           # Generated DB types for main client (~48KB)
    site-types.ts      # Generated DB types for site client
  services/            # import-service, pdf-generator, validations (framework-agnostic logic)
  config/tools.ts      # Canonical TOOLS[]/PHASES/DECK definitions powering /app navigation
  data/                # Static content: articles, fund data, menu data, demo data, search index
  types/               # Domain types (index.ts has Hebrew union types), fund, execution-summary
  lib/utils.ts         # cn() = clsx + tailwind-merge
  test/                # Vitest setup.ts (jsdom matchMedia shim) + example.test
supabase/
  config.toml          # Project id + per-function verify_jwt flags
  functions/<name>/index.ts   # Deno Edge Functions (AI chat, file parsing, notifications…)
  migrations/*.sql     # Timestamped SQL migrations (Lovable-managed naming)
```

## Architecture & Conventions

### Path aliases
`@/` → `src/` (configured in `vite.config.ts`, `vitest.config.ts`, `tsconfig`,
and `components.json`). Always import via `@/...`, e.g. `import { cn } from "@/lib/utils"`.

### Two Supabase clients
- `@/integrations/supabase/client` (`supabase`) — primary client for agent app
  data: `customers`, `products`, `recommendations`, `profiles`, `agencies`, etc.
  Uses `VITE_SUPABASE_*` env vars.
- `@/integrations/supabase/site-client` (`siteSupabase`) — used by `useAuth` and
  the `PageViewTracker` (writes to `page_views`). Uses `VITE_SITE_SUPABASE_*` env
  vars. **Currently points at the same Supabase project** as the main client.

`client.ts` and the `types.ts`/`site-types.ts` files carry "automatically
generated — do not edit" semantics (Lovable/Supabase codegen). To change DB
types, change the schema (migration) and regenerate, rather than hand-editing.

### Routing & layouts (`src/App.tsx`)
All routes live in one `<Routes>` block. Provider order:
`QueryClientProvider → AppProvider → AuthProvider → TooltipProvider → BrowserRouter`.

- **Public routes** render bare (no shared layout wrapper beyond global chrome).
- **Agent routes** are wrapped: `<Route element={<AgentAuthGuard />}>` →
  pages rendered inside `AppLayout` (sidebar built from `config/tools.ts`,
  mobile bottom tabs). `AgentAuthGuard` redirects to `/app/auth` when no session
  and to `/app/auth?onboarding=true` when `needsOnboarding`.
- **PDage routes** are wrapped by `<PDageAuthGuard />` + `PDageLayout`.
- Global components mounted once in `App`: `ScrollToTop`, `PageTransition`,
  `AIChatBot`, `AccessibilityButton`, `CookieConsent`, `ScrollProgress`,
  `FloatingShapes`, `PwaInstallBanner`, plus a `PageViewTracker` that logs
  page views to `page_views` (skips `/admin` and `/site-admin`).

When adding a page: create it under `src/pages/...`, import it in `App.tsx`, and
add a `<Route>` in the correct group (public vs. `/app` guard vs. PDage guard).

### Agent-app state — `AppContext`
`src/contexts/AppContext.tsx` is the heart of the agent app. It:
- Tracks the Supabase `session` and `needsOnboarding`.
- Loads `customers`, `products`, `recommendations`, `source_files`, and
  `activity_log` from Supabase on auth.
- **Maps snake_case DB rows ↔ camelCase frontend types** via `mapCustomer`/
  similar helpers (DB is snake_case; app types are camelCase — preserve this
  mapping when adding fields). Extra fields live in a JSONB `extended_data` column
  typed as `CustomerExtendedData`.
- Exposes CRUD actions and `logActivity`. Consume via the `useApp()` hook
  (throws if used outside `AppProvider`).

### The "tools" model — `src/config/tools.ts`
`TOOLS[]` is the single source of truth for the agent platform's 22 tools, each
with `slug`, English `name`, `hebrewName`, `icon` (lucide), colors/gradient,
`phase` (1–5), `phaseLabel`, descriptions, and a `status`
(`exists | partial | new | planned`). `PHASES` and `DECK` accompany it.
`AppLayout` renders the sidebar from this config. Keep `TOOLS` entries in sync
with the `/app/tools/<slug>` routes in `App.tsx`.

### Domain types (`src/types/index.ts`)
Domain enums are Hebrew string-literal unions (e.g. `CustomerStatus`,
`ExecutionStatus`, `ActionType`). Reuse these unions rather than inventing new
status strings, and keep new values consistent with the Hebrew pipeline vocabulary.

### Supabase Edge Functions (`supabase/functions/`)
Deno functions (`import ... from "https://deno.land/..."`), each `index.ts`
served via `serve()`. They handle AI chat (`finance-chat`, `pdage-chat`),
file parsing (`parse-import-file`, `parse-insurance-file`, `parse-pdf-policy`),
recommendation generation, onboarding, notifications, and data sync.
All set permissive CORS headers and handle `OPTIONS` preflight.
`config.toml` lists functions with `verify_jwt = false` (public/no-JWT).
Some functions are scheduled via cron migrations (see `*_cma_cron_schedule.sql`).

### Database migrations
`supabase/migrations/*.sql` use Lovable's timestamped-UUID naming
(`YYYYMMDDHHMMSS_<uuid>.sql`), with a few human-named ones
(`..._page_views.sql`, `..._create_cma_funds.sql`). Add schema changes as new
migration files; do not edit existing migrations.

### Styling
- Tailwind + shadcn/ui. Compose classes with `cn(...)` from `@/lib/utils`.
- Brand color is the dark teal `#0a3d3d` (and `#1a1a2e` PWA theme). Reuse existing
  tokens/colors rather than introducing new ad-hoc hex values where possible.
- Everything is **RTL/Hebrew** — set `dir="rtl"` on roots and verify layouts in RTL.
- shadcn config (`components.json`): base color `slate`, CSS variables, no prefix,
  aliases for `components`/`ui`/`lib`/`hooks`/`utils`.

### Testing
- Unit tests: `*.test.ts(x)` / `*.spec.ts(x)` under `src/` (jsdom env, globals on).
  `src/test/setup.ts` provides a `matchMedia` shim. Edge functions may also have
  co-located tests (e.g. `parse-import-file/index.test.ts`).
- E2E: Playwright via `lovable-agent-playwright-config` (`playwright.config.ts`,
  `playwright-fixture.ts`). Import `test`/`expect` from `playwright-fixture.ts`.

### Lint notes
`@typescript-eslint/no-unused-vars` is **off**; `react-refresh/only-export-components`
is a warning. `dist` is ignored. Follow existing patterns; don't fight the config.

## Environment Variables

Defined in `.env` (committed; values are public anon keys / project URLs):

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`
- `VITE_SITE_SUPABASE_URL`, `VITE_SITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SITE_SUPABASE_PROJECT_ID`

Only `anon`/publishable keys belong here. **Never commit service-role keys or
other secrets**; Edge Function secrets are managed in the Supabase dashboard.

## Git & Workflow Conventions

- Commit messages are short, imperative, often prefixed with a type/area:
  `feat:`, `fix:`, `design:`, `data:`, `SEO:` (prefix optional for one-offs).
  Match the existing terse style; describe the user-facing change.
- Keep changes scoped; preserve Hebrew copy and RTL behavior.
- When changing DB-backed features, update: the migration, the generated types
  (via regeneration), the `AppContext` mapper, and the domain type — together.
- Run `npm run lint` and `npm run test` before pushing.

## Gotchas

- `src/App.tsx` is large and central — adding a route means editing both the
  import block and the `<Routes>` block; place it under the right auth guard.
- snake_case (DB) vs camelCase (frontend) — always go through the `AppContext`
  mappers; don't pass raw DB rows into typed components.
- Two Supabase clients exist; pick the right one (`supabase` for app data,
  `siteSupabase` for auth/page-views). They happen to share a project today.
- `client.ts` and `types.ts`/`site-types.ts` are generated — change the schema,
  not these files by hand.
- `tools.ts` and the `/app/tools/*` routes must stay in sync.
- The app is fully RTL/Hebrew; test visual changes in RTL and keep `dir="rtl"`.
