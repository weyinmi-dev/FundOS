# FundOS Next.js Port — Plan 3: Opportunity Discovery & Detail Drawer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the Opportunity Discovery screen (`/opportunities`) and the Opportunity Detail slide-over drawer from `docs/reference/FundOS.dc.html`, wiring both to the `FundOsStore` contract established in Plan 1.

**Architecture:** `OpportunityDiscovery` is a route-scoped screen component (`components/screens/OpportunityDiscovery.tsx`) rendered by `app/(dashboard)/opportunities/page.tsx`. `OpportunityDetailDrawer` is a **global overlay** (`components/overlays/OpportunityDetailDrawer.tsx`) that self-gates on `store.selectedOpportunity` and is rendered unconditionally from `components/shell/AppShell.tsx`, alongside `<Sidebar/>`/`<Header/>`/`children` — matching the source mockup, where the drawer (`FundOS.dc.html:766-898`) is a sibling of the screen `sc-if` blocks, not nested inside Opportunity Discovery's markup. This means any screen that calls `store.openOpp(id)` (e.g. a Command Center opportunity card, built in a different plan) opens this same drawer without navigating away from its current route.

**Tech Stack:** Next.js 15 (App Router, TypeScript, client components), MobX + mobx-react-lite (`observer`), inline-style JSX per the design doc's styling section. No CSS framework. No automated tests — this port's non-goals rule out a test suite; verification is `tsc --noEmit` / `next build` passing plus a manual dev-server visual check against the source mockup.

**Source of truth:** `docs/reference/FundOS.dc.html:364-423` (Opportunity Discovery screen) and `:766-898` (Opportunity Detail drawer), read directly for this plan. `docs/superpowers/specs/2026-07-28-fundos-nextjs-port-design.md` (design doc) and `docs/superpowers/plans/2026-07-28-fundos-01-scaffold-data.md` (Plan 1 — defines the store/data contract this plan builds against; do not invent field/action/computed names not already in Plan 1's `FundOsStore.ts`, Task 4).

---

## Contract this plan consumes (from Plan 1 — do not redefine)

- `store.sortKey: 'value' | 'match' | 'deadline' | 'effort'`, `store.setSort(key)`.
- `store.sortedOpportunities` — computed; each item is the raw `Opportunity` (from `lib/data/opportunities.ts`: `id`, `type`, `name`, `funder`, `amount`, `deadline`, `score`, `why`, `elig`, `effort`, `agents`, `factors`, optional `note`) plus `dColor`, `dTint` (deadline pill colors), `eur`, `days`, `effortScore` — sorted per `store.sortKey`.
- `store.selectedOppId: string | null`, `store.openOpp(id: string)`, `store.closeOpp()`.
- `store.selectedOpportunity` — computed; `null` when `selectedOppId` is `null`, otherwise a `sortedOpportunities` item plus `kind`, `isEquity: boolean`, `isDebt: boolean`, `ctaLabel: string`, `eligLabel: string`, `note` (always an object — `OpportunityNote` fields are all optional strings, defaults to `{}` when the source opportunity has none).
- `store.ready: boolean` — gates rendering until `store.init()` resolves (instant with mocks, but the pattern survives becoming real `fetch()` calls).
- Design tokens (`var(--ink)`, `var(--accent)`, etc.) — already declared on `AppShell`'s root `<div>` (Plan 1, Task 14); consumed here as `var(--x)` strings only, never redeclared.
- Fonts — `fontFamily:'var(--font-space-grotesk)'` / `'var(--font-ibm-plex-sans)'` / `'var(--font-ibm-plex-mono)'`.
- `useFundOsStore()` from `@/lib/store/StoreProvider`; screen/overlay components are `'use client'` and wrapped in `observer(...)` from `mobx-react-lite`.

**Known cross-plan dependency:** the source's `closeOpp` is also wired to the global `Escape` key (`FundOS.dc.html`'s `componentDidMount`). Plan 1 does not add a global key listener, and this plan does not add one either — Escape-key handling for this drawer (plus the ⌘K palette) is centralized in `docs/superpowers/plans/2026-07-28-fundos-06-overlays.md`, via a `useEffect` in `CmdKPalette` or a shared hook. This plan's drawer only implements its own backdrop-click-to-close and the explicit ✕ button, both of which are fully functional today without that later plan.

---

## File Structure

```
apps/web/
  app/
    globals.css                              MODIFY — add 3 scoped hover classes (Task 1)
    (dashboard)/
      opportunities/
        page.tsx                             CREATE — renders OpportunityDiscovery (Task 3)
  components/
    screens/
      OpportunityDiscovery.tsx                CREATE — sort pills, category pills, opportunity list (Task 2)
    overlays/
      OpportunityDetailDrawer.tsx             CREATE — global slide-over drawer (Task 4)
    shell/
      AppShell.tsx                            MODIFY — render <OpportunityDetailDrawer/> (Task 5)
```

---

## Task 1: Global hover-state CSS classes

**Files:**
- Modify: `apps/web/app/globals.css`

The source mockup uses `style-hover="..."` attributes (a dc-runtime DSL construct with no direct
React equivalent) on three elements this plan ports: the opportunity list row
(`FundOS.dc.html:392`, `style-hover="box-shadow:0 8px 24px rgba(25,27,33,.09);transform:translateY(-1px);border-color:#c9d8cf"`),
the drawer's CTA button (`:892`, `style-hover="background:var(--accent-dark)"`), and the drawer's
Save button (`:893`, `style-hover="border-color:#cfccc3"`). None of these depend on a per-item
dynamic color, so per the design doc's styling section ("prefer the CSS class approach for
anything not touching dynamic per-item colors"), all three become small scoped classes here
rather than `onMouseEnter`/`onMouseLeave` state in the components.

`var(--accent-dark)` resolves correctly from `globals.css` even though it's declared via an
inline `style` object on `AppShell`'s root `<div>` (Plan 1, Task 14) — CSS custom properties
cascade through the DOM tree regardless of how an ancestor set them.

- [ ] **Step 1: Append hover classes to `apps/web/app/globals.css`**

Add this block at the end of the existing file (after the `::-webkit-scrollbar-thumb:hover`
rule added in Plan 1, Task 3):

```css
.fos-opp-row {
  transition: box-shadow .24s, transform .24s, border-color .24s;
}

.fos-opp-row:hover {
  box-shadow: 0 8px 24px rgba(25, 27, 33, .09);
  transform: translateY(-1px);
  border-color: #c9d8cf;
}

.fos-cta-btn {
  transition: background .16s;
}

.fos-cta-btn:hover {
  background: var(--accent-dark);
}

.fos-save-btn {
  transition: border-color .16s;
}

.fos-save-btn:hover {
  border-color: #cfccc3;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/globals.css
git commit -m "feat: add scoped hover classes for opportunity row and drawer buttons"
```

---

## Task 2: `OpportunityDiscovery` screen component

**Files:**
- Create: `apps/web/components/screens/OpportunityDiscovery.tsx`

Ported from `docs/reference/FundOS.dc.html:364-423`. The sort-by pill row calls
`store.setSort(key)` per pill (mockup: `sortOpts` maps `sortKeys = [['Expected value','value'],
['Match','match'],['Deadline','deadline'],['Least effort','effort']]` at `FundOS.dc.html:1429`
to buttons wired to `this.setSort`). The four category pills below it (Grants/Equity/Debt/
Challenges, `FundOS.dc.html:375-378`) are **static, non-interactive** in the source — they carry
no `onClick`/`go` handler in the mockup, so this is a faithful 1:1 port, not a missing feature:
only the "Grants" pill is visually highlighted (tinted background), the rest render as plain
gray pills with no filtering behavior. Clicking a row calls `store.openOpp(o.id)`, which is all
that's needed to open the global drawer (Task 4) — no navigation.

- [ ] **Step 1: Create `apps/web/components/screens/OpportunityDiscovery.tsx`**

```tsx
'use client';

import { observer } from 'mobx-react-lite';
import { useFundOsStore } from '@/lib/store/StoreProvider';

const SORT_OPTIONS: { key: 'value' | 'match' | 'deadline' | 'effort'; label: string }[] = [
  { key: 'value', label: 'Expected value' },
  { key: 'match', label: 'Match' },
  { key: 'deadline', label: 'Deadline' },
  { key: 'effort', label: 'Least effort' },
];

export const OpportunityDiscovery = observer(function OpportunityDiscovery() {
  const store = useFundOsStore();

  if (!store.ready) return <div style={{ padding: 30 }}>Loading FundOS…</div>;

  return (
    <div data-screen-label="Opportunity Discovery" style={{ maxWidth: 1180, margin: '0 auto', padding: '22px 30px 64px', animation: 'fos-reveal .45s both' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 11, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--muted)' }}>Sort by</div>
        <div style={{ display: 'flex', background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 9, padding: 3, gap: 2 }}>
          {SORT_OPTIONS.map((so) => {
            const active = store.sortKey === so.key;
            return (
              <button
                key={so.key}
                onClick={() => store.setSort(so.key)}
                style={{
                  border: 'none',
                  background: active ? 'var(--accent)' : 'transparent',
                  color: active ? '#fff' : 'var(--muted)',
                  fontSize: 12,
                  fontWeight: 500,
                  padding: '5px 12px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-ibm-plex-sans)',
                  transition: 'background .16s',
                }}
              >
                {so.label}
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'var(--tint)', color: 'var(--accent-dark)', fontWeight: 500 }}>Grants</span>
          <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#f0efe9', color: 'var(--muted)' }}>Equity</span>
          <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#f0efe9', color: 'var(--muted)' }}>Debt</span>
          <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#f0efe9', color: 'var(--muted)' }}>Challenges</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 118px 190px 30px', gap: 16, padding: '0 16px 8px', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9.5, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted)' }}>
        <span>Opportunity</span>
        <span>Amount</span>
        <span>Deadline</span>
        <span>Match &amp; ranking</span>
        <span></span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {store.sortedOpportunities.map((o) => (
          <div
            key={o.id}
            onClick={() => store.openOpp(o.id)}
            className="fos-opp-row"
            style={{ display: 'grid', gridTemplateColumns: '1fr 130px 118px 190px 30px', gap: 16, alignItems: 'center', padding: '14px 16px', background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12, cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', gap: 13, alignItems: 'center', minWidth: 0 }}>
              <div style={{ width: 38, height: 38, flex: '0 0 38px', borderRadius: 9, background: 'linear-gradient(135deg,#dfe4e9,#c2ccd6)' }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--accent-dark)', marginBottom: 2 }}>{o.type}</div>
                <div style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 600, fontSize: 16, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{o.funder}</div>
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 14.5, fontWeight: 500 }}>{o.amount}</div>
            <div>
              <span style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 11, padding: '2px 8px', borderRadius: 5, background: o.dTint, color: o.dColor }}>{o.deadline}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, height: 6, borderRadius: 4, background: '#eceae4', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: '0 auto 0 0', width: `${o.score}%`, background: 'var(--accent)', borderRadius: 4 }} />
              </div>
              <span style={{ fontFamily: 'var(--font-space-grotesk)', fontSize: 18, fontWeight: 600, color: 'var(--accent-dark)', width: 26, textAlign: 'right' }}>{o.score}</span>
            </div>
            <div style={{ textAlign: 'center', color: '#b9b6ad' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 6 6 6-6 6" />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/components/screens/OpportunityDiscovery.tsx
git commit -m "feat: add Opportunity Discovery screen component"
```

---

## Task 3: `/opportunities` route

**Files:**
- Create: `apps/web/app/(dashboard)/opportunities/page.tsx`

Per the design doc's routing section, `/opportunities` is a real App Router route under the
`(dashboard)` route group, which already wraps every route in `AppShell` (sidebar + header +
global overlays) via `apps/web/app/(dashboard)/layout.tsx` (Plan 1, Task 14). The page itself
stays a thin server-component wrapper around the client-component screen, following the split
the design doc lays out for `components/screens/*`.

- [ ] **Step 1: Create `apps/web/app/(dashboard)/opportunities/page.tsx`**

```tsx
import { OpportunityDiscovery } from '@/components/screens/OpportunityDiscovery';

export default function OpportunitiesPage() {
  return <OpportunityDiscovery />;
}
```

- [ ] **Step 2: Typecheck**

Run: `cd apps/web && npm run typecheck`
Expected: exits 0, no errors. If `store.sortedOpportunities` field access fails to typecheck,
the mismatch is between this component and Plan 1's `FundOsStore.ts` computed — fix the
component, not the store (the store contract is fixed by Plan 1).

- [ ] **Step 3: Build**

Run: `cd apps/web && npm run build`
Expected: `next build` completes successfully, producing an `/opportunities` route in the build
output, no TypeScript errors.

- [ ] **Step 4: Manual smoke check**

Run: `cd apps/web && npm run dev`, open `http://localhost:3000/opportunities`.
Expected: "Sort by" pill row with "Expected value" highlighted green (the default `sortKey`),
a "Grants" pill tinted green among three gray static pills, a column-header row
(Opportunity / Amount / Deadline / Match & ranking), and 8 opportunity rows (Horizon Europe,
DOE Carbon Negative Shot, Breakthrough Energy Fellows, XPRIZE Carbon Removal, Green Climate
Fund, Barclays Sustainable Growth, Aster Ventures, Regenerative Capital Angels) sorted by
descending EUR-normalized value. Clicking "Match" or "Deadline" or "Least effort" re-sorts the
list and highlights the clicked pill. Hovering a row lifts it slightly with a shadow. Clicking
a row does nothing visible yet (the drawer that responds to it is Task 4/5) — that's expected
at this checkpoint.

- [ ] **Step 5: Commit**

```bash
git add "apps/web/app/(dashboard)/opportunities"
git commit -m "feat: add /opportunities route"
```

---

## Task 4: `OpportunityDetailDrawer` global overlay component

**Files:**
- Create: `apps/web/components/overlays/OpportunityDetailDrawer.tsx`

Ported from `docs/reference/FundOS.dc.html:766-898`. This is the architectural nuance called
out in the design doc's Components section: in the source, the drawer (`sc-if value="{{ hasOpp
}}"`) is a **sibling of the screen `sc-if` blocks**, gated purely on whether an opportunity is
selected — completely independent of which screen is showing. A Command Center opportunity
card (built in a different plan) opens this same drawer via `store.openOpp(id)` while staying on
Command Center. So this component is not imported by `OpportunityDiscovery` — it lives under
`components/overlays/` (alongside the future `AuthModal`/`OnboardingModal`/`CmdKPalette` from
Plan 6) and is rendered once, unconditionally, from `AppShell` in Task 5. It self-gates
internally: it reads `store.selectedOpportunity`, and renders `null` when that's `null` (i.e.
`store.selectedOppId` is unset), so `AppShell` never needs an `sc-if`-style conditional around
it.

The mockup's `startProposal` action (`FundOS.dc.html:892`, `onClick="{{ startProposal }}"`,
labeled by `{{ selectedOpp.ctaLabel }}`) becomes a **component-level** function that calls
`store.closeOpp()` then `router.push('/proposal')` — routing never lives in the store, per the
Plan 1 contract ("Routing owns `screen`").

The backdrop `<div>` and the ✕ button both call `store.closeOpp()` directly, matching the
source's `onClick="{{ closeOpp }}"` on both elements (`FundOS.dc.html:769` and `:775`). Global
`Escape`-key handling for this same close action is intentionally **not** implemented here — see
the "Known cross-plan dependency" note at the top of this plan.

- [ ] **Step 1: Create `apps/web/components/overlays/OpportunityDetailDrawer.tsx`**

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { observer } from 'mobx-react-lite';
import { useFundOsStore } from '@/lib/store/StoreProvider';

export const OpportunityDetailDrawer = observer(function OpportunityDetailDrawer() {
  const store = useFundOsStore();
  const router = useRouter();
  const opp = store.selectedOpportunity;

  if (!opp) return null;

  function startProposal() {
    store.closeOpp();
    router.push('/proposal');
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 40, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={() => store.closeOpp()} style={{ position: 'absolute', inset: 0, background: 'rgba(21,23,28,.32)', animation: 'fos-fade .2s both' }} />
      <div style={{ position: 'relative', width: 520, maxWidth: '92vw', height: '100%', background: 'var(--paper)', boxShadow: '-16px 0 44px rgba(21,23,28,.18)', animation: 'fos-slide .32s cubic-bezier(.16,1,.3,1) both', overflowY: 'auto' }}>
        <div style={{ padding: '22px 26px 20px', borderBottom: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9.5, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--accent-dark)' }}>{opp.type}</span>
            <button onClick={() => store.closeOpp()} style={{ marginLeft: 'auto', width: 30, height: 30, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--panel)', cursor: 'pointer', color: 'var(--muted)', fontSize: 15 }}>✕</button>
          </div>
          <h2 style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 600, fontSize: 23, letterSpacing: '-.4px', lineHeight: 1.15, margin: '0 0 4px' }}>{opp.name}</h2>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>{opp.funder}</div>
          <div style={{ display: 'flex', gap: 22, marginTop: 16 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--muted)' }}>Amount</div>
              <div style={{ fontFamily: 'var(--font-space-grotesk)', fontSize: 19, fontWeight: 600, marginTop: 3 }}>{opp.amount}</div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--muted)' }}>Deadline</div>
              <div style={{ fontFamily: 'var(--font-space-grotesk)', fontSize: 19, fontWeight: 600, marginTop: 3, color: opp.dColor }}>{opp.deadline}</div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--muted)' }}>Match</div>
              <div style={{ fontFamily: 'var(--font-space-grotesk)', fontSize: 19, fontWeight: 600, marginTop: 3, color: 'var(--accent-dark)' }}>{opp.score}</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '22px 26px' }}>
          <div style={{ background: 'var(--tint)', border: '1px solid #c9e6d5', borderRadius: 12, padding: '14px 16px', marginBottom: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent-dark)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 600, fontSize: 13.5, color: 'var(--accent-dark)' }}>Why Compass recommends this</span>
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.55, color: '#245c40' }}>{opp.why}</div>
          </div>

          <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9.5, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12 }}>Ranking breakdown</div>
          {opp.factors.map((f) => (
            <div key={f.label} style={{ marginBottom: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 5 }}>
                <span style={{ fontWeight: 500 }}>{f.label}</span>
                <span style={{ color: 'var(--muted)' }}>{f.note}</span>
              </div>
              <div style={{ height: 6, borderRadius: 4, background: '#eceae4', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${f.pct}%`, background: f.color, borderRadius: 4 }} />
              </div>
            </div>
          ))}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11, margin: '22px 0' }}>
            <div style={{ border: '1px solid var(--line)', borderRadius: 11, padding: '13px 14px', background: 'var(--panel)' }}>
              <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--muted)' }}>{opp.eligLabel}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 6 }}>
                <span style={{ color: 'var(--accent)', fontWeight: 700 }}>✓</span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{opp.elig}</span>
              </div>
            </div>
            <div style={{ border: '1px solid var(--line)', borderRadius: 11, padding: '13px 14px', background: 'var(--panel)' }}>
              <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--muted)' }}>Effort estimate</div>
              <div style={{ fontSize: 13, fontWeight: 500, marginTop: 6 }}>{opp.effort}</div>
            </div>
          </div>

          {opp.isEquity && (
            <div style={{ border: '1px solid var(--line)', borderRadius: 11, padding: '14px 16px', background: 'var(--panel)', marginBottom: 22 }}>
              <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 11 }}>Investor terms — modelled by Ledger</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '13px 18px' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>Check size</div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, fontFamily: 'var(--font-ibm-plex-mono)' }}>{opp.note.checkSize}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>Stage</div>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{opp.note.stage}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>Ownership</div>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{opp.note.ownership}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>Warm path</div>
                  <div style={{ fontSize: 12.5, fontWeight: 500 }}>{opp.note.warm}</div>
                </div>
              </div>
            </div>
          )}
          {opp.isDebt && (
            <div style={{ border: '1px solid var(--line)', borderRadius: 11, padding: '14px 16px', background: 'var(--panel)', marginBottom: 22 }}>
              <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 11 }}>Facility terms — modelled by Ledger</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '13px 18px' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>Facility</div>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{opp.note.facility}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>Rate</div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, fontFamily: 'var(--font-ibm-plex-mono)' }}>{opp.note.rate}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>Term</div>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{opp.note.term}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>Security</div>
                  <div style={{ fontSize: 12.5, fontWeight: 500 }}>{opp.note.security}</div>
                </div>
              </div>
            </div>
          )}

          <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9.5, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>Agents assigned on approval</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 22 }}>
            {opp.agents.map((ag) => (
              <span key={ag} style={{ fontSize: 11.5, padding: '4px 11px', borderRadius: 20, background: 'var(--panel)', border: '1px solid var(--line)', fontWeight: 500 }}>{ag}</span>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={startProposal} className="fos-cta-btn" style={{ flex: 1, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10, padding: 12, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-ibm-plex-sans)' }}>{opp.ctaLabel}</button>
            <button className="fos-save-btn" style={{ background: 'var(--panel)', color: 'var(--ink)', border: '1px solid var(--line)', borderRadius: 10, padding: '12px 16px', fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/components/overlays/OpportunityDetailDrawer.tsx
git commit -m "feat: add global Opportunity Detail drawer overlay component"
```

---

## Task 5: Wire the drawer into `AppShell`

**Files:**
- Modify: `apps/web/components/shell/AppShell.tsx`

`AppShell.tsx` currently (Plan 1, Task 14) renders `<Sidebar/>` + `<Header/>` + `{children}` only,
with the design-token root `<div>`. This task adds `<OpportunityDetailDrawer/>` as an
unconditional sibling — it self-gates internally (Task 4), so `AppShell` needs no conditional
logic around it. This is the concrete implementation of the "global overlay" decision described
in the Architecture section above: the drawer is now reachable from every route, not just
`/opportunities`.

- [ ] **Step 1: Read the current `AppShell.tsx` to confirm the exact text to match**

Run: `cat apps/web/components/shell/AppShell.tsx` (or open the file). It should match Plan 1,
Task 14, Step 1 verbatim — a `'use client'` component importing `Sidebar` and `Header`, with a
`rootStyle` object and a `<div style={rootStyle}><Sidebar/><main>...<Header/>{children}</main></div>`
tree. If Plan 6 (overlays: Auth/Onboarding/CmdK) has already landed and added its own overlay
components here, add `<OpportunityDetailDrawer/>` alongside them rather than overwriting their
edits — the two plans are independent and order-agnostic per Plan 1's handoff notes.

- [ ] **Step 2: Add the import**

In `apps/web/components/shell/AppShell.tsx`, add this import alongside the existing `Sidebar`/
`Header` imports:

```tsx
import { OpportunityDetailDrawer } from '@/components/overlays/OpportunityDetailDrawer';
```

- [ ] **Step 3: Render the drawer as a sibling of `<Sidebar/>` and `<main>`**

Change:

```tsx
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

to:

```tsx
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div style={rootStyle}>
      <Sidebar />
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <Header />
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>{children}</div>
      </main>
      <OpportunityDetailDrawer />
    </div>
  );
}
```

- [ ] **Step 4: Typecheck**

Run: `cd apps/web && npm run typecheck`
Expected: exits 0, no errors.

- [ ] **Step 5: Build**

Run: `cd apps/web && npm run build`
Expected: `next build` completes successfully across every route (`/`, `/opportunities`, and any
others already landed from other plans), no TypeScript errors.

- [ ] **Step 6: Manual smoke check — drawer opens from `/opportunities`**

Run: `cd apps/web && npm run dev`, open `http://localhost:3000/opportunities`, click any row.
Expected: a slide-over panel animates in from the right over a dimmed backdrop, showing the
opportunity's type/name/funder/amount/deadline/match, a green "Why Compass recommends this" box,
a "Ranking breakdown" list of factor bars, a 2-column Eligibility/Effort grid, and — depending on
the row clicked — either an "Investor terms" block (Aster Ventures, Regenerative Capital Angels),
a "Facility terms" block (Barclays Sustainable Growth), or neither (grant/prize rows), followed
by an assigned-agents chip row and a green CTA button (e.g. "Assemble proposal →" for grants,
"Prepare pitch & data room →" for equity, "Prepare financing pack →" for debt, "Enter the
challenge →" for the XPRIZE prize) plus a "Save" button.

- [ ] **Step 7: Manual smoke check — drawer closes and CTA navigates**

With the drawer open: click the backdrop — drawer closes, URL stays `/opportunities`. Reopen it,
click the ✕ button — same result. Reopen it, click the CTA button — drawer closes and the browser
navigates to `/proposal` (this route may 404 or show a placeholder until Plan 4 lands; the
navigation itself is what this step verifies).

- [ ] **Step 8: Commit**

```bash
git add apps/web/components/shell/AppShell.tsx
git commit -m "feat: render Opportunity Detail drawer globally from AppShell"
```

---

## Self-review

**Spec coverage:**
- Opportunity Discovery screen (sort-by pills, category pills, opportunity list with amount/
  deadline/match-score-bar, row click) — Task 2, ported from `FundOS.dc.html:364-423`. ✓
- `/opportunities` route — Task 3. ✓
- Opportunity Detail drawer (header with type/close/name/funder/amount/deadline/match, "Why
  Compass recommends this" box, ranking-factor bars, elig/effort grid, conditional equity/debt
  terms block, assigned-agents chips, CTA button) — Task 4, ported from `FundOS.dc.html:766-898`.
  ✓
- Drawer built as a global overlay, not nested in the Opportunity Discovery screen — Task 4
  (component lives under `components/overlays/`, not `components/screens/`, and is never
  imported by `OpportunityDiscovery.tsx`) and Task 5 (rendered unconditionally from `AppShell`,
  self-gated internally on `store.selectedOpportunity`). ✓ — see explicit confirmation below.
- CTA navigation via component-level `useRouter().push('/proposal')` after `store.closeOpp()`,
  not a store action — Task 4, `startProposal()`. ✓
- Backdrop-click-to-close and ✕-button-to-close — Task 4. ✓ Global Escape-key handling
  explicitly called out as out of scope, deferred to Plan 6 — see the "Known cross-plan
  dependency" note. ✓
- `style-hover` DSL attributes on the row, CTA button, and Save button — ported as scoped CSS
  classes in Task 1, per the design doc's styling guidance for hover states not touching
  per-item dynamic colors. ✓

**Placeholder scan:** no "TODO", "similar to above", or unfilled code blocks anywhere in this
plan — every step that touches code shows the complete file or the complete before/after diff
(Task 5's `AppShell.tsx` edit shows both the exact current text to match and the exact
replacement, since this plan modifies a file created by Plan 1, not one it wrote itself).

**Type consistency against Plan 1's store contract:** cross-checked every store field/action/
computed used in Tasks 2 and 4 against `FundOsStore.ts` in Plan 1's Task 4 —
`store.sortKey`/`store.setSort` (action signature `(key: SortKey) => void`, matches
`SORT_OPTIONS`'s `key` union exactly), `store.sortedOpportunities` (mapped fields `dColor`,
`dTint`, plus raw `Opportunity` fields `id`/`type`/`name`/`funder`/`amount`/`deadline`/`score`
all consumed, none invented), `store.openOpp(id: string)`, `store.closeOpp()`,
`store.selectedOpportunity` (consumed `type`/`name`/`funder`/`amount`/`deadline`/`dColor`/
`score`/`why`/`factors`/`elig`/`eligLabel`/`effort`/`isEquity`/`isDebt`/`note`/`agents`/
`ctaLabel`, all present on the computed's return shape), `store.ready`. No new observables,
actions, or computeds were added to the store — Task 2 and Task 4 read-only consume the existing
contract, satisfying Plan 1's "must use these exact names — do not invent alternates" rule.
`OpportunityNote`'s fields (`checkSize`, `stage`, `ownership`, `warm`, `facility`, `rate`,
`term`, `security`) are all optional strings per `lib/data/opportunities.ts` (Plan 1, Task 6),
matching their usage in the conditional equity/debt blocks.

**Drawer-is-global-overlay decision — explicit confirmation:** `OpportunityDetailDrawer.tsx`
(Task 4) is created under `components/overlays/`, imported and rendered exactly once, from
`AppShell.tsx` (Task 5) — never from `OpportunityDiscovery.tsx` or `app/(dashboard)/opportunities/
page.tsx`. It takes no props; its only data dependency is `store.selectedOpportunity`, which is
`null` regardless of route until some component (this plan's `OpportunityDiscovery` row click,
or another plan's opportunity card) calls `store.openOpp(id)`. This means the drawer already
works correctly from any future route that calls `openOpp` — no changes to this plan's files will
be needed when Plan 2's Command Center screen wires up its own opportunity cards.
