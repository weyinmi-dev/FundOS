# FundOS Next.js Port — Plan 1: Scaffold & Data Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the `apps/web` Next.js 15 project skeleton, the MobX store, and every `lib/data/*.ts` mock-data module, so Plans 2–6 (one per screen group) have a working shell, store contract, and data layer to build screens against.

**Architecture:** Next.js 15 App Router + TypeScript, no CSS framework (faithful inline-style port). One `FundOsStore` (MobX) holds UI/session state and computed derivations; `lib/data/*.ts` holds typed mock data + async accessors that later swap for real `fetch()` calls. `app/(dashboard)/layout.tsx` renders `AppShell` (sidebar + header) around every route. This plan ends with a placeholder home page so `next build` passes standalone — Plan 2 replaces that placeholder with the real Command Center screen.

**Tech Stack:** Next.js 15 (App Router, TypeScript), React 19, MobX + mobx-react-lite, next/font/google. No Tailwind, no test runner (see Non-goals in `docs/superpowers/specs/2026-07-28-fundos-nextjs-port-design.md` — this port's verification is `next build` / `tsc --noEmit` passing plus a manual visual check, not unit tests).

**Source of truth:** `docs/reference/FundOS.dc.html` (the mockup being ported) and `docs/superpowers/specs/2026-07-28-fundos-nextjs-port-design.md` (the design this plan implements). Every mock data literal below is copied verbatim from `FundOS.dc.html` lines 1130–1341.

---

## Contract for Plans 2–6

Plans 2–6 (Command Center/Digital Twin, Opportunity Discovery/Detail, Proposal Workspace, Awards/AI Orchestration/Relationships, Auth/Onboarding/Command Palette) all build on top of this plan. They must use these exact names — do not invent alternates:

**Design tokens** (declared once, on `AppShell`'s root `<div>`, consumed elsewhere as `var(--x)`):
```
--ink:#191b21 --muted:#6d7079 --faint:#9a9ca4 --line:#e7e4dd --paper:#f5f4f0 --panel:#ffffff
--accent:#1f9d63 --accent-dark:#16824f --tint:#e9f4ee --amber:#b1791b --amber-t:#f6efdf
--red:#bd4130 --red-t:#f7e8e4 --blue:#3567c0 --blue-t:#e6ecf8
--side:#15171c --side-2:#1c1f26 --side-line:#2a2e37 --side-dim:#8b909b --side-txt:#e8e9ec
```

**Fonts** — the mockup's literal `fontFamily:"'Space Grotesk'"` / `"'IBM Plex Sans'"` / `"'IBM Plex Mono'"` become CSS-variable references so `next/font/google` can supply them without a render-blocking `<link>`:
- `'Space Grotesk'` → `fontFamily:'var(--font-space-grotesk)'`
- `'IBM Plex Sans'` → `fontFamily:'var(--font-ibm-plex-sans)'`
- `'IBM Plex Mono'` → `fontFamily:'var(--font-ibm-plex-mono)'`

**Store** — `lib/store/FundOsStore.ts`, consumed via `useFundOsStore()` from `lib/store/StoreProvider.tsx`. Full field/action/computed list is in Task 15 below. Screen plans read `store.<computed>` and call `store.<action>(...)`; they must not add new raw observables without also updating this plan's contract (extend `renderVals()`-equivalent computeds on the store, not ad hoc component state, to keep the 1:1 port faithful).

**Routing owns `screen`** — there is no `store.screen`. Screens navigate with `useRouter().push('/path')` from Next's `next/navigation`, and read the active route with `usePathname()`. The mockup's `startProposal` (`screen:'proposal'`) becomes `router.push('/proposal')` called directly in the Opportunity Detail drawer component (Plan 3), not a store action.

**Data modules** — one file per resource under `lib/data/`, each exporting: (1) a TypeScript interface, (2) a mock constant array/object copied verbatim from the source, (3) an async accessor `getX()`. This plan creates all of them (Tasks 6–14).

---

## File Structure

```
fundos/                              (repo root — already exists)
  apps/
    web/                             Next.js 15 app — created this plan
      app/
        layout.tsx                   root layout: fonts, <html>/<body>, StoreProvider
        globals.css                  keyframes, scrollbar, box-sizing reset
        (dashboard)/
          layout.tsx                 renders AppShell around all 7 routes
          page.tsx                   placeholder home (Plan 2 replaces with Command Center)
      lib/
        store/
          FundOsStore.ts             MobX store: state + actions + computeds
          StoreProvider.tsx          React context provider + useFundOsStore() hook
        data/
          org.ts  nav.ts  kpis.ts  opportunities.ts  activity.ts  approvals.ts
          twin.ts  memory.ts  agents.ts  pipeline.ts  learning.ts  contacts.ts
          awards.ts  proposal.ts  versions.ts  interview.ts  scanning.ts
      components/
        shell/
          AppShell.tsx  Sidebar.tsx  Header.tsx
      package.json  tsconfig.json  next.config.mjs  .gitignore (apps/web-local, e.g. .next/)
    api/
      README.md                     placeholder for the future ASP.NET Core Web API
  infra/
    README.md                       placeholder for the future Aspire AppHost + docker-compose
  .gitignore                        root-level (node_modules, .next, etc.)
  README.md                         repo root readme
```

`lib/data/proposal.ts` is an addition beyond the module list in the design spec (`docs/superpowers/specs/2026-07-28-fundos-nextjs-port-design.md:76`) — that list didn't have a home for the Proposal Workspace's `SECTIONS`/`COMPLIANCE`/`CITATIONS` arrays, so this plan adds one module for them, following the same "one module per resource" pattern as the rest of the list.

---

## Task 1: Root scaffold — gitignore, READMEs

**Files:**
- Create: `.gitignore`
- Create: `README.md`
- Create: `apps/api/README.md`
- Create: `infra/README.md`

- [ ] **Step 1: Create the root `.gitignore`**

```gitignore
node_modules/
.next/
out/
.env*.local
*.tsbuildinfo
npm-debug.log*
.DS_Store
```

- [ ] **Step 2: Create the root `README.md`**

```markdown
# FundOS

FundOS is an AI operating system for nonprofit/startup fundraising — an AI team of 12 named
agents that discovers funding opportunities, drafts proposals, manages funder relationships,
and administers awards.

This repo is a Next.js port of the `docs/reference/FundOS.dc.html` mockup. See
`docs/superpowers/specs/2026-07-28-fundos-nextjs-port-design.md` for the design this port
follows, and `docs/superpowers/plans/` for the implementation plans.

## Layout

- `apps/web` — the Next.js 15 application (this pass)
- `apps/api` — placeholder for a future ASP.NET Core Web API
- `infra` — placeholder for a future .NET Aspire AppHost + docker-compose

## Running

```bash
cd apps/web
npm install
npm run dev
```
```

- [ ] **Step 3: Create `apps/api/README.md`**

```markdown
# apps/api (placeholder)

This will be an ASP.NET Core Web API project, added in a later pass, exposing endpoints
that match the TypeScript interfaces in `apps/web/lib/data/*.ts` (one controller/endpoint
group per resource: opportunities, agents, contacts, awards, activity, twin, etc.).

No code lives here yet. `apps/web/lib/data` functions take no arguments related to a
backend base URL, so wiring this API in later is additive, not a rewrite.
```

- [ ] **Step 4: Create `infra/README.md`**

```markdown
# infra (placeholder)

This will hold a .NET Aspire AppHost project orchestrating `apps/web` + `apps/api` for
local development, plus a `docker-compose.yml` (or Aspire's own container support) for
deployment. Added in a later pass, once `apps/api` exists.
```

- [ ] **Step 5: Commit**

```bash
git add .gitignore README.md apps/api/README.md infra/README.md
git commit -m "chore: add repo scaffold and placeholder READMEs"
```

---

## Task 2: `apps/web` project files

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/next.config.mjs`
- Create: `apps/web/next-env.d.ts`

- [ ] **Step 1: Create `apps/web/package.json`**

```json
{
  "name": "fundos-web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "mobx": "^6.13.0",
    "mobx-react-lite": "^4.0.7",
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.14.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.5.0"
  }
}
```

- [ ] **Step 2: Create `apps/web/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create `apps/web/next.config.mjs`**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;
```

- [ ] **Step 4: Create `apps/web/next-env.d.ts`**

```typescript
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/building-your-application/configuring/typescript
```

- [ ] **Step 5: Install dependencies**

Run: `cd apps/web && npm install`
Expected: installs without error, creates `apps/web/node_modules` and `apps/web/package-lock.json`.

- [ ] **Step 6: Commit**

```bash
git add apps/web/package.json apps/web/tsconfig.json apps/web/next.config.mjs apps/web/next-env.d.ts apps/web/package-lock.json
git commit -m "chore: scaffold apps/web Next.js project"
```

---

## Task 3: Global styles

**Files:**
- Create: `apps/web/app/globals.css`

- [ ] **Step 1: Create `apps/web/app/globals.css`**

Ported from `docs/reference/FundOS.dc.html:16-28` (the `<style>` block) — the parts inline
styles can't express: keyframes, the box-sizing reset, and the custom scrollbar.

```css
* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
}

@keyframes fos-reveal {
  from {
    opacity: 0;
    transform: translateY(9px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes fos-slide {
  from {
    opacity: 0;
    transform: translateX(26px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes fos-fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fos-pulse {
  0%,
  100% {
    opacity: 0.3;
  }
  50% {
    opacity: 1;
  }
}

@keyframes fos-scan {
  0% {
    top: -24%;
  }
  100% {
    top: 118%;
  }
}

@keyframes fos-spin {
  to {
    transform: rotate(360deg);
  }
}

::-webkit-scrollbar {
  width: 11px;
  height: 11px;
}

::-webkit-scrollbar-thumb {
  background: #d7d4cc;
  border-radius: 9px;
  border: 3px solid transparent;
  background-clip: padding-box;
}

::-webkit-scrollbar-thumb:hover {
  background: #c3bfb4;
  background-clip: padding-box;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/globals.css
git commit -m "feat: add global keyframes, reset, and scrollbar styles"
```

---

## Task 4: MobX store

**Files:**
- Create: `apps/web/lib/store/FundOsStore.ts`
- Create: `apps/web/lib/store/StoreProvider.tsx`

This store ports `state`, the action methods, and the `renderVals()` computed values from
`docs/reference/FundOS.dc.html:1130-1523`, minus the `screen` field (routing's job now) and
minus anything that closes over `this.setState` for navigation (component-level `router.push`
handles that instead — see the routing note in the Contract section above).

It imports data accessors from `lib/data/*` — those files don't exist until Tasks 6–14, so
this task's typecheck step is deferred to Task 14's Step 2. Write the store now; it's easiest
to get the full contract down in one place.

- [ ] **Step 1: Create `apps/web/lib/store/FundOsStore.ts`**

```typescript
import { makeAutoObservable, runInAction } from 'mobx';
import { getOrg, type Org } from '@/lib/data/org';
import { getNavItems, type NavItem } from '@/lib/data/nav';
import { getKpis, getAwayStats, type Kpi, type AwayStat } from '@/lib/data/kpis';
import { getOpportunities, type Opportunity } from '@/lib/data/opportunities';
import { getActivity, type ActivityEvent } from '@/lib/data/activity';
import { getApprovals, type ApprovalItem } from '@/lib/data/approvals';
import { getTwin, getEnriching, getSources, type TwinGroup, type EnrichingItem } from '@/lib/data/twin';
import { getMemory, type MemoryEntry } from '@/lib/data/memory';
import { getAgents, getHandoffs, type Agent, type Handoff } from '@/lib/data/agents';
import { getPipeline, type PipelineStage } from '@/lib/data/pipeline';
import { getLearn, getLearnStats, type LearnedPattern, type LearnStats } from '@/lib/data/learning';
import { getContacts, type Contact } from '@/lib/data/contacts';
import { getAwards, getCalendar, type AwardRecord, type CalendarItem } from '@/lib/data/awards';
import { getSections, getCompliance, getCitations, type ProposalSection, type ComplianceItem, type Citation } from '@/lib/data/proposal';
import { getVersions, type VersionEntry } from '@/lib/data/versions';
import { getInterview, type InterviewQuestion } from '@/lib/data/interview';
import { getScanning, getReadyStats, type ScanItem, type ReadyStat } from '@/lib/data/scanning';

type SortKey = 'value' | 'match' | 'deadline' | 'effort';
type AuthMode = 'signin' | 'signup';
type ExpandedMode = 'why' | 'review' | null;

const URGENCY_COLORS = {
  risk: { color: '#bd4130', tint: '#f7e8e4' },
  warn: { color: '#8a5e15', tint: '#f6efdf' },
  ok: { color: '#16824f', tint: '#e9f4ee' },
} as const;

const CONFIDENCE_COLORS: Record<'h' | 'm' | 'l', string> = { h: '#1f9d63', m: '#b1791b', l: '#c0392b' };
const STATUS_COLORS: Record<Agent['status'], string> = { working: '#1f9d63', waiting: '#b1791b', idle: '#9a9ca4' };
const WARMTH_COLORS: Record<Contact['warmth'], { wColor: string; wTint: string }> = {
  Hot: { wColor: '#bd4130', wTint: '#f7e8e4' },
  Warm: { wColor: '#8a5e15', wTint: '#f6efdf' },
  Cool: { wColor: '#3567c0', wTint: '#e6ecf8' },
};
const OBLIGATION_COLORS: Record<'due' | 'ok' | 'done', { color: string; icon: string }> = {
  due: { color: '#bd4130', icon: '!' },
  ok: { color: '#1f9d63', icon: '✓' },
  done: { color: '#9a9ca4', icon: '✓' },
};
const CALENDAR_COLORS: Record<CalendarItem['urgency'], string> = { risk: '#bd4130', warn: '#b1791b', ok: '#1f9d63' };
const SECTION_DOT: Record<ProposalSection['comp'], string> = { ok: '#1f9d63', warn: '#b1791b', todo: '#c9c6bd' };

const EUR_VALUE: Record<string, number> = { he: 2500000, doe: 3680000, bef: 460000, xp: 920000, gcf: 2940000, bar: 1750000, seq: 8000000, ang: 750000 };

const PROPOSAL_BODY: Record<string, [string, string]> = {
  Excellence: [
    "Verdantia combines a validated biochar process with a machine-learning MRV stack that measures soil carbon at roughly a tenth the cost of manual sampling.",
    'The consortium unites a Series-A operator, a leading soil-science faculty and a regional farmer cooperative, covering the full research-to-deployment chain.',
  ],
  Implementation: [
    'Work is organised into five work packages over 36 months, with field deployment beginning in month 6 across three countries.',
    'Each work package has a named partner lead and risk-adjusted milestones, keeping delivery accountable and auditable.',
  ],
  Budget: [
    'Total cost is EUR 2.5M, of which 71% is direct research and field operations and 12% is held as contingency.',
    'Personnel and MRV equipment are the two largest lines, and every figure reconciles to the audited consortium rates.',
  ],
  Consortium: [
    'Three EU member states are represented, satisfying the collaboration requirement of the call with room to spare.',
    'Each partner brings a distinct, non-overlapping capability, and letters of commitment are attached for all five.',
  ],
  'Ethics & Data': [
    'Farm-level data is processed under GDPR with explicit consent and full anonymisation in any published dataset.',
    'An open data-management plan and a gender-equality plan are being finalised ahead of submission.',
  ],
  Impact: ['', ''],
};

function deadlineStyle(deadline: string): { dColor: string; dTint: string } {
  if (deadline === 'Rolling') return { dColor: '#6d7079', dTint: '#f0efe9' };
  const days = parseInt(deadline, 10);
  if (days <= 14) return { dColor: '#bd4130', dTint: '#f7e8e4' };
  if (days <= 35) return { dColor: '#8a5e15', dTint: '#f6efdf' };
  return { dColor: '#16824f', dTint: '#e9f4ee' };
}

function parseDeadlineDays(deadline: string): number {
  return deadline === 'Rolling' ? 99999 : parseInt(deadline, 10);
}

function effortScoreOf(o: Opportunity): number {
  return o.factors.find((f) => /Effort/.test(f.label))?.pct ?? 0;
}

function sectionStatusLabel(pct: number): string {
  if (pct >= 100) return 'Complete';
  if (pct >= 70) return 'In progress';
  if (pct >= 40) return 'Drafting';
  return 'Outline';
}

const SECTION_AGO = ['just now', '4 min ago', '1 hr ago', '2 hrs ago', '3 hrs ago', 'yesterday'];

export class FundOsStore {
  ready = false;

  org: Org | null = null;
  navItems: NavItem[] = [];
  kpis: Kpi[] = [];
  awayStats: AwayStat[] = [];
  opportunities: Opportunity[] = [];
  activity: ActivityEvent[] = [];
  approvalsRaw: ApprovalItem[] = [];
  twin: TwinGroup[] = [];
  enriching: EnrichingItem[] = [];
  sources: string[] = [];
  memory: MemoryEntry[] = [];
  agents: Agent[] = [];
  handoffs: Handoff[] = [];
  pipeline: PipelineStage[] = [];
  learn: LearnedPattern[] = [];
  learnStats: LearnStats | null = null;
  contacts: Contact[] = [];
  awards: AwardRecord[] = [];
  calendar: CalendarItem[] = [];
  sections: ProposalSection[] = [];
  compliance: ComplianceItem[] = [];
  citations: Citation[] = [];
  versions: VersionEntry[] = [];
  interview: InterviewQuestion[] = [];
  scanning: ScanItem[] = [];
  readyStats: ReadyStat[] = [];

  authOpen = true;
  authMode: AuthMode = 'signup';
  onboardingOpen = true;
  onboardStep = 0;
  building = false;
  url = 'verdantia.earth';
  selectedOppId: string | null = null;
  proposalSection = 1;
  approvedIds: string[] = [];
  sortKey: SortKey = 'value';
  expandedId: string | null = null;
  expandedMode: ExpandedMode = null;
  cmdOpen = false;
  cmdQuery = '';
  interviewIdx = 0;
  interviewAns: Record<number, string> = {};
  showAlts = false;

  private buildTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  async init() {
    const [
      org, navItems, kpis, awayStats, opportunities, activity, approvalsRaw,
      twin, enriching, sources, memory, agents, handoffs, pipeline, learn, learnStats,
      contacts, awards, calendar, sections, compliance, citations, versions,
      interview, scanning, readyStats,
    ] = await Promise.all([
      getOrg(), getNavItems(), getKpis(), getAwayStats(), getOpportunities(), getActivity(), getApprovals(),
      getTwin(), getEnriching(), getSources(), getMemory(), getAgents(), getHandoffs(), getPipeline(), getLearn(), getLearnStats(),
      getContacts(), getAwards(), getCalendar(), getSections(), getCompliance(), getCitations(), getVersions(),
      getInterview(), getScanning(), getReadyStats(),
    ]);
    runInAction(() => {
      this.org = org; this.navItems = navItems; this.kpis = kpis; this.awayStats = awayStats;
      this.opportunities = opportunities; this.activity = activity; this.approvalsRaw = approvalsRaw;
      this.twin = twin; this.enriching = enriching; this.sources = sources; this.memory = memory;
      this.agents = agents; this.handoffs = handoffs; this.pipeline = pipeline; this.learn = learn; this.learnStats = learnStats;
      this.contacts = contacts; this.awards = awards; this.calendar = calendar;
      this.sections = sections; this.compliance = compliance; this.citations = citations; this.versions = versions;
      this.interview = interview; this.scanning = scanning; this.readyStats = readyStats;
      this.ready = true;
    });
  }

  // ── actions ──────────────────────────────────────────

  openOpp(id: string) {
    this.selectedOppId = id;
  }

  closeOpp() {
    this.selectedOppId = null;
  }

  approve(id: string) {
    this.approvedIds = [...this.approvedIds, id];
    this.expandedId = null;
    this.expandedMode = null;
  }

  toggleExpand(id: string, mode: 'why' | 'review') {
    if (this.expandedId === id && this.expandedMode === mode) {
      this.expandedId = null;
      this.expandedMode = null;
    } else {
      this.expandedId = id;
      this.expandedMode = mode;
    }
  }

  setSection(i: number) {
    this.proposalSection = i;
  }

  startBuild() {
    this.building = true;
    this.onboardStep = 1;
    clearTimeout(this.buildTimer);
    this.buildTimer = setTimeout(() => {
      runInAction(() => {
        this.onboardStep = 2;
        this.building = false;
      });
    }, 2900);
  }

  enterApp() {
    this.onboardingOpen = false;
  }

  setUrl(value: string) {
    this.url = value;
  }

  setSort(key: SortKey) {
    this.sortKey = key;
  }

  answerInterview(value: string) {
    const idx = this.interviewIdx;
    this.interviewAns = { ...this.interviewAns, [idx]: value };
    if (idx >= 2) {
      this.onboardStep = 3;
      this.interviewIdx = 0;
    } else {
      this.interviewIdx = idx + 1;
    }
  }

  skipInterview() {
    this.answerInterview('(let AI infer)');
  }

  toggleAlts() {
    this.showAlts = !this.showAlts;
  }

  setAuthMode(mode: AuthMode) {
    this.authMode = mode;
  }

  submitAuth() {
    this.authOpen = false;
    if (this.authMode === 'signin') this.onboardingOpen = false;
  }

  openCmd() {
    this.cmdOpen = true;
    this.cmdQuery = '';
  }

  closeCmd() {
    this.cmdOpen = false;
  }

  toggleCmd() {
    this.cmdOpen = !this.cmdOpen;
    this.cmdQuery = '';
  }

  setCmdQuery(value: string) {
    this.cmdQuery = value;
  }

  dispose() {
    clearTimeout(this.buildTimer);
  }

  // ── computed (1:1 with the mockup's renderVals()) ────

  get pendingApprovals() {
    return this.approvalsRaw
      .filter((a) => !this.approvedIds.includes(a.id))
      .map((a) => ({ ...a, ...URGENCY_COLORS[a.urgency], agentName: a.agent.split(' · ')[0] }));
  }

  get sortedOpportunities() {
    const enriched = this.opportunities.map((o) => ({
      ...o,
      ...deadlineStyle(o.deadline),
      eur: EUR_VALUE[o.id] ?? 0,
      days: parseDeadlineDays(o.deadline),
      effortScore: effortScoreOf(o),
    }));
    const cmp: Record<SortKey, (a: typeof enriched[number], b: typeof enriched[number]) => number> = {
      value: (a, b) => b.eur - a.eur,
      match: (a, b) => b.score - a.score,
      deadline: (a, b) => a.days - b.days,
      effort: (a, b) => b.effortScore - a.effortScore,
    };
    return [...enriched].sort(cmp[this.sortKey]);
  }

  get topOpportunities() {
    return [...this.sortedOpportunities].sort((a, b) => b.score - a.score).slice(0, 2);
  }

  get selectedOpportunity() {
    const opp = this.sortedOpportunities.find((o) => o.id === this.selectedOppId);
    if (!opp) return null;
    const kind = /Equity|Angel/.test(opp.type) ? 'equity' : /Debt/.test(opp.type) ? 'debt' : /Challenge/.test(opp.type) ? 'prize' : 'grant';
    const ctaLabel = { grant: 'Assemble proposal →', equity: 'Prepare pitch & data room →', debt: 'Prepare financing pack →', prize: 'Enter the challenge →' }[kind];
    const eligLabel = { grant: 'Eligibility', equity: 'Investment thesis', debt: 'Serviceability', prize: 'Eligibility' }[kind];
    return { ...opp, kind, isEquity: kind === 'equity', isDebt: kind === 'debt', ctaLabel, eligLabel, note: opp.note ?? {} };
  }

  get twinWithConfidence() {
    return this.twin.map((g) => ({ ...g, items: g.items.map((f) => ({ ...f, confColor: CONFIDENCE_COLORS[f.conf] })) }));
  }

  get agentsWithStatusColor() {
    return this.agents.map((a) => ({ ...a, statusColor: STATUS_COLORS[a.status] }));
  }

  get activeAgentsCount() {
    return this.agents.filter((a) => a.status === 'working').length;
  }

  get contactsWithWarmth() {
    return this.contacts.map((c) => ({ ...c, ...WARMTH_COLORS[c.warmth] }));
  }

  get proposalSectionsUi() {
    return this.sections.map((sec, i) => ({
      name: sec.name,
      pct: sec.pct,
      dot: SECTION_DOT[sec.comp],
      i,
      active: i === this.proposalSection,
      bg: i === this.proposalSection ? '#f2f1eb' : 'transparent',
      weight: i === this.proposalSection ? 600 : 500,
    }));
  }

  get currentSection() {
    const sec = this.sections[this.proposalSection];
    const body = PROPOSAL_BODY[sec.name] ?? ['', ''];
    return {
      num: this.proposalSection + 1,
      name: sec.name,
      pct: sec.pct,
      dot: SECTION_DOT[sec.comp],
      statusLabel: sectionStatusLabel(sec.pct),
      ago: SECTION_AGO[this.proposalSection] ?? 'recently',
      b0: body[0],
      b1: body[1],
    };
  }

  get isImpactSection() {
    return this.proposalSection === 1;
  }

  get awardsWithObligationColors() {
    return this.awards.map((w) => ({ ...w, obligations: w.obligations.map((o) => ({ ...o, ...OBLIGATION_COLORS[o.state] })) }));
  }

  get calendarWithColors() {
    return this.calendar.map((c) => ({ ...c, color: CALENDAR_COLORS[c.urgency] }));
  }

  get learnWithColors() {
    return this.learn.map((l) => ({ ...l, color: l.good ? '#16824f' : '#bd4130' }));
  }

  get pipelineWithColors() {
    const map = {
      done: { dotBg: '#1f9d63', dotBorder: '#1f9d63', dotFg: '#06130c', mark: '✓', line: '#2f7d55' },
      active: { dotBg: '#b1791b', dotBorder: '#d19a3a', dotFg: '#fff', mark: '●', line: '#2f7d55' },
      queued: { dotBg: 'rgba(255,255,255,.06)', dotBorder: 'rgba(255,255,255,.22)', dotFg: '#7fa891', mark: '', line: 'rgba(255,255,255,.14)' },
    } as const;
    return this.pipeline.map((p) => ({ ...p, ...map[p.state] }));
  }

  get currentInterviewQuestion() {
    return this.interview[this.interviewIdx] ?? this.interview[0];
  }

  get interviewNumber() {
    return this.interviewIdx + 1;
  }

  get interviewPercent() {
    return Math.round(((this.interviewIdx + 1) / 3) * 100);
  }

  get authTitle() {
    return this.authMode === 'signin' ? 'Welcome back.' : 'Hire your funding team.';
  }

  get authSub() {
    return this.authMode === 'signin' ? 'Your AI team kept working while you were gone.' : 'Create an account and the AI starts building your Digital Twin in minutes.';
  }

  get authCta() {
    return this.authMode === 'signin' ? 'Sign in' : 'Create account';
  }
}
```

- [ ] **Step 2: Create `apps/web/lib/store/StoreProvider.tsx`**

```tsx
'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { FundOsStore } from './FundOsStore';

const StoreContext = createContext<FundOsStore | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => new FundOsStore());

  useEffect(() => {
    store.init();
    return () => store.dispose();
  }, [store]);

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useFundOsStore(): FundOsStore {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useFundOsStore must be used within a StoreProvider');
  return store;
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/lib/store
git commit -m "feat: add FundOsStore and StoreProvider"
```

---

## Task 5: `org.ts`, `nav.ts`, `kpis.ts`

**Files:**
- Create: `apps/web/lib/data/org.ts`
- Create: `apps/web/lib/data/nav.ts`
- Create: `apps/web/lib/data/kpis.ts`

Data copied verbatim from `docs/reference/FundOS.dc.html:1132` (ORG), `:1134-1142` (NAV),
`:1144-1151` (KPIS, AWAY).

- [ ] **Step 1: Create `apps/web/lib/data/org.ts`**

```typescript
export interface Org {
  name: string;
  tag: string;
  mission: string;
  stage: string;
  sector: string;
  hq: string;
}

export const ORG: Org = {
  name: 'Verdantia',
  tag: 'Climate-tech · Soil carbon',
  mission:
    'Turning agricultural waste into permanent soil carbon and healthier farmland for smallholder farmers across East Africa.',
  stage: 'Series A',
  sector: 'Climate / AgTech',
  hq: 'Nairobi + Wageningen',
};

export async function getOrg(): Promise<Org> {
  return ORG;
}
```

- [ ] **Step 2: Create `apps/web/lib/data/nav.ts`**

```typescript
export interface NavItem {
  key: string;
  label: string;
  p1: string;
  p2?: string;
  badge?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { key: 'home', label: 'Command Center', p1: 'M3 10.5 12 3l9 7.5', p2: 'M5 9.5V21h14V9.5' },
  { key: 'twin', label: 'Digital Twin', p1: 'M12 3 3 8l9 5 9-5-9-5Z', p2: 'M3 13l9 5 9-5' },
  { key: 'opportunities', label: 'Opportunities', p1: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z', p2: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z', badge: '23' },
  { key: 'proposal', label: 'Proposals', p1: 'M7 3h7l4 4v14H7z', p2: 'M10 12h6M10 16h6M10 8h3' },
  { key: 'awards', label: 'Awards', p1: 'M12 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z', p2: 'M8.5 12.5 7 22l5-3 5 3-1.5-9.5' },
  { key: 'agents', label: 'AI Agents', p1: 'M7 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM7 16a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM17 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z', p2: 'M7 8v8M13 6H9M18 10a6 6 0 0 1-6 6' },
  { key: 'relationships', label: 'Relationships', p1: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z', p2: 'M2 20a7 7 0 0 1 14 0M16 4a3.5 3.5 0 0 1 0 7M22 20a6 6 0 0 0-6-6' },
];

export async function getNavItems(): Promise<NavItem[]> {
  return NAV_ITEMS;
}
```

Note for Plan 2 (Sidebar): the mockup keys nav items by a `screen` string (`home`, `twin`,
`opportunities`, `proposal`, `awards`, `agents`, `relationships`). The Sidebar component maps
`key` to a route path (`home` → `/`, everything else → `/${key}`) and compares against
`usePathname()` to decide active-item styling, per the design spec's routing section.

- [ ] **Step 3: Create `apps/web/lib/data/kpis.ts`**

```typescript
export interface Kpi {
  label: string;
  value: string;
  sub: string;
}

export interface AwayStat {
  n: string;
  l: string;
}

export const KPIS: Kpi[] = [
  { label: 'Pipeline value', value: '€14.7M', sub: 'across 23 live opportunities' },
  { label: 'Expected (weighted)', value: '€5.2M', sub: 'probability-adjusted' },
  { label: 'Active applications', value: '8', sub: '3 awaiting your input' },
  { label: 'Next deadline', value: '12d', sub: 'DOE Carbon Negative Shot' },
];

export const AWAY_STATS: AwayStat[] = [
  { n: '9', l: 'tasks completed' },
  { n: '3', l: 'new grants found' },
  { n: '2', l: 'drafts written' },
  { n: '1', l: 'application filed' },
];

export async function getKpis(): Promise<Kpi[]> {
  return KPIS;
}

export async function getAwayStats(): Promise<AwayStat[]> {
  return AWAY_STATS;
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/lib/data/org.ts apps/web/lib/data/nav.ts apps/web/lib/data/kpis.ts
git commit -m "feat: add org, nav, and kpi data modules"
```

---

## Task 6: `opportunities.ts`

**Files:**
- Create: `apps/web/lib/data/opportunities.ts`

Data copied verbatim from `docs/reference/FundOS.dc.html:1153-1188`.

- [ ] **Step 1: Create `apps/web/lib/data/opportunities.ts`**

```typescript
export interface OpportunityFactor {
  label: string;
  pct: number;
  note: string;
  color: string;
}

export interface OpportunityNote {
  checkSize?: string;
  stage?: string;
  ownership?: string;
  warm?: string;
  facility?: string;
  rate?: string;
  term?: string;
  security?: string;
}

export interface Opportunity {
  id: string;
  type: string;
  name: string;
  funder: string;
  amount: string;
  deadline: string;
  score: number;
  why: string;
  elig: string;
  effort: string;
  agents: string[];
  factors: OpportunityFactor[];
  note?: OpportunityNote;
}

export const OPPORTUNITIES: Opportunity[] = [
  {
    id: 'he', type: 'Gov · Grant', name: 'Horizon Europe — Soil Health Mission', funder: 'European Commission', amount: '€2.5M', deadline: '34 days', score: 94,
    why: "Your biochar field-trial data and Wageningen partnership map directly onto the Mission's regeneration KPIs. Two of three award criteria are already evidenced in your Digital Twin — the strongest strategic match in your pipeline.",
    elig: 'Eligible', effort: '~40 hrs · consortium of 3', agents: ['Quill · Writer', 'Ledger · Budget', 'Sentinel · Compliance'],
    factors: [
      { label: 'Win probability', pct: 78, note: '78% — strong', color: '#1f9d63' },
      { label: 'Strategic fit', pct: 96, note: 'Exceptional', color: '#1f9d63' },
      { label: 'Organization readiness', pct: 88, note: 'Evidence ready', color: '#1f9d63' },
      { label: 'Effort (inverse)', pct: 58, note: 'High · consortium', color: '#b1791b' },
      { label: 'Funding size', pct: 90, note: '€2.5M', color: '#1f9d63' },
      { label: 'Competition (inverse)', pct: 55, note: 'Strong field', color: '#b1791b' },
    ],
  },
  {
    id: 'doe', type: 'Gov · Grant', name: 'DOE Carbon Negative Shot', funder: 'U.S. Department of Energy', amount: '$4.0M', deadline: '12 days', score: 88,
    why: 'Filed via your U.S. subsidiary, this fits your MRV methodology precisely. Envoy has an LOI drafted and Sentinel has cleared compliance — the tight deadline is the only risk factor.',
    elig: 'Eligible via US subsidiary', effort: '~60 hrs · LOI first', agents: ['Envoy · Submission', 'Quill · Writer', 'Oracle · Risk'],
    factors: [
      { label: 'Win probability', pct: 74, note: '74%', color: '#1f9d63' },
      { label: 'Strategic fit', pct: 86, note: 'Strong', color: '#1f9d63' },
      { label: 'Organization readiness', pct: 72, note: 'LOI ready', color: '#1f9d63' },
      { label: 'Effort (inverse)', pct: 44, note: 'High', color: '#bd4130' },
      { label: 'Funding size', pct: 95, note: '$4.0M', color: '#1f9d63' },
      { label: 'Competition (inverse)', pct: 60, note: 'Moderate', color: '#b1791b' },
    ],
  },
  {
    id: 'bef', type: 'Philanthropic · Fellowship', name: 'Breakthrough Energy Fellows', funder: 'Breakthrough Energy', amount: '$500K', deadline: '21 days', score: 82,
    why: 'A warm intro is already logged by Atlas. The program favors deep-tech founders with field validation — your TRL 7 pilot and publication record are a natural fit.',
    elig: 'Eligible', effort: '~18 hrs · light', agents: ['Quill · Writer', 'Atlas · Relationships'],
    factors: [
      { label: 'Win probability', pct: 70, note: '70%', color: '#1f9d63' },
      { label: 'Strategic fit', pct: 84, note: 'Strong', color: '#1f9d63' },
      { label: 'Organization readiness', pct: 90, note: 'Ready', color: '#1f9d63' },
      { label: 'Effort (inverse)', pct: 82, note: 'Low', color: '#1f9d63' },
      { label: 'Funding size', pct: 52, note: '$500K', color: '#b1791b' },
      { label: 'Competition (inverse)', pct: 48, note: 'Very competitive', color: '#bd4130' },
    ],
  },
  {
    id: 'xp', type: 'Challenge · Prize', name: 'XPRIZE Carbon Removal', funder: 'XPRIZE Foundation', amount: '$1.0M', deadline: '47 days', score: 79,
    why: "Non-dilutive prize capital that rewards exactly your measurable-removal thesis. Effort is moderate and there's no eligibility barrier — a high-upside, low-downside entry.",
    elig: 'Eligible', effort: '~30 hrs', agents: ['Quill · Writer', 'Oracle · Risk'],
    factors: [
      { label: 'Win probability', pct: 58, note: '58%', color: '#b1791b' },
      { label: 'Strategic fit', pct: 88, note: 'Strong', color: '#1f9d63' },
      { label: 'Organization readiness', pct: 80, note: 'Ready', color: '#1f9d63' },
      { label: 'Effort (inverse)', pct: 66, note: 'Moderate', color: '#b1791b' },
      { label: 'Funding size', pct: 70, note: '$1.0M', color: '#1f9d63' },
      { label: 'Competition (inverse)', pct: 40, note: 'Global field', color: '#bd4130' },
    ],
  },
  {
    id: 'gcf', type: 'International · Grant', name: 'Green Climate Fund — SAP', funder: 'Green Climate Fund', amount: '$3.2M', deadline: '68 days', score: 73,
    why: 'Large-ticket climate finance aligned to your geographies. Sage learned from a prior GCF decline that vague MRV hurt you — the updated playbook addresses it directly.',
    elig: 'Needs accredited entity', effort: '~80 hrs · partner-led', agents: ['Atlas · Relationships', 'Ledger · Budget', 'Sentinel · Compliance'],
    factors: [
      { label: 'Win probability', pct: 52, note: '52%', color: '#b1791b' },
      { label: 'Strategic fit', pct: 78, note: 'Good', color: '#1f9d63' },
      { label: 'Organization readiness', pct: 60, note: 'Partner needed', color: '#b1791b' },
      { label: 'Effort (inverse)', pct: 34, note: 'Very high', color: '#bd4130' },
      { label: 'Funding size', pct: 92, note: '$3.2M', color: '#1f9d63' },
      { label: 'Competition (inverse)', pct: 64, note: 'Moderate', color: '#b1791b' },
    ],
  },
  {
    id: 'bar', type: 'Debt · Loan', name: 'Barclays Sustainable Growth', funder: 'Barclays', amount: '£1.5M', deadline: 'Rolling', score: 64,
    why: 'Working-capital debt to bridge grant disbursement cycles. Ledger flags this only as a liquidity backstop, not a primary route — kept ranked for completeness.',
    elig: 'Eligible', effort: '~12 hrs', agents: ['Ledger · Budget', 'Oracle · Risk'],
    factors: [
      { label: 'Win probability', pct: 80, note: '80%', color: '#1f9d63' },
      { label: 'Strategic fit', pct: 44, note: 'Backstop only', color: '#bd4130' },
      { label: 'Organization readiness', pct: 76, note: 'Ready', color: '#1f9d63' },
      { label: 'Effort (inverse)', pct: 88, note: 'Low', color: '#1f9d63' },
      { label: 'Funding size', pct: 58, note: '£1.5M', color: '#b1791b' },
      { label: 'Competition (inverse)', pct: 82, note: 'Low', color: '#1f9d63' },
    ],
    note: { facility: 'Working-capital line', rate: '~7.5% APR', term: '36 months', security: 'Grant receivables' },
  },
  {
    id: 'seq', type: 'Equity · Series B', name: 'Aster Ventures — Climate Fund III', funder: 'Aster Ventures', amount: '€8.0M', deadline: 'Rolling', score: 76,
    why: "Aster's Fund III thesis targets MRV-enabled carbon removal at exactly your stage. Atlas has a warm path via a portfolio founder, and your ARR growth clears their traction bar — the strongest equity fit in the market right now.",
    elig: 'Thesis fit: strong', effort: 'Data room + 3 meetings', agents: ['Atlas · Relationships', 'Ledger · Financials', 'Oracle · Risk'],
    note: { checkSize: '€6–10M lead', stage: 'Series B', ownership: '15–20% target', warm: '2-hop intro via Aster portfolio' },
    factors: [
      { label: 'Thesis fit', pct: 88, note: 'Strong', color: '#1f9d63' },
      { label: 'Traction vs bar', pct: 74, note: 'Above bar', color: '#1f9d63' },
      { label: 'Warm path', pct: 80, note: '2-hop intro', color: '#1f9d63' },
      { label: 'Dilution (inverse)', pct: 52, note: '15–20%', color: '#b1791b' },
      { label: 'Check size', pct: 95, note: '€8.0M', color: '#1f9d63' },
      { label: 'Round heat (inverse)', pct: 58, note: 'Competitive', color: '#b1791b' },
    ],
  },
  {
    id: 'ang', type: 'Angel · Syndicate', name: 'Regenerative Capital Angels', funder: 'RegenCap Syndicate', amount: '€750K', deadline: 'Rolling', score: 69,
    why: 'A climate-focused angel syndicate that co-invests alongside grants. Useful to extend runway between disbursement cycles without a heavy dilution hit — Ledger models it as a clean bridge.',
    elig: 'Thesis fit: good', effort: 'Deck + 1 pitch', agents: ['Atlas · Relationships', 'Ledger · Financials'],
    note: { checkSize: '€250–750K', stage: 'Bridge', ownership: '5–8% target', warm: 'Direct application open' },
    factors: [
      { label: 'Thesis fit', pct: 80, note: 'Good', color: '#1f9d63' },
      { label: 'Traction vs bar', pct: 78, note: 'Clears', color: '#1f9d63' },
      { label: 'Warm path', pct: 60, note: 'Direct', color: '#b1791b' },
      { label: 'Dilution (inverse)', pct: 74, note: '5–8%', color: '#1f9d63' },
      { label: 'Check size', pct: 50, note: '€750K', color: '#b1791b' },
      { label: 'Round heat (inverse)', pct: 66, note: 'Moderate', color: '#b1791b' },
    ],
  },
];

export async function getOpportunities(): Promise<Opportunity[]> {
  return OPPORTUNITIES;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/lib/data/opportunities.ts
git commit -m "feat: add opportunities data module"
```

---

## Task 7: `activity.ts`, `approvals.ts`

**Files:**
- Create: `apps/web/lib/data/activity.ts`
- Create: `apps/web/lib/data/approvals.ts`

Data copied verbatim from `docs/reference/FundOS.dc.html:1190-1215`.

- [ ] **Step 1: Create `apps/web/lib/data/activity.ts`**

```typescript
export interface ActivityEvent {
  time: string;
  agent: string;
  text: string;
}

export const ACTIVITY: ActivityEvent[] = [
  { time: '07:12', agent: 'Scout · Discovery', text: 'Found 3 new grants matching soil-carbon (€6.2M combined) across EU and US databases.' },
  { time: '06:40', agent: 'Sentinel · Compliance', text: 'Flagged a missing ISO 14064 attachment on 2 opportunities and drafted the request.' },
  { time: '05:55', agent: 'Quill · Writer', text: 'Drafted the Impact narrative for Horizon Europe — awaiting your review.' },
  { time: '04:30', agent: 'Ledger · Budget', text: 'Rebuilt the 3-year budget after your headcount update; contingency held at 12%.' },
  { time: '02:10', agent: 'Atlas · Relationships', text: 'Logged a warm intro from a Breakthrough Energy scout and drafted a reply.' },
  { time: 'Yest.', agent: 'Sage · Learning', text: 'Learned reviewers penalised vague MRV language — updated the proposal playbook.' },
];

export async function getActivity(): Promise<ActivityEvent[]> {
  return ACTIVITY;
}
```

- [ ] **Step 2: Create `apps/web/lib/data/approvals.ts`**

```typescript
export interface ApprovalItem {
  id: string;
  tag: string;
  urgency: 'risk' | 'warn' | 'ok';
  agent: string;
  title: string;
  detail: string;
  whyText: string;
  evidence: string[];
  declineText: string;
  reviewTitle: string;
  reviewLines: string[];
}

export const APPROVALS: ApprovalItem[] = [
  {
    id: 'a1', tag: 'Deadline · 12d', urgency: 'risk', agent: 'Envoy · Submission', title: 'File Letter of Intent — DOE Carbon Negative Shot', detail: '$4.0M · LOI drafted, compliance cleared, budget attached.',
    whyText: 'The DOE window closes in 12 days and Oracle models an 18% win-probability penalty for late-cycle submissions. Everything downstream is already prepared, so filing now costs you nothing and protects the strongest US opportunity in your pipeline.',
    evidence: ['LOI drafted & self-reviewed', 'Compliance cleared', 'Budget within ceiling'],
    declineText: 'Envoy holds the LOI and re-surfaces it in 3 days — but you forfeit the early-review advantage.',
    reviewTitle: 'Draft — Letter of Intent',
    reviewLines: [
      'To: DOE Office of Clean Energy Demonstrations',
      'Re: Carbon Negative Shot — Verdantia Ltd.',
      '',
      'Verdantia intends to submit a full application for a $4.0M award to scale ML-verified soil-carbon removal across 18,000 hectares...',
      '',
      'Requested: $4.0M over 36 months  ·  Cost share: 22%',
    ],
  },
  {
    id: 'a2', tag: 'Budget change', urgency: 'warn', agent: 'Ledger · Budget', title: 'Approve €48,000 reallocation to MRV equipment', detail: 'Horizon Europe · keeps 12% contingency, strengthens Impact score.',
    whyText: 'Reviewers on this call weight measurement rigor heavily. Ledger models that moving EUR 48k into MRV equipment lifts the predicted Impact score by ~4 points while total cost and the 12% contingency are unchanged.',
    evidence: ['Total held at €2.5M', 'Contingency stays 12%', '+4 predicted Impact pts'],
    declineText: 'The original budget stands; the predicted reviewer score remains at 79.',
    reviewTitle: 'Budget change — before → after',
    reviewLines: [
      'Travel & dissemination   €120,000 → €72,000',
      'MRV equipment            €210,000 → €258,000',
      'Contingency              €300,000 → €300,000 (12%)',
      'Total                    €2,500,000 (unchanged)',
    ],
  },
  {
    id: 'a3', tag: 'Relationship', urgency: 'ok', agent: 'Atlas · Relationships', title: 'Send intro reply to the Wageningen co-PI', detail: 'Warm lead · reply drafted in your voice, ready to send.',
    whyText: 'Atlas rates this a hot lead: the co-PI replied within a day and the consortium slot is time-sensitive. Warm threads answered inside 24 hours convert to signed partnerships 2.3x more often.',
    evidence: ['Warm reply in 24h', 'Draft matches your voice', 'Fits Horizon consortium'],
    declineText: 'The thread goes cold; Atlas will nudge you again in 2 days.',
    reviewTitle: 'Draft reply — to Prof. J. Klaassen',
    reviewLines: [
      'Hi Jan,',
      '',
      'Great to hear from you — yes, we would be glad to have Wageningen lead the MRV work package. I will send the draft consortium agreement today and propose a call Thursday.',
      '',
      'Best, Maya',
    ],
  },
];

export async function getApprovals(): Promise<ApprovalItem[]> {
  return APPROVALS;
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/lib/data/activity.ts apps/web/lib/data/approvals.ts
git commit -m "feat: add activity and approvals data modules"
```

---

## Task 8: `twin.ts`, `memory.ts`

**Files:**
- Create: `apps/web/lib/data/twin.ts`
- Create: `apps/web/lib/data/memory.ts`

Data copied verbatim from `docs/reference/FundOS.dc.html:1217-1232` (TWIN, ENRICHING, SOURCES)
and `:1329-1334` (MEMORY).

- [ ] **Step 1: Create `apps/web/lib/data/twin.ts`**

```typescript
export interface TwinField {
  label: string;
  value: string;
  conf: 'h' | 'm' | 'l';
  source: string;
}

export interface TwinGroup {
  group: string;
  items: TwinField[];
}

export interface EnrichingItem {
  icon: string;
  color: string;
  title: string;
  src: string;
}

export const TWIN: TwinGroup[] = [
  { group: 'Identity', items: [
    { label: 'Sector', value: 'Climate / AgTech', conf: 'h', source: 'verified' },
    { label: 'HQ', value: 'Nairobi + Wageningen', conf: 'h', source: 'verified' },
    { label: 'Founded', value: '2021', conf: 'h', source: 'Crunchbase' },
    { label: 'Growth stage', value: 'Series A', conf: 'h', source: 'from deck' },
  ]},
  { group: 'Financials', items: [
    { label: 'Revenue', value: 'ARR €1.9M', conf: 'm', source: 'from deck' },
    { label: 'Total raised', value: '€6.4M', conf: 'h', source: 'Crunchbase' },
    { label: 'Runway', value: '19 months', conf: 'm', source: 'inferred' },
    { label: 'Grants won', value: '€2.1M (4)', conf: 'h', source: 'verified' },
  ]},
  { group: 'Innovation', items: [
    { label: 'Patents', value: '2 granted · 1 pending', conf: 'h', source: 'patent office' },
    { label: 'Publications', value: '11 peer-reviewed', conf: 'h', source: 'Scholar' },
    { label: 'Maturity', value: 'TRL 7 — pilot', conf: 'm', source: 'inferred' },
    { label: 'R&D focus', value: 'Biochar MRV, ML', conf: 'h', source: 'website' },
  ]},
  { group: 'Credentials', items: [
    { label: 'Certifications', value: 'ISO 14064 · B-Corp', conf: 'h', source: 'verified' },
    { label: 'SDG alignment', value: '2 · 13 · 15', conf: 'h', source: 'derived' },
    { label: 'Carbon standard', value: 'Verra VM0042', conf: 'l', source: 'in progress' },
    { label: 'Impact metric', value: '42kt CO₂e / yr', conf: 'm', source: 'from deck' },
  ]},
  { group: 'Team', items: [
    { label: 'Headcount', value: '34', conf: 'h', source: 'LinkedIn' },
    { label: 'PhDs', value: '7', conf: 'h', source: 'LinkedIn' },
    { label: 'Expertise', value: 'Soil science, MRV', conf: 'h', source: 'derived' },
    { label: 'Advisors', value: '3 (ex-CGIAR)', conf: 'm', source: 'website' },
  ]},
  { group: 'Footprint', items: [
    { label: 'Operating in', value: 'KE · RW · NL', conf: 'h', source: 'website' },
    { label: 'Farmers enrolled', value: '4,200', conf: 'h', source: 'from deck' },
    { label: 'Land under mgmt', value: '18,000 ha', conf: 'h', source: 'from deck' },
    { label: 'Partners', value: 'Wageningen +5', conf: 'h', source: 'verified' },
  ]},
];

export const ENRICHING: EnrichingItem[] = [
  { icon: '↻', color: '#1f9d63', title: 'Parsing 2024 audited accounts', src: 'from uploaded PDF · 60%' },
  { icon: '↻', color: '#1f9d63', title: 'Cross-checking patent citations', src: 'Google Patents' },
  { icon: '?', color: '#b1791b', title: 'Confirming Verra VM0042 status', src: 'needs your input' },
  { icon: '✓', color: '#9a9ca4', title: 'Mapped SDG alignment', src: 'completed 2h ago' },
];

export const SOURCES: string[] = ['Website', 'Pitch deck', 'Crunchbase', 'Patents', 'Scholar', 'LinkedIn'];

export async function getTwin(): Promise<TwinGroup[]> {
  return TWIN;
}

export async function getEnriching(): Promise<EnrichingItem[]> {
  return ENRICHING;
}

export async function getSources(): Promise<string[]> {
  return SOURCES;
}
```

- [ ] **Step 2: Create `apps/web/lib/data/memory.ts`**

```typescript
export interface MemoryEntry {
  t: string;
  ago: string;
}

export const MEMORY: MemoryEntry[] = [
  { t: 'Recorded your €6.4M Series A close', ago: 'today' },
  { t: 'Added 2 newly granted patents', ago: '2 days ago' },
  { t: 'Noted the Wageningen partnership renewal', ago: '1 week ago' },
  { t: 'Updated headcount 28 → 34', ago: '2 weeks ago' },
];

export async function getMemory(): Promise<MemoryEntry[]> {
  return MEMORY;
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/lib/data/twin.ts apps/web/lib/data/memory.ts
git commit -m "feat: add twin and memory data modules"
```

---

## Task 9: `agents.ts`, `pipeline.ts`, `learning.ts`

**Files:**
- Create: `apps/web/lib/data/agents.ts`
- Create: `apps/web/lib/data/pipeline.ts`
- Create: `apps/web/lib/data/learning.ts`

Data copied verbatim from `docs/reference/FundOS.dc.html:1234-1255` (AGENTS, HANDOFFS),
`:1319-1328` (PIPELINE), `:1313-1318` (LEARN, LEARNSTATS).

- [ ] **Step 1: Create `apps/web/lib/data/agents.ts`**

```typescript
export interface Agent {
  name: string;
  role: string;
  status: 'working' | 'waiting' | 'idle';
  task: string;
  handoff: string;
}

export interface Handoff {
  from: string;
  to: string;
  what: string;
}

export const AGENTS: Agent[] = [
  { name: 'Scout', role: 'Opportunity Discovery', status: 'working', task: 'Scanning 41 new calls across 6 funding databases.', handoff: 'Gatekeeper' },
  { name: 'Gatekeeper', role: 'Eligibility Analysis', status: 'working', task: 'Screening DOE Carbon Shot criteria against the twin.', handoff: 'Compass' },
  { name: 'Compass', role: 'Strategic Fit', status: 'idle', task: 'Ranked 23 live opportunities by expected value.', handoff: 'You' },
  { name: 'Quill', role: 'Proposal Writing', status: 'working', task: 'Drafting the Impact section for Horizon Europe.', handoff: 'Ledger' },
  { name: 'Ledger', role: 'Budget Planning', status: 'waiting', task: 'Awaiting your approval on the €48k reallocation.', handoff: 'Quill' },
  { name: 'Archivist', role: 'Document Collection', status: 'working', task: 'Gathering ISO cert + audited accounts.', handoff: 'Sentinel' },
  { name: 'Sentinel', role: 'Compliance Review', status: 'idle', task: 'Cleared 3 of 4 Horizon Europe annexes.', handoff: 'Quill' },
  { name: 'Oracle', role: 'Risk Analysis', status: 'working', task: 'Modelling co-funding exposure across the pipeline.', handoff: 'You' },
  { name: 'Envoy', role: 'Submission', status: 'waiting', task: 'LOI ready to file the moment you approve.', handoff: 'Echo' },
  { name: 'Echo', role: 'Follow-up', status: 'working', task: 'Tracking 5 submitted applications for updates.', handoff: 'Atlas' },
  { name: 'Atlas', role: 'Relationship Intel', status: 'working', task: 'Mapping Green Climate Fund program officers.', handoff: 'Envoy' },
  { name: 'Sage', role: 'Learning', status: 'working', task: 'Analysing why the last GCF LOI was declined.', handoff: 'All agents' },
];

export const HANDOFFS: Handoff[] = [
  { from: 'Scout', to: 'Gatekeeper', what: '3 fresh soil-carbon grants for eligibility screening' },
  { from: 'Gatekeeper', to: 'Compass', what: 'DOE Carbon Shot cleared — ready to rank' },
  { from: 'Quill', to: 'Ledger', what: 'Impact draft needs budget figures for cost-benefit' },
  { from: 'Sage', to: 'Quill', what: 'Playbook update: lead Impact with MRV evidence' },
  { from: 'Atlas', to: 'Envoy', what: 'Warm GCF officer contact — schedule outreach' },
];

export async function getAgents(): Promise<Agent[]> {
  return AGENTS;
}

export async function getHandoffs(): Promise<Handoff[]> {
  return HANDOFFS;
}
```

- [ ] **Step 2: Create `apps/web/lib/data/pipeline.ts`**

```typescript
export interface PipelineStage {
  stage: string;
  agent: string;
  state: 'done' | 'active' | 'queued';
}

export const PIPELINE: PipelineStage[] = [
  { stage: 'Discovered', agent: 'Scout', state: 'done' },
  { stage: 'Eligibility', agent: 'Gatekeeper', state: 'done' },
  { stage: 'Strategy', agent: 'Compass', state: 'done' },
  { stage: 'Writing', agent: 'Quill', state: 'active' },
  { stage: 'Budget', agent: 'Ledger', state: 'active' },
  { stage: 'Documents', agent: 'Archivist', state: 'active' },
  { stage: 'Compliance', agent: 'Sentinel', state: 'queued' },
  { stage: 'Submission', agent: 'Envoy', state: 'queued' },
];

export async function getPipeline(): Promise<PipelineStage[]> {
  return PIPELINE;
}
```

- [ ] **Step 3: Create `apps/web/lib/data/learning.ts`**

```typescript
export interface LearnedPattern {
  pattern: string;
  effect: string;
  good: boolean;
  action: string;
}

export interface LearnStats {
  winRate: string;
  trend: string;
}

export const LEARN: LearnedPattern[] = [
  { pattern: 'Proposals that open with quantified MRV field data', effect: 'won 4 of 5', good: true, action: 'Quill now leads every Impact section with trial numbers' },
  { pattern: 'GCF applications without an accredited entity partner', effect: '0 of 2 · declined', good: false, action: 'Gatekeeper flags accreditation before pursuit' },
  { pattern: 'DOE submissions filed in the final week', effect: '-18% win rate', good: false, action: 'Envoy now prioritises early filing on all US calls' },
];

export const LEARN_STATS: LearnStats = { winRate: '38%', trend: '+11 pts YoY' };

export async function getLearn(): Promise<LearnedPattern[]> {
  return LEARN;
}

export async function getLearnStats(): Promise<LearnStats> {
  return LEARN_STATS;
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/lib/data/agents.ts apps/web/lib/data/pipeline.ts apps/web/lib/data/learning.ts
git commit -m "feat: add agents, pipeline, and learning data modules"
```

---

## Task 10: `contacts.ts`, `awards.ts`

**Files:**
- Create: `apps/web/lib/data/contacts.ts`
- Create: `apps/web/lib/data/awards.ts`

Data copied verbatim from `docs/reference/FundOS.dc.html:1257-1263` (CONTACTS),
`:1301-1312` (AWARDS, CALENDAR).

- [ ] **Step 1: Create `apps/web/lib/data/contacts.ts`**

```typescript
export interface Contact {
  name: string;
  role: string;
  org: string;
  warmth: 'Hot' | 'Warm' | 'Cool';
  last: string;
  next: string;
}

export const CONTACTS: Contact[] = [
  { name: 'Dr. Lena Voss', role: 'Program Officer', org: 'European Commission', warmth: 'Warm', last: '6 days ago', next: 'Atlas: send trial-data brief' },
  { name: 'Marcus Bell', role: 'Investment Lead', org: 'Breakthrough Energy', warmth: 'Hot', last: '2 days ago', next: 'Reply to intro — draft ready' },
  { name: 'Amara Okoye', role: 'Regional Director', org: 'Green Climate Fund', warmth: 'Cool', last: '5 weeks ago', next: 'Atlas: re-engage via partner' },
  { name: 'Prof. J. Klaassen', role: 'Co-PI', org: 'Wageningen University', warmth: 'Hot', last: 'yesterday', next: 'Confirm consortium role' },
  { name: 'Sofia Reyes', role: 'Grants Manager', org: 'XPRIZE Foundation', warmth: 'Warm', last: '11 days ago', next: 'Register team for milestone' },
];

export async function getContacts(): Promise<Contact[]> {
  return CONTACTS;
}
```

- [ ] **Step 2: Create `apps/web/lib/data/awards.ts`**

```typescript
export interface Obligation {
  t: string;
  due: string;
  state: 'due' | 'ok' | 'done';
}

export interface AwardRecord {
  id: string;
  name: string;
  funder: string;
  amount: string;
  status: string;
  disbursed: number;
  milestone: string;
  nextReport: string;
  obligations: Obligation[];
}

export interface CalendarItem {
  what: string;
  award: string;
  when: string;
  urgency: 'risk' | 'warn' | 'ok';
}

export const AWARDS: AwardRecord[] = [
  {
    id: 'w1', name: 'Innovate UK Smart Grant', funder: 'Innovate UK', amount: '£1.1M', status: 'Active', disbursed: 64, milestone: 'WP3 field deployment — 72%', nextReport: 'Q3 financial report · in 18 days',
    obligations: [
      { t: 'Quarterly financial report', due: '18 days', state: 'due' },
      { t: 'Annual impact audit', due: '4 months', state: 'ok' },
      { t: 'IP disclosure', due: 'filed', state: 'done' },
    ],
  },
  {
    id: 'w2', name: 'GCF Readiness Grant', funder: 'Green Climate Fund', amount: '$800K', status: 'Active', disbursed: 38, milestone: 'Baseline MRV dataset — 45%', nextReport: 'Interim narrative · in 41 days',
    obligations: [
      { t: 'Procurement compliance check', due: '12 days', state: 'due' },
      { t: 'Interim narrative report', due: '41 days', state: 'ok' },
      { t: 'Safeguards screening', due: 'cleared', state: 'done' },
    ],
  },
];

export const CALENDAR: CalendarItem[] = [
  { what: 'GCF procurement compliance check', award: 'GCF Readiness', when: 'in 12 days', urgency: 'risk' },
  { what: 'Innovate UK Q3 financial report', award: 'Innovate UK Smart', when: 'in 18 days', urgency: 'warn' },
  { what: 'GCF interim narrative report', award: 'GCF Readiness', when: 'in 41 days', urgency: 'ok' },
  { what: 'Innovate UK annual impact audit', award: 'Innovate UK Smart', when: 'in 4 months', urgency: 'ok' },
];

export async function getAwards(): Promise<AwardRecord[]> {
  return AWARDS;
}

export async function getCalendar(): Promise<CalendarItem[]> {
  return CALENDAR;
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/lib/data/contacts.ts apps/web/lib/data/awards.ts
git commit -m "feat: add contacts and awards data modules"
```

---

## Task 11: `proposal.ts`, `versions.ts`

**Files:**
- Create: `apps/web/lib/data/proposal.ts`
- Create: `apps/web/lib/data/versions.ts`

Data copied verbatim from `docs/reference/FundOS.dc.html:1265-1272` (SECTIONS),
`:1274-1279` (COMPLIANCE), `:1281-1284` (CITATIONS), `:1335-1340` (VERSIONS).

- [ ] **Step 1: Create `apps/web/lib/data/proposal.ts`**

```typescript
export interface ProposalSection {
  name: string;
  pct: number;
  comp: 'ok' | 'warn' | 'todo';
}

export interface ComplianceItem {
  icon: string;
  color: string;
  text: string;
  textColor: string;
}

export interface Citation {
  claim: string;
  source: string;
  color: string;
}

export const SECTIONS: ProposalSection[] = [
  { name: 'Excellence', pct: 100, comp: 'ok' },
  { name: 'Impact', pct: 72, comp: 'warn' },
  { name: 'Implementation', pct: 40, comp: 'todo' },
  { name: 'Budget', pct: 85, comp: 'ok' },
  { name: 'Consortium', pct: 90, comp: 'ok' },
  { name: 'Ethics & Data', pct: 15, comp: 'todo' },
];

export const COMPLIANCE: ComplianceItem[] = [
  { icon: '✓', color: '#1f9d63', text: 'Page limit — 9 of 10 pages used', textColor: '#191b21' },
  { icon: '!', color: '#b1791b', text: 'Gender Equality Plan not yet attached', textColor: '#7a520f' },
  { icon: '✓', color: '#1f9d63', text: 'Budget within call ceiling (€2.5M)', textColor: '#191b21' },
  { icon: '✓', color: '#1f9d63', text: 'Consortium spans ≥3 EU member states', textColor: '#191b21' },
];

export const CITATIONS: Citation[] = [
  { claim: '"40% average yield uplift in Kisumu trials"', source: 'Verdantia field report 2024, p.12 — verified', color: '#1f9d63' },
  { claim: '"Permanent carbon storage exceeding 100 years"', source: 'Needs a peer-reviewed citation', color: '#b1791b' },
];

export async function getSections(): Promise<ProposalSection[]> {
  return SECTIONS;
}

export async function getCompliance(): Promise<ComplianceItem[]> {
  return COMPLIANCE;
}

export async function getCitations(): Promise<Citation[]> {
  return CITATIONS;
}
```

- [ ] **Step 2: Create `apps/web/lib/data/versions.ts`**

```typescript
export interface VersionEntry {
  label: string;
  when: string;
  color: string;
}

export const VERSIONS: VersionEntry[] = [
  { label: 'Quill draft v3 — Impact', when: '4 min ago', color: '#1f9d63' },
  { label: 'Your edit — trimmed intro', when: '2 hrs ago', color: '#3567c0' },
  { label: 'Sage playbook applied', when: 'yesterday', color: '#b1791b' },
  { label: 'Quill draft v1', when: '2 days ago', color: '#c9c6bd' },
];

export async function getVersions(): Promise<VersionEntry[]> {
  return VERSIONS;
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/lib/data/proposal.ts apps/web/lib/data/versions.ts
git commit -m "feat: add proposal and versions data modules"
```

---

## Task 12: `interview.ts`, `scanning.ts`

**Files:**
- Create: `apps/web/lib/data/interview.ts`
- Create: `apps/web/lib/data/scanning.ts`

Data copied verbatim from `docs/reference/FundOS.dc.html:1296-1300` (INTERVIEW),
`:1286-1294` (SCANNING, READY).

- [ ] **Step 1: Create `apps/web/lib/data/interview.ts`**

```typescript
export interface InterviewQuestion {
  q: string;
  chips: string[];
}

export const INTERVIEW: InterviewQuestion[] = [
  { q: 'We could not confirm your Verra VM0042 status. Where are you?', chips: ['In validation', 'Registered', 'Not started'] },
  { q: 'What is your primary funding goal for the next 12 months?', chips: ['Scale field pilots', 'Fund core R&D', 'Working capital', 'Enter new markets'] },
  { q: 'Any regions you must prioritise or avoid?', chips: ['EU priority', 'Africa priority', 'US expansion', 'No preference'] },
];

export async function getInterview(): Promise<InterviewQuestion[]> {
  return INTERVIEW;
}
```

- [ ] **Step 2: Create `apps/web/lib/data/scanning.ts`**

```typescript
export interface ScanItem {
  text: string;
  src: string;
  delay: string;
}

export interface ReadyStat {
  n: string;
  l: string;
}

export const SCANNING: ScanItem[] = [
  { text: 'Mission, sector & products', src: 'website', delay: '.1s' },
  { text: 'Team, PhDs & expertise', src: 'LinkedIn', delay: '.35s' },
  { text: '2 patents, 11 publications', src: 'Scholar', delay: '.6s' },
  { text: '€6.4M raised · Series A', src: 'Crunchbase', delay: '.9s' },
  { text: 'ISO 14064 · B-Corp certs', src: 'registries', delay: '1.2s' },
  { text: 'SDG 2 · 13 · 15 alignment', src: 'derived', delay: '1.5s' },
];

export const READY_STATS: ReadyStat[] = [
  { n: '34', l: 'facts captured' },
  { n: '6', l: 'sources read' },
  { n: '87%', l: 'twin complete' },
];

export async function getScanning(): Promise<ScanItem[]> {
  return SCANNING;
}

export async function getReadyStats(): Promise<ReadyStat[]> {
  return READY_STATS;
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/lib/data/interview.ts apps/web/lib/data/scanning.ts
git commit -m "feat: add interview and scanning data modules"
```

- [ ] **Step 4: Typecheck the full data layer + store**

Run: `cd apps/web && npm run typecheck`
Expected: exits 0, no errors. (This is the first point every `lib/data/*` import in
`FundOsStore.ts` resolves, so it's the first meaningful typecheck in this plan.)

If it fails, the likely cause is a field name mismatch between a data module's interface and
what `FundOsStore.ts` destructures/reads in Task 4 — fix the mismatch, don't change the
copied data literals (they must stay verbatim to the source).

---

## Task 13: Shell components — Sidebar, Header

**Files:**
- Create: `apps/web/components/shell/Sidebar.tsx`
- Create: `apps/web/components/shell/Header.tsx`

Ported from `docs/reference/FundOS.dc.html:33-80` (sidebar) and `:84-112` (header).
Both are MobX observers reading the store via `useFundOsStore()`. Sidebar drives navigation
with `next/link` + `usePathname()` instead of the source's `item.go`/`cur===n.key` state
comparison (per the Contract section: routing owns the active screen, not the store).

- [ ] **Step 1: Create `apps/web/components/shell/Sidebar.tsx`**

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { observer } from 'mobx-react-lite';
import { useFundOsStore } from '@/lib/store/StoreProvider';

function routeFor(key: string): string {
  return key === 'home' ? '/' : `/${key}`;
}

export const Sidebar = observer(function Sidebar() {
  const store = useFundOsStore();
  const pathname = usePathname();

  return (
    <aside style={{ width: 248, flex: '0 0 248px', background: 'var(--side)', display: 'flex', flexDirection: 'column', color: 'var(--side-txt)', borderRight: '1px solid var(--side-line)' }}>
      <div style={{ padding: '20px 18px 16px', display: 'flex', alignItems: 'center', gap: 11 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-space-grotesk)', fontWeight: 700, color: '#06130c', fontSize: 17 }}>F</div>
        <div style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 600, fontSize: 17, letterSpacing: '-.2px' }}>FundOS</div>
        <div style={{ marginLeft: 'auto', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9.5, color: 'var(--side-dim)', border: '1px solid var(--side-line)', borderRadius: 5, padding: '2px 5px' }}>v1.0</div>
      </div>

      <button style={{ margin: '2px 12px 15px', background: 'var(--side-2)', border: '1px solid var(--side-line)', borderRadius: 10, padding: '10px 11px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', textAlign: 'left', color: 'inherit' }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: 'linear-gradient(135deg,#2f9e6b,#1a6f47)', flex: '0 0 26px' }} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{store.org?.name}</div>
          <div style={{ fontSize: 10.5, color: 'var(--side-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{store.org?.tag}</div>
        </div>
        <div style={{ color: 'var(--side-dim)', fontSize: 11 }}>⌄</div>
      </button>

      <div style={{ padding: '0 20px 6px', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9.5, letterSpacing: '.09em', color: 'var(--faint)', textTransform: 'uppercase' }}>Workspace</div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 8px' }}>
        {store.navItems.map((item) => {
          const active = pathname === routeFor(item.key);
          return (
            <Link
              key={item.key}
              href={routeFor(item.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 11, padding: '9px 11px', borderRadius: 9,
                borderLeft: `2px solid ${active ? 'var(--accent)' : 'transparent'}`, cursor: 'pointer', fontSize: 13, fontWeight: 500,
                textAlign: 'left', textDecoration: 'none',
                background: active ? 'rgba(31,157,99,.14)' : 'transparent',
                color: active ? '#e6f3ec' : 'var(--side-dim)',
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.p1} />
                {item.p2 && <path d={item.p2} />}
              </svg>
              <span>{item.label}</span>
              {item.badge && (
                <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, background: 'var(--accent)', color: '#06130c', borderRadius: 20, padding: '1px 7px', fontWeight: 600 }}>{item.badge}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div style={{ marginTop: 'auto', padding: 12 }}>
        <div style={{ background: 'var(--side-2)', border: '1px solid var(--side-line)', borderRadius: 11, padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', animation: 'fos-pulse 1.6s infinite' }} />
            <span style={{ fontSize: 11.5, fontWeight: 600 }}>AI team is working</span>
          </div>
          <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10.5, color: 'var(--side-dim)', lineHeight: 1.5 }}>{store.activeAgentsCount} of 12 agents active · 27 tasks today</div>
          <Link href="/agents" style={{ marginTop: 10, display: 'block', textAlign: 'center', width: '100%', background: 'transparent', border: '1px solid var(--side-line)', color: 'var(--side-txt)', borderRadius: 8, padding: 7, fontSize: 11.5, cursor: 'pointer', fontWeight: 500, textDecoration: 'none' }}>View orchestration →</Link>
        </div>
      </div>
    </aside>
  );
});
```

- [ ] **Step 2: Create `apps/web/components/shell/Header.tsx`**

```tsx
'use client';

import { usePathname } from 'next/navigation';
import { observer } from 'mobx-react-lite';
import { useFundOsStore } from '@/lib/store/StoreProvider';

const TITLE_MAP: Record<string, [string, string]> = {
  '/': ['Command Center', 'Your AI funding team, at a glance'],
  '/twin': ['Organization Digital Twin', 'Verdantia — living profile · 87% complete'],
  '/opportunities': ['Opportunity Discovery', '23 live matches · ranked by expected value'],
  '/agents': ['AI Orchestration', '12 specialists collaborating in real time'],
  '/relationships': ['Relationship Intelligence', 'Funders, officers & partners'],
  '/awards': ['Awards & Compliance', 'Post-award management · run by Echo'],
  '/proposal': ['Proposal Workspace', 'Horizon Europe — Soil Health Mission'],
};

export const Header = observer(function Header() {
  const store = useFundOsStore();
  const pathname = usePathname();
  const [title, subtitle] = TITLE_MAP[pathname] ?? TITLE_MAP['/'];

  return (
    <header style={{ height: 60, flex: '0 0 60px', borderBottom: '1px solid var(--line)', background: 'rgba(245,244,240,.82)', backdropFilter: 'blur(9px)', display: 'flex', alignItems: 'center', gap: 14, padding: '0 24px', zIndex: 6 }}>
      <div>
        <div style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 600, fontSize: 16, letterSpacing: '-.3px', lineHeight: 1.1 }}>{title}</div>
        <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{subtitle}</div>
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div onClick={() => store.openCmd()} style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 10, padding: '8px 12px', width: 290, color: 'var(--faint)', fontSize: 12.5, cursor: 'pointer' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4-4" strokeLinecap="round" />
          </svg>
          <span>Ask your funding team…</span>
          <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, border: '1px solid var(--line)', borderRadius: 5, padding: '1px 5px' }}>⌘K</span>
        </div>
        <button style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--line)', background: 'var(--panel)', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
          </svg>
          <span style={{ position: 'absolute', top: 8, right: 9, width: 6, height: 6, borderRadius: '50%', background: 'var(--red)' }} />
        </button>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#3a3f4a,#191b21)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 12 }}>ML</div>
      </div>
    </header>
  );
});
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/shell/Sidebar.tsx apps/web/components/shell/Header.tsx
git commit -m "feat: add Sidebar and Header shell components"
```

---

## Task 14: AppShell, root layout, dashboard layout, placeholder home page

**Files:**
- Create: `apps/web/components/shell/AppShell.tsx`
- Create: `apps/web/app/layout.tsx`
- Create: `apps/web/app/(dashboard)/layout.tsx`
- Create: `apps/web/app/(dashboard)/page.tsx`

The root `<div>` here carries the design tokens and base layout styles from
`docs/reference/FundOS.dc.html:31`. `AppShell` does not render the Auth/Onboarding/CmdK
overlays yet — Plan 6 adds those three components and edits this file to render them, so this
plan's build stays green without depending on unwritten work.

- [ ] **Step 1: Create `apps/web/components/shell/AppShell.tsx`**

```tsx
'use client';

import type { CSSProperties, ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

const rootStyle = {
  '--ink': '#191b21', '--muted': '#6d7079', '--faint': '#9a9ca4', '--line': '#e7e4dd',
  '--paper': '#f5f4f0', '--panel': '#ffffff', '--accent': '#1f9d63', '--accent-dark': '#16824f',
  '--tint': '#e9f4ee', '--amber': '#b1791b', '--amber-t': '#f6efdf', '--red': '#bd4130',
  '--red-t': '#f7e8e4', '--blue': '#3567c0', '--blue-t': '#e6ecf8', '--side': '#15171c',
  '--side-2': '#1c1f26', '--side-line': '#2a2e37', '--side-dim': '#8b909b', '--side-txt': '#e8e9ec',
  fontFamily: 'var(--font-ibm-plex-sans)', color: 'var(--ink)', height: '100vh', display: 'flex',
  overflow: 'hidden', background: 'var(--paper)', WebkitFontSmoothing: 'antialiased', fontSize: 15, lineHeight: 1.5,
} as CSSProperties;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div style={rootStyle}>
      <Sidebar />
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <Header />
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>{children}</div>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Create `apps/web/app/layout.tsx`**

```tsx
import type { Metadata } from 'next';
import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import { StoreProvider } from '@/lib/store/StoreProvider';
import './globals.css';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-space-grotesk' });
const ibmPlexSans = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-ibm-plex-sans' });
const ibmPlexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-ibm-plex-mono' });

export const metadata: Metadata = {
  title: 'FundOS',
  description: 'The AI funding operating system',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable}`}>
      <body>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Create `apps/web/app/(dashboard)/layout.tsx`**

```tsx
import type { ReactNode } from 'react';
import { AppShell } from '@/components/shell/AppShell';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
```

- [ ] **Step 4: Create `apps/web/app/(dashboard)/page.tsx`**

Placeholder home route — Plan 2 replaces this with the real Command Center screen.

```tsx
'use client';

import { observer } from 'mobx-react-lite';
import { useFundOsStore } from '@/lib/store/StoreProvider';

export default observer(function HomePlaceholder() {
  const store = useFundOsStore();
  if (!store.ready) return <div style={{ padding: 30 }}>Loading FundOS…</div>;
  return <div style={{ padding: 30 }}>FundOS scaffold ready. Command Center screen lands in Plan 2.</div>;
});
```

- [ ] **Step 5: Verify the build**

Run: `cd apps/web && npm run build`
Expected: `next build` completes successfully, producing a `/` route in the build output, no
TypeScript errors.

- [ ] **Step 6: Manual smoke check**

Run: `cd apps/web && npm run dev`, open `http://localhost:3000`.
Expected: dark sidebar with the FundOS mark, 7 nav items (Command Center highlighted active),
"AI team is working" panel at the bottom, header with the ⌘K search bar, and the main panel
reading "FundOS scaffold ready. Command Center screen lands in Plan 2." once the store
finishes its (instant) mock `init()`.

- [ ] **Step 7: Commit**

```bash
git add apps/web/components/shell/AppShell.tsx apps/web/app/layout.tsx "apps/web/app/(dashboard)"
git commit -m "feat: wire AppShell into root and dashboard layouts with placeholder home"
```

---

## Self-review notes

- **Spec coverage:** repo layout ✓ (Task 1–2), MobX store ✓ (Task 4), data layer — all 16
  spec-listed modules plus the added `proposal.ts` ✓ (Tasks 5–12), `components/shell/*` ✓
  (Tasks 13–14), styling tokens/fonts/globals ✓ (Task 3, 14), forward-looking `apps/api` /
  `infra` READMEs ✓ (Task 1). Screens, overlays, and the opportunity drawer are out of scope
  for this plan — they're Plans 2–6.
- **Placeholder scan:** the only intentionally provisional piece is `app/(dashboard)/page.tsx`,
  which is fully working code (not a TODO) that Plan 2 replaces outright — this is called out
  explicitly, not left vague.
- **Type consistency:** every field name used in `FundOsStore.ts` (Task 4) matches the
  corresponding interface in `lib/data/*.ts` (Tasks 5–12) — cross-checked `note` on
  `Opportunity`, `conf`/`confColor` on `TwinField`, `state` on `Obligation`/`PipelineStage`,
  and `urgency`/`comp` union literal values throughout.

---

## Handoff to Plans 2–6

Once this plan's tasks are complete and `npm run build` passes, Plans 2–6 can proceed — they
depend only on this plan's store contract and data modules, not on each other, so they can be
executed in any order (or in parallel, in separate worktrees) once this plan is merged:

- **Plan 2:** Command Center (`/`) + Digital Twin (`/twin`)
- **Plan 3:** Opportunity Discovery (`/opportunities`) + Opportunity Detail drawer
- **Plan 4:** Proposal Workspace (`/proposal`)
- **Plan 5:** Awards (`/awards`) + AI Orchestration (`/agents`) + Relationships (`/relationships`)
- **Plan 6:** Auth modal + Onboarding modal + Command Palette (global overlays — edits `AppShell.tsx`)
