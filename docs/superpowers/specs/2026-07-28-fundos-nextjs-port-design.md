# FundOS Next.js Port — Design

## Context

FundOS is a Claude Design (`claude_design` MCP) mockup — a single `.dc.html` file (`FundOS.dc.html`) rendered by a proprietary client-side templating runtime (`support.js` / dc-runtime). It simulates "FundOS," an AI operating system for nonprofit/startup fundraising: an AI team of 12 named agents (Scout, Gatekeeper, Compass, Quill, Ledger, Archivist, Sentinel, Oracle, Envoy, Echo, Atlas, Sage) that discovers funding opportunities, drafts proposals, manages relationships, and administers awards on behalf of a fictional org ("Verdantia").

The mockup is one file: a single `class Component extends DCLogic` holding all state, mock data, and a `renderVals()` method that computes everything the template binds to. The template uses a custom DSL (`sc-if`, `sc-for`, `{{ expr }}`) compiled by dc-runtime into React at runtime.

This spec covers porting that mockup into a real Next.js application. The source design (visuals, copy, layout) is already fully specified by the mockup — this port is an engineering/architecture exercise, not a visual design exercise.

This is also the first piece of a larger initiative: a .NET Web API backend, containerized via .NET Aspire and Docker, will be added in a later pass. This design sets up the repo shape so that work slots in cleanly, without speculatively building any backend code now.

## Goals

- Full 1:1 port of all 7 screens (Command Center, Digital Twin, Opportunity Discovery, Proposal Workspace, Awards, AI Orchestration, Relationships), the auth/onboarding modal flow, and the ⌘K command palette.
- Pixel-faithful visuals: inline-style port, not a redesign.
- Repo structure that anticipates a .NET Web API + Aspire/Docker backend, without building it yet.
- Data layer shaped so mock data can be swapped for real API calls with minimal call-site changes.

## Non-goals (this pass)

- No real authentication, persistence, or backend calls. Auth/onboarding modals stay mock/clickable, matching the source.
- No .NET code, no Aspire AppHost, no Docker — only placeholder directories/READMEs marking where they'll go.
- No automated test suite. Verification is `next build` / `tsc` passing plus a manual visual check per route against the source mockup.
- No CSS framework adoption (no Tailwind). Styling stays inline, matching the mockup's own approach.

## Repo layout

```
fundos/
  apps/
    web/            Next.js 15 (App Router, TypeScript) — built this pass
    api/            Placeholder only: README describing the future ASP.NET Core Web API project
  infra/            Placeholder only: README describing the future Aspire AppHost + docker-compose
  docs/
    superpowers/specs/   Design docs (this file)
  README.md
  .gitignore
```

No root-level `package.json` or JS workspace tooling (pnpm/turborepo). `apps/web` is self-contained with its own `package.json`. `apps/api` will be a .NET project (different toolchain entirely), so a JS monorepo tool would add ceremony without benefit at this stage.

## Routing

The source mockup is a single-page app: one URL, a `state.screen` field picks which of 7 `sc-if` blocks renders. This port instead uses real Next.js App Router routes:

- `/` — Command Center (home)
- `/twin` — Digital Twin
- `/opportunities` — Opportunity Discovery (opportunity detail stays an in-page overlay via store state, not a sub-route — matches the source's slide-over behavior)
- `/proposal` — Proposal Workspace
- `/awards` — Awards
- `/agents` — AI Orchestration
- `/relationships` — Relationships

A shared `app/(dashboard)/layout.tsx` renders the `AppShell` (sidebar, header, global overlays) and wraps all 7 routes. The sidebar renders `<Link>`s; active-nav-item styling is derived from `usePathname()` rather than store state, so routing state isn't duplicated in the store.

Screen title/subtitle (the mockup's `titleMap`) becomes a small pure lookup keyed by pathname, colocated with the `Header` component.

## State — MobX

One `FundOsStore` class (`lib/store/FundOsStore.ts`) mirrors the source's `state` + actions + `renderVals()` computed values, using MobX observables/actions/computed instead of `setState`. It owns UI/session state that isn't routing:

- `authOpen`, `authMode`
- `onboardingOpen`, `onboardStep`, `building`, `url`
- `selectedOppId`, `sortKey`
- `approvedIds`, `expandedId`, `expandedMode`
- `cmdOpen`, `cmdQuery`
- `interviewIdx`, `interviewAns`, `showAlts`

It does **not** hold a `screen` field — that's the URL's job now.

`StoreProvider` (client component) instantiates the store once via `useState(() => new FundOsStore())` and exposes it through context; a `useFundOsStore()` hook is the consumption point. This keeps the store instance stable across client-side navigations within the dashboard layout.

## Data layer

`lib/data/*.ts`, one module per resource: `opportunities.ts`, `agents.ts`, `contacts.ts`, `awards.ts`, `activity.ts`, `twin.ts`, `nav.ts`, `kpis.ts`, `approvals.ts`, `learning.ts`, `pipeline.ts`, `memory.ts`, `versions.ts`, `interview.ts`, `scanning.ts`, `org.ts`.

Each module exports:
1. A TypeScript interface (or a few) describing the shape — e.g. `Opportunity`, `Agent`, `Contact`, `AwardRecord`, `ApprovalItem`. These interfaces double as the intended .NET API DTO contracts for the later backend pass.
2. A mock constant array matching the source's hardcoded data (Verdantia org, the 8 opportunities, 12 agents, 5 contacts, etc.) — copied faithfully, not invented.
3. An async accessor, e.g. `export async function getOpportunities(): Promise<Opportunity[]> { return OPPORTUNITIES }`.

The store's `init()` action calls all `getX()` functions via `Promise.all` at startup and sets the results as observables; a `ready` flag gates rendering until they resolve (instant with mocks, but the shape survives becoming real `fetch()` calls later — swapping one function to hit `apps/api` won't touch call sites).

Derived/computed values that the source computes in `renderVals()` (sorted opportunities, filtered approvals, agent status colors, twin confidence colors, etc.) become MobX `computed` getters on the store or on the consuming screen component, following the same logic 1:1.

## Components

- `components/shell/` — `AppShell`, `Sidebar`, `Header`.
- `components/overlays/` — `AuthModal`, `OnboardingModal`, `CmdKPalette`. These render globally from `AppShell` regardless of route, gating the dashboard exactly like the source (`authOpen`/`onboardingOpen` default `true`). `CmdKPalette` listens for ⌘K/Ctrl+K and Escape the same way the source's `componentDidMount` does.
- `components/screens/` — one component per screen (`CommandCenter`, `DigitalTwin`, `OpportunityDiscovery`, `OpportunityDetail`, `ProposalWorkspace`, `Awards`, `AiOrchestration`, `Relationships`), each rendered by its corresponding route's `page.tsx`.
- `components/ui/` — small reusable pieces only where the source repeats a pattern verbatim (KPI tile, progress bar, badge/pill). No new abstractions beyond what the source already repeats.

All interactive components are client components (`"use client"`), consistent with the source being a fully client-rendered SPA.

## Styling

Faithful inline-style port: the mockup's inline `style="..."` strings are converted to camelCase JSX style objects, kept as close to verbatim as possible (same colors, spacing, radii, transitions). No Tailwind, no CSS-in-JS library.

- CSS custom properties (`--ink`, `--muted`, `--accent`, etc.) are declared once on a root wrapper element via a `style` object typed `as React.CSSProperties`, and consumed elsewhere as `var(--x)` strings in nested style objects — exactly the source's own pattern.
- Things inline styles can't express — `@keyframes` (`fos-reveal`, `fos-slide`, `fos-fade`, `fos-pulse`, `fos-scan`, `fos-spin`), the custom scrollbar (`::-webkit-scrollbar`), and `*{box-sizing:border-box}` reset — move to `styles/globals.css`, imported once in the root layout.
- Fonts (Space Grotesk, IBM Plex Sans, IBM Plex Mono) load via `next/font/google` instead of the source's `<link>`/`@import` tags — avoids render-blocking, standard Next.js practice, same visual result.
- `style-hover="..."` attributes from the dc-runtime DSL (pseudo-class-via-attribute) have no direct React equivalent; each occurrence becomes a small local hover-state handled with `onMouseEnter`/`onMouseLeave` inline, or a tiny scoped CSS class in `globals.css` where the hover is trivial (e.g. `border-color` swap). Decide per-occurrence during implementation; prefer the CSS class approach for anything not touching dynamic per-item colors.

## Forward-looking hooks (not built now)

- `apps/api/README.md`: notes that an ASP.NET Core Web API project will live here, exposing endpoints matching the `lib/data/*.ts` interfaces (one controller/endpoint group per resource).
- `infra/README.md`: notes that a .NET Aspire AppHost project will orchestrate `apps/web` + `apps/api` for local dev, and a `docker-compose.yml` (or Aspire's own container support) will containerize both for deployment.
- No ports, connection strings, or API base URLs are hardcoded yet — `lib/data` functions take no arguments related to a backend, so introducing an API base URL later is additive.

## Verification plan

- `npm run build` (Next.js production build) and `tsc --noEmit` must pass cleanly.
- Manual pass: `npm run dev`, visit all 7 routes plus trigger auth modal, onboarding flow, and ⌘K palette, comparing against the rendered `FundOS.dc.html` mockup (opened directly, or via the earlier screenshot/read-through) for visual and behavioral parity.
- No unit/integration tests are written in this pass (see Non-goals).
