# FundOS Next.js Port — Plan 2: Command Center & Digital Twin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder home page with the real Command Center screen (`/`) and add the Digital Twin screen (`/twin`), porting `docs/reference/FundOS.dc.html:116-267` and `:269-362` 1:1 into React components that read `FundOsStore`.

**Architecture:** Two new screen components under `components/screens/` (`CommandCenter.tsx`, `DigitalTwin.tsx`), each a MobX `observer` client component consuming `useFundOsStore()`. `app/(dashboard)/page.tsx` is rewritten to render `CommandCenter`; a new `app/(dashboard)/twin/page.tsx` renders `DigitalTwin`. Both routes inherit `AppShell` (sidebar/header) from the existing `app/(dashboard)/layout.tsx`. Inline styles are ported verbatim as camelCase style objects; the three static hover effects used on this screen become small reusable classes in `globals.css` (per the design doc's styling section — static, non-per-item-color hovers prefer a CSS class over `onMouseEnter`/`onMouseLeave`).

**Tech Stack:** Next.js 15 (App Router, TypeScript), React 19, MobX + mobx-react-lite. No Tailwind. No test runner — verification is `tsc --noEmit` / `next build` passing plus a manual dev-server visual check against the mockup (see `docs/superpowers/specs/2026-07-28-fundos-nextjs-port-design.md` Non-goals).

**Source of truth:** `docs/reference/FundOS.dc.html:116-267` (Command Center) and `:269-362` (Digital Twin) for markup/copy/styles; `docs/superpowers/plans/2026-07-28-fundos-01-scaffold-data.md` for the exact `FundOsStore` contract this plan builds against (do not rename or add store fields — see Contract Recap below).

---

## Contract Recap (from Plan 1 — read-only for this plan)

This plan consumes, but does not modify, `apps/web/lib/store/FundOsStore.ts` and `apps/web/lib/store/StoreProvider.tsx`. The exact surface used here:

- `store.ready: boolean` — gates rendering until `init()` resolves.
- `store.org: Org | null` — `{ name, tag, mission, stage, sector, hq }`.
- `store.kpis: Kpi[]` — `{ label, value, sub }`.
- `store.awayStats: AwayStat[]` — `{ n, l }`.
- `store.activity: ActivityEvent[]` — `{ time, agent, text }`.
- `store.pendingApprovals` (computed) — `ApprovalItem` fields (`id, tag, agent, title, detail, whyText, evidence, declineText, reviewTitle, reviewLines`) plus `color`, `tint` (from urgency) and `agentName`.
- `store.topOpportunities` (computed) — top 2 `Opportunity` by score, each with `dColor`, `type`, `score`, `name`, `funder`, `amount`, `deadline`, `id`.
- `store.approve(id: string)` — action.
- `store.toggleExpand(id: string, mode: 'why' | 'review')` — action.
- `store.expandedId: string | null`, `store.expandedMode: 'why' | 'review' | null` — compare against an approval's `id` to know whether its why/review panel is open.
- `store.openOpp(id: string)` — action; opens the (not-yet-built) Opportunity Detail drawer via `store.selectedOppId`. This plan only calls it — it does not render the drawer (see File Structure note below).
- `store.twinWithConfidence` (computed) — `TwinGroup[]` (`{ group, items }`) with each item's `TwinField` (`label, value, conf, source`) extended with `confColor`.
- `store.enriching: EnrichingItem[]` — `{ icon, color, title, src }`.
- `store.sources: string[]`.
- `store.memory: MemoryEntry[]` — `{ t, ago }`.

No new store fields, actions, or computeds are introduced by this plan. Two pieces of copy that exist only as hardcoded values inside the mockup's `renderVals()` (not store fields — confirmed by reading `FundOS.dc.html:1470,1504`) are ported as local constants inside `CommandCenter.tsx` rather than invented store state: the greeting date string (`today:'Friday, 24 July'`) and the "while you were away" narrative sentence (`awayCopy['Balanced']`, the default `autonomy`). The Digital Twin's "87% complete" ring value is likewise a hardcoded mockup literal (no `completeness` field exists on `TwinGroup`/`TwinField`), ported as a local constant in `DigitalTwin.tsx`.

---

## File Structure

```
apps/web/
  app/
    globals.css                     MODIFY — add 3 reusable hover classes (Task 1, Step 1)
    (dashboard)/
      page.tsx                      MODIFY — replace placeholder with <CommandCenter/> (Task 1)
      twin/
        page.tsx                    CREATE — renders <DigitalTwin/> (Task 2)
  components/
    screens/
      CommandCenter.tsx             CREATE — Command Center screen (Task 1)
      DigitalTwin.tsx                CREATE — Digital Twin screen (Task 2)
```

**Dependency note (not built by this plan):** the top-opportunity cards on Command Center call `store.openOpp(o.id)` on click, per the source mockup's slide-over behavior. This sets `store.selectedOppId` but renders nothing yet — the `OpportunityDetail` component that reads `store.selectedOppId` and renders the global overlay is built in Plan 3 (per Plan 1's handoff notes) and wired into `AppShell.tsx` there. Until Plan 3 lands, clicking a recommended-opportunity card on `/` will update store state with no visible effect — this is expected and not a bug in this plan.

---

## Task 1: Command Center screen (`/`)

**Files:**
- Modify: `apps/web/app/globals.css`
- Create: `apps/web/components/screens/CommandCenter.tsx`
- Modify: `apps/web/app/(dashboard)/page.tsx`

- [ ] **Step 1: Add reusable hover classes to `apps/web/app/globals.css`**

Three static (non-per-item-color) hovers appear on this screen — the approval/top-opportunity card lift (`FundOS.dc.html:170,227`), the Approve button's accent-dark background swap (`:178`), and the Review button's border-color swap (`:179`). Per the design doc's styling section, these become scoped CSS classes rather than `onMouseEnter`/`onMouseLeave` handlers since none depend on a per-item dynamic color. These same three patterns recur throughout the rest of the mockup (e.g. primary CTA buttons on Proposal Workspace, Auth modal), so naming them generically lets Plans 3–6 reuse them without redefining.

Add this to the end of `apps/web/app/globals.css` (after the existing `::-webkit-scrollbar-thumb:hover` block):

```css

.fos-card-hover {
  transition: box-shadow .24s, transform .24s;
}
.fos-card-hover:hover {
  box-shadow: 0 6px 20px rgba(25, 27, 33, .08);
  transform: translateY(-1px);
}

.fos-btn-primary {
  transition: background .16s;
}
.fos-btn-primary:hover {
  background: var(--accent-dark);
}

.fos-btn-outline {
  transition: border-color .16s;
}
.fos-btn-outline:hover {
  border-color: #cfccc3;
}
```

- [ ] **Step 2: Create `apps/web/components/screens/CommandCenter.tsx`**

Ported from `docs/reference/FundOS.dc.html:116-267`.

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { observer } from 'mobx-react-lite';
import { useFundOsStore } from '@/lib/store/StoreProvider';

const TODAY = 'Friday, 24 July';
const WHILE_AWAY =
  'Your AI team completed 9 tasks and drafted 2 proposals overnight, then flagged 3 decisions that need your judgement before it proceeds.';

export const CommandCenter = observer(function CommandCenter() {
  const store = useFundOsStore();
  const router = useRouter();

  if (!store.ready) {
    return <div style={{ padding: 30 }}>Loading FundOS…</div>;
  }

  return (
    <div data-screen-label="Command Center" style={{ maxWidth: 1180, margin: '0 auto', padding: '26px 30px 64px' }}>
      <div style={{ animation: 'fos-reveal .5s both' }}>
        <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: '.04em' }}>{TODAY}</div>
        <h1 style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 600, fontSize: 28, letterSpacing: '-.5px', margin: '5px 0 0' }}>Good morning, Maya</h1>
      </div>

      {/* while you were away */}
      <div
        style={{
          marginTop: 18,
          background: 'linear-gradient(115deg,#12291d,#0f1a14)',
          borderRadius: 16,
          padding: '22px 24px',
          color: '#eafaf1',
          display: 'flex',
          gap: 20,
          alignItems: 'flex-start',
          animation: 'fos-reveal .5s .05s both',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: 42,
            height: 42,
            flex: '0 0 42px',
            borderRadius: 11,
            background: 'rgba(31,157,99,.2)',
            border: '1px solid rgba(56,190,125,.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#7fd3a4',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, letterSpacing: '.09em', textTransform: 'uppercase', color: '#7fd3a4' }}>
            While you were away · 14 hrs
          </div>
          <div style={{ fontSize: 16, lineHeight: 1.5, maxWidth: 760, marginTop: 6 }}>{WHILE_AWAY}</div>
          <div style={{ display: 'flex', gap: 24, marginTop: 14, flexWrap: 'wrap' }}>
            {store.awayStats.map((s, i) => (
              <div key={i}>
                <span style={{ fontFamily: 'var(--font-space-grotesk)', fontSize: 23, fontWeight: 600 }}>{s.n}</span>{' '}
                <span style={{ fontSize: 11.5, color: '#9dccb2' }}>{s.l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, animation: 'fos-reveal .5s .1s both' }}>
        {store.kpis.map((k, i) => (
          <div key={i} style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12, padding: '15px 16px' }}>
            <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9.5, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              {k.label}
            </div>
            <div style={{ fontFamily: 'var(--font-space-grotesk)', fontSize: 28, fontWeight: 600, letterSpacing: '-.5px', marginTop: 8, lineHeight: 1 }}>
              {k.value}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 5 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 26, marginTop: 28, alignItems: 'start' }}>
        {/* approvals + recommended */}
        <section style={{ animation: 'fos-reveal .5s .15s both' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 13 }}>
            <h2 style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 600, fontSize: 16, margin: 0 }}>Needs your approval</h2>
            <div style={{ height: 1, flex: 1, background: 'var(--line)' }} />
            <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-ibm-plex-mono)' }}>{store.pendingApprovals.length} decisions</span>
          </div>

          {store.pendingApprovals.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {store.pendingApprovals.map((a) => {
                const showWhy = store.expandedId === a.id && store.expandedMode === 'why';
                const showReview = store.expandedId === a.id && store.expandedMode === 'review';
                return (
                  <div key={a.id} className="fos-card-hover" style={{ border: '1px solid var(--line)', borderRadius: 12, padding: '14px 16px', background: 'var(--panel)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-ibm-plex-mono)',
                          fontSize: 9.5,
                          letterSpacing: '.05em',
                          textTransform: 'uppercase',
                          padding: '2px 8px',
                          borderRadius: 5,
                          background: a.tint,
                          color: a.color,
                        }}
                      >
                        {a.tag}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>{a.agent}</span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 600, fontSize: 15.5, lineHeight: 1.25 }}>{a.title}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4 }}>{a.detail}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <button
                        className="fos-btn-primary"
                        onClick={() => store.approve(a.id)}
                        style={{
                          background: 'var(--accent)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 8,
                          padding: '7px 15px',
                          fontSize: 12.5,
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: 'var(--font-ibm-plex-sans)',
                        }}
                      >
                        Approve
                      </button>
                      <button
                        className="fos-btn-outline"
                        onClick={() => store.toggleExpand(a.id, 'review')}
                        style={{
                          background: 'var(--panel)',
                          color: 'var(--ink)',
                          border: '1px solid var(--line)',
                          borderRadius: 8,
                          padding: '7px 14px',
                          fontSize: 12.5,
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        Review
                      </button>
                      <button
                        onClick={() => store.toggleExpand(a.id, 'why')}
                        style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--accent-dark)', fontSize: 12.5, fontWeight: 500, cursor: 'pointer' }}
                      >
                        Ask why →
                      </button>
                    </div>
                    {showWhy && (
                      <div style={{ marginTop: 13, borderTop: '1px solid var(--line)', paddingTop: 13, animation: 'fos-reveal .2s both' }}>
                        <div
                          style={{
                            fontFamily: 'var(--font-ibm-plex-mono)',
                            fontSize: 9.5,
                            letterSpacing: '.06em',
                            textTransform: 'uppercase',
                            color: 'var(--accent-dark)',
                            marginBottom: 6,
                          }}
                        >
                          Why {a.agentName} recommends this
                        </div>
                        <div style={{ fontSize: 12.5, lineHeight: 1.55 }}>{a.whyText}</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '11px 0 10px' }}>
                          {a.evidence.map((ev, i) => (
                            <span key={i} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 6, background: 'var(--tint)', color: 'var(--accent-dark)', fontWeight: 500 }}>
                              ✓ {ev}
                            </span>
                          ))}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--muted)', background: '#faf9f6', border: '1px solid var(--line)', borderRadius: 8, padding: '9px 11px', lineHeight: 1.5 }}>
                          <b style={{ color: 'var(--ink)', fontWeight: 600 }}>If you decline — </b>
                          {a.declineText}
                        </div>
                      </div>
                    )}
                    {showReview && (
                      <div style={{ marginTop: 13, borderTop: '1px solid var(--line)', paddingTop: 13, animation: 'fos-reveal .2s both' }}>
                        <div
                          style={{
                            fontFamily: 'var(--font-ibm-plex-mono)',
                            fontSize: 9.5,
                            letterSpacing: '.06em',
                            textTransform: 'uppercase',
                            color: 'var(--muted)',
                            marginBottom: 8,
                          }}
                        >
                          {a.reviewTitle}
                        </div>
                        <div style={{ background: '#faf9f6', border: '1px solid var(--line)', borderRadius: 9, padding: '12px 14px' }}>
                          {a.reviewLines.map((ln, i) => (
                            <div key={i} style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 12, lineHeight: 1.6, color: 'var(--ink)', whiteSpace: 'pre-wrap' }}>
                              {ln}
                            </div>
                          ))}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 7 }}>Open to edit in full before sending, or approve as-is.</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ border: '1px dashed var(--line)', borderRadius: 12, padding: 26, textAlign: 'center', color: 'var(--muted)' }}>
              <div style={{ color: 'var(--accent)', fontSize: 22, marginBottom: 6 }}>✓</div>
              <div style={{ fontFamily: 'var(--font-space-grotesk)', fontSize: 15, color: 'var(--ink)' }}>All caught up</div>
              <div style={{ fontSize: 12.5, marginTop: 3 }}>Your AI team is proceeding autonomously on everything cleared.</div>
            </div>
          )}

          {/* recommended */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '26px 0 13px' }}>
            <h2 style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 600, fontSize: 16, margin: 0 }}>Recommended this week</h2>
            <div style={{ height: 1, flex: 1, background: 'var(--line)' }} />
            <button
              onClick={() => router.push('/opportunities')}
              style={{ background: 'none', border: 'none', color: 'var(--accent-dark)', fontSize: 12.5, fontWeight: 500, cursor: 'pointer' }}
            >
              See all 23 →
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 }}>
            {store.topOpportunities.map((o) => (
              <div
                key={o.id}
                className="fos-card-hover"
                onClick={() => store.openOpp(o.id)}
                style={{ border: '1px solid var(--line)', borderRadius: 12, padding: '13px 14px', background: 'var(--panel)', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--accent-dark)' }}>
                    {o.type}
                  </span>
                  <span style={{ fontFamily: 'var(--font-space-grotesk)', fontSize: 18, fontWeight: 600, color: 'var(--accent-dark)' }}>{o.score}</span>
                </div>
                <div style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 600, fontSize: 14.5, lineHeight: 1.2, margin: '6px 0 3px' }}>{o.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{o.funder}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 9, fontSize: 12, fontFamily: 'var(--font-ibm-plex-mono)' }}>
                  <span style={{ fontWeight: 500 }}>{o.amount}</span>
                  <span style={{ color: o.dColor }}>{o.deadline}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* activity */}
        <section style={{ animation: 'fos-reveal .5s .2s both' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 13 }}>
            <h2 style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 600, fontSize: 16, margin: 0 }}>Agent activity</h2>
            <div style={{ height: 1, flex: 1, background: 'var(--line)' }} />
          </div>
          <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12, padding: '2px 16px' }}>
            {store.activity.map((ev, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '13px 0', borderBottom: '1px solid var(--line)' }}>
                <div style={{ width: 46, flex: '0 0 46px', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, color: 'var(--faint)', paddingTop: 2 }}>{ev.time}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: 'var(--accent-dark)', fontWeight: 600 }}>{ev.agent}</div>
                  <div style={{ fontSize: 12.5, lineHeight: 1.45, marginTop: 1 }}>{ev.text}</div>
                </div>
              </div>
            ))}
            <div style={{ padding: '12px 0', textAlign: 'center' }}>
              <button
                onClick={() => router.push('/agents')}
                style={{ background: 'none', border: 'none', color: 'var(--accent-dark)', fontSize: 12.5, fontWeight: 500, cursor: 'pointer' }}
              >
                Full timeline →
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
});
```

- [ ] **Step 3: Replace `apps/web/app/(dashboard)/page.tsx` with the real Command Center route**

Overwrite the entire file (it currently holds Plan 1's placeholder):

```tsx
import { CommandCenter } from '@/components/screens/CommandCenter';

export default function HomePage() {
  return <CommandCenter />;
}
```

- [ ] **Step 4: Typecheck**

Run: `cd apps/web && npm run typecheck`
Expected: exits 0, no errors. If `store.pendingApprovals`/`store.topOpportunities` field access errors surface, cross-check the field name against Plan 1's `FundOsStore.ts` computeds — do not rename store fields to fix a typo here, fix the JSX instead.

- [ ] **Step 5: Build**

Run: `cd apps/web && npm run build`
Expected: `next build` completes successfully, producing a `/` route in the build output.

- [ ] **Step 6: Manual visual check**

Run: `cd apps/web && npm run dev`, open `http://localhost:3000`, and open `docs/reference/FundOS.dc.html` directly in a second browser tab for side-by-side comparison.
Expected: dark-green "While you were away · 14 hrs" banner with 4 stat pairs, 4 KPI tiles below it, a two-column layout with "Needs your approval" (3 approval cards: DOE LOI / risk-red tag, Ledger budget / amber tag, Atlas intro / green tag) and "Recommended this week" (2 top-scored opportunity cards — Horizon Europe 94 and DOE Carbon Negative Shot 88) on the left, "Agent activity" (6 timestamped entries) on the right. Click "Ask why →" on the first approval card — a green-bordered why-panel should expand with evidence chips. Click "Review" — it should replace the why-panel with a monospace draft preview. Click "Approve" — the card should disappear and the "N decisions" counter should decrement. Hover an approval card or a recommended-opportunity card — it should lift with a subtle shadow. Click "See all 23 →" and "Full timeline →" — each should navigate away (to `/opportunities` and `/agents`; both currently 404 until Plans 3/5 land, which is expected).

- [ ] **Step 7: Commit**

```bash
git add apps/web/app/globals.css apps/web/components/screens/CommandCenter.tsx "apps/web/app/(dashboard)/page.tsx"
git commit -m "feat: build Command Center screen"
```

---

## Task 2: Digital Twin screen (`/twin`)

**Files:**
- Create: `apps/web/components/screens/DigitalTwin.tsx`
- Create: `apps/web/app/(dashboard)/twin/page.tsx`

Ported from `docs/reference/FundOS.dc.html:269-362`. This screen has no `style-hover` attributes in the source, so no new CSS classes are needed here.

- [ ] **Step 1: Create `apps/web/components/screens/DigitalTwin.tsx`**

```tsx
'use client';

import { observer } from 'mobx-react-lite';
import { useFundOsStore } from '@/lib/store/StoreProvider';

const TWIN_COMPLETE = 87;

export const DigitalTwin = observer(function DigitalTwin() {
  const store = useFundOsStore();

  if (!store.ready) {
    return <div style={{ padding: 30 }}>Loading FundOS…</div>;
  }

  return (
    <div
      data-screen-label="Digital Twin"
      style={{ maxWidth: 1180, margin: '0 auto', padding: '26px 30px 64px', display: 'grid', gridTemplateColumns: '1fr 300px', gap: 28, alignItems: 'start' }}
    >
      <div style={{ animation: 'fos-reveal .45s both' }}>
        <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 14, padding: '22px 24px', display: 'flex', gap: 22, alignItems: 'center' }}>
          <div style={{ position: 'relative', width: 78, height: 78, flex: '0 0 78px' }}>
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: `conic-gradient(var(--accent) ${TWIN_COMPLETE}%,#e2dfd7 0)` }} />
            <div
              style={{
                position: 'absolute',
                inset: 9,
                borderRadius: '50%',
                background: 'var(--panel)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontFamily: 'var(--font-space-grotesk)', fontSize: 21, fontWeight: 600, lineHeight: 1 }}>
                {TWIN_COMPLETE}
                <span style={{ fontSize: 11 }}>%</span>
              </span>
              <span style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 7.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                complete
              </span>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--accent-dark)' }}>
              Organization Digital Twin
            </div>
            <h1 style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 600, fontSize: 30, margin: '3px 0 5px', letterSpacing: '-.5px' }}>{store.org?.name}</h1>
            <div style={{ fontSize: 14.5, color: 'var(--muted)', maxWidth: 560, lineHeight: 1.5 }}>{store.org?.mission}</div>
            <div style={{ display: 'flex', gap: 7, marginTop: 11, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'var(--tint)', color: 'var(--accent-dark)', fontWeight: 500 }}>
                {store.org?.stage}
              </span>
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#f0efe9', color: 'var(--muted)' }}>{store.org?.sector}</span>
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#f0efe9', color: 'var(--muted)' }}>{store.org?.hq}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 20 }}>
          {store.twinWithConfidence.map((g) => (
            <div key={g.group} style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12, padding: '15px 17px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 11 }}>
                <span style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9.5, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--accent-dark)' }}>
                  {g.group}
                </span>
                <div style={{ height: 1, flex: 1, background: 'var(--line)' }} />
              </div>
              {g.items.map((f) => (
                <div key={f.label} style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '6px 0', borderBottom: '1px solid #f2f1eb' }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{f.label}</span>
                  <span style={{ flex: 1, borderBottom: '1px dotted #d6d3ca', margin: '0 2px 3px' }} />
                  <span style={{ fontSize: 13, fontWeight: 500, textAlign: 'right' }}>{f.value}</span>
                  <span title={f.source} style={{ width: 7, height: 7, borderRadius: '50%', flex: '0 0 7px', background: f.confColor }} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <aside style={{ position: 'sticky', top: 12, animation: 'fos-slide .5s both' }}>
        <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12, padding: '16px 17px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', animation: 'fos-pulse 1.6s infinite' }} />
            <span style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 600, fontSize: 15 }}>Enriching now</span>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 13 }}>The twin updates itself continuously — no forms to fill.</div>
          {store.enriching.map((e, i) => (
            <div key={i} style={{ display: 'flex', gap: 9, padding: '9px 0', borderTop: '1px solid var(--line)' }}>
              <span style={{ width: 14, flex: '0 0 14px', color: e.color, paddingTop: 2 }}>{e.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 500, lineHeight: 1.3 }}>{e.title}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{e.src}</div>
              </div>
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--line)', marginTop: 8, paddingTop: 12 }}>
            <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9.5, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              Sources connected
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
              {store.sources.map((src) => (
                <span key={src} style={{ fontSize: 10.5, padding: '2px 9px', borderRadius: 20, border: '1px solid var(--line)', color: 'var(--muted)' }}>
                  {src}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12, padding: '16px 17px', marginTop: 14 }}>
          <div style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 600, fontSize: 15, marginBottom: 3 }}>What FundOS remembers</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 11 }}>Every change is logged — the twin never forgets.</div>
          {store.memory.map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: 9, padding: '8px 0', borderTop: '1px solid var(--line)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', marginTop: 6, flex: '0 0 6px' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, lineHeight: 1.35 }}>{m.t}</div>
                <div style={{ fontSize: 10.5, color: 'var(--faint)', fontFamily: 'var(--font-ibm-plex-mono)', marginTop: 1 }}>{m.ago}</div>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
});
```

- [ ] **Step 2: Create `apps/web/app/(dashboard)/twin/page.tsx`**

```tsx
import { DigitalTwin } from '@/components/screens/DigitalTwin';

export default function TwinPage() {
  return <DigitalTwin />;
}
```

- [ ] **Step 3: Typecheck**

Run: `cd apps/web && npm run typecheck`
Expected: exits 0, no errors.

- [ ] **Step 4: Build**

Run: `cd apps/web && npm run build`
Expected: `next build` completes successfully, producing both `/` and `/twin` routes in the build output.

- [ ] **Step 5: Manual visual check**

Run: `cd apps/web && npm run dev`, open `http://localhost:3000/twin` (or click "Digital Twin" in the sidebar), and compare against `docs/reference/FundOS.dc.html`'s Digital Twin screen.
Expected: a header card with a green conic-gradient completion ring reading "87%", "Verdantia" title and mission text, three pill badges (Series A / Climate AgTech / Nairobi + Wageningen); below it a 2-column grid of 6 fact panels (Identity, Financials, Innovation, Credentials, Team, Footprint), each with 4 label/value rows and a small colored confidence dot per row (green = high, amber = medium, red = low); a sticky right sidebar with a pulsing-dot "Enriching now" panel (4 rows) and connected-source pills, and below it a "What FundOS remembers" panel (4 timestamped entries). The sidebar's "Digital Twin" nav item should show as active (green left-border highlight).

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/screens/DigitalTwin.tsx "apps/web/app/(dashboard)/twin"
git commit -m "feat: build Digital Twin screen"
```

---

## Self-review notes

- **Spec coverage:** both screens named in the task are fully ported — Command Center's greeting/date, "while you were away" banner, 4 KPI tiles, "Needs your approval" list with per-card why/review expand panels and the "All caught up" empty state, "Recommended this week" top-2 opportunity cards, and "Agent activity" feed with "Full timeline →" (Task 1); Digital Twin's completion ring, org header, all 6 grouped fact panels with confidence dots, "Enriching now" sidebar, connected-sources pills, and "What FundOS remembers" sidebar (Task 2). Routing (`/` replaces the placeholder, `/twin` is new) matches the design doc's routing table. The `sc-for`/`sc-if` constructs in the source (`FundOS.dc.html:117-267,270-362`) all have a corresponding `.map()`/conditional in the ported JSX — cross-checked line by line against the read source.
- **Placeholder scan:** no "TODO"/"similar to above"/vague instructions anywhere in either component — every JSX block shown is complete, runnable TSX. The one intentionally inert piece (`store.openOpp(o.id)` on the top-opportunity cards rendering no visible overlay yet) is explicitly called out as a known, expected gap pending Plan 3, not a silent placeholder.
- **Type consistency:** every store field/computed/action referenced in both components (`ready, org, kpis, awayStats, activity, pendingApprovals, topOpportunities, approve, toggleExpand, expandedId, expandedMode, openCmd`-adjacent `openOpp`, `twinWithConfidence, enriching, sources, memory`) matches the exact names and shapes defined in Plan 1's `FundOsStore.ts` (verified by re-reading that file's Task 4 code directly, not from the summary). No new store state was introduced; the two mockup-only literals (`today`, the default-autonomy "while you were away" sentence) and the Digital Twin's hardcoded 87% completion figure are kept as local component constants, matching how the source itself hardcodes them in `renderVals()` rather than deriving them from store data.
