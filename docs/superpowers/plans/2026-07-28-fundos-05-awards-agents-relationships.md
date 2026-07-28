# FundOS Next.js Port — Plan 5: Awards, AI Orchestration & Relationships Screens

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port three independent, read-only screens from the mockup into real Next.js routes: Awards (`/awards`), AI Orchestration (`/agents`), and Relationships (`/relationships`). Each is a 1:1 visual port of its source markup, wired to the `FundOsStore` computeds/raw fields that Plan 1 already defined — no new store state, no navigation, no new data modules.

**Architecture:** One `components/screens/*.tsx` client component per screen (MobX `observer`), each rendered by a thin `app/(dashboard)/<route>/page.tsx`. Screens read `useFundOsStore()` directly; the shared `(dashboard)/layout.tsx` (Plan 1) already wraps every route in `AppShell` (sidebar + header), and `Header`'s `TITLE_MAP` (Plan 1, `components/shell/Header.tsx`) already has entries for `/awards`, `/agents`, and `/relationships`, so no shell changes are needed here. Inline styles are ported verbatim from the mockup; the two `style-hover="..."` occurrences in this scope (both static color swaps, no per-item dynamic color) become scoped CSS classes appended to `globals.css`, per the design doc's styling section.

**Tech Stack:** Next.js 15 (App Router, TypeScript), MobX + mobx-react-lite (`observer`), inline JSX style objects (no Tailwind). No automated tests — see Non-goals below.

**Source of truth:**
- `docs/reference/FundOS.dc.html:542-609` (Awards), `:425-510` (AI Orchestration), `:512-540` (Relationships) — copied verbatim below into JSX.
- `docs/superpowers/specs/2026-07-28-fundos-nextjs-port-design.md` — the design this plan implements.
- `docs/superpowers/plans/2026-07-28-fundos-01-scaffold-data.md` — the store/data contract this plan builds on. This plan invents no new store fields, actions, or data modules; it only reads existing computeds:
  - `store.awardsWithObligationColors` — `AwardRecord[]` with each obligation gaining `color`/`icon`.
  - `store.calendarWithColors` — `CalendarItem[]` with `color` added.
  - `store.pipelineWithColors` — `PipelineStage[]` with `dotBg`/`dotBorder`/`dotFg`/`mark`/`line` added.
  - `store.agentsWithStatusColor` — `Agent[]` with `statusColor` added.
  - `store.handoffs` — raw `Handoff[]`.
  - `store.learnWithColors` — `LearnedPattern[]` with `color` added.
  - `store.learnStats` — raw `LearnStats | null` (`{ winRate, trend }`).
  - `store.contactsWithWarmth` — `Contact[]` with `wColor`/`wTint` added.

**Non-goals (this pass):** No automated test suite — this port's verification is `tsc --noEmit` / `next build` passing plus a manual dev-server visual check against the source mockup, not TDD red/green cycles (see the design doc's Non-goals and Verification plan sections). No router navigation, no store actions, no new hover-state JS handlers beyond what's specified below — the "Echo drafted the report →" button and the learned-pattern rows have no `onClick` in the source and stay inert.

---

## File Structure

```
apps/web/
  components/
    screens/
      Awards.tsx              new — Awards screen (Task 1)
      AiOrchestration.tsx     new — AI Orchestration screen (Task 2)
      Relationships.tsx       new — Relationships screen (Task 3)
  app/
    (dashboard)/
      awards/
        page.tsx               new — renders <Awards />
      agents/
        page.tsx                new — renders <AiOrchestration />
      relationships/
        page.tsx                new — renders <Relationships />
    globals.css                 modified — two scoped hover classes appended (Tasks 1 and 3)
```

No changes to `lib/store/FundOsStore.ts`, `lib/data/*.ts`, or `components/shell/*` — all three screens consume the existing Plan 1 contract as-is.

---

## Task 1: Awards screen (`/awards`)

**Files:**
- Create: `apps/web/components/screens/Awards.tsx`
- Create: `apps/web/app/(dashboard)/awards/page.tsx`
- Modify: `apps/web/app/globals.css`

Ported from `docs/reference/FundOS.dc.html:542-609`. Two-column layout: award cards (name,
funder, amount, status pill, disbursed progress bar, current milestone, obligations list,
"next report" footer with an inert "Echo drafted the report →" button) on the left; a sticky
"Compliance calendar" card on the right. `sc-for list="{{ awards }}"` → `.map()` over
`store.awardsWithObligationColors`; the nested `sc-for list="{{ w.obligations }}"` → `.map()`
over each award's `obligations` array; `sc-for list="{{ calendar }}"` →  `.map()` over
`store.calendarWithColors`.

The report button's `style-hover="border-color:#cfccc3"` (`FundOS.dc.html:585`) is a static
color swap with no per-item dynamic value, so it becomes a scoped `.fos-hover-border:hover`
class in `globals.css` rather than a `useState`/`onMouseEnter` handler, per the design doc's
styling section.

- [ ] **Step 1: Create `apps/web/components/screens/Awards.tsx`**

```tsx
'use client';

import { observer } from 'mobx-react-lite';
import { useFundOsStore } from '@/lib/store/StoreProvider';

export const Awards = observer(function Awards() {
  const store = useFundOsStore();

  if (!store.ready) return <div style={{ padding: 30 }}>Loading FundOS…</div>;

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '24px 30px 64px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 28, alignItems: 'start', animation: 'fos-reveal .45s both' }}>
      <div>
        <div style={{ fontSize: 14.5, color: 'var(--muted)', maxWidth: 640, lineHeight: 1.55, marginBottom: 18 }}>
          Winning is the start. Echo runs each award — tracking disbursements, drafting reports, and clearing every obligation before it comes due.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {store.awardsWithObligationColors.map((w) => (
            <div key={w.id} style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9.5, letterSpacing: '.05em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: 5, background: 'var(--tint)', color: 'var(--accent-dark)' }}>{w.status}</span>
                <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>{w.funder}</span>
                <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-space-grotesk)', fontWeight: 600, fontSize: 18 }}>{w.amount}</span>
              </div>
              <div style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 600, fontSize: 19, letterSpacing: '-.3px', marginBottom: 15 }}>{w.name}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 15 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9.5, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted)' }}>Disbursed</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 7 }}>
                    <div style={{ flex: 1, height: 7, borderRadius: 4, background: '#eceae4', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${w.disbursed}%`, background: 'var(--accent)', borderRadius: 4 }} />
                    </div>
                    <span style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 12, fontWeight: 500 }}>{w.disbursed}%</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 11 }}>Current milestone</div>
                  <div style={{ fontSize: 12.5, fontWeight: 500, marginTop: 1 }}>{w.milestone}</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9.5, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted)' }}>Obligations</div>
                  <div style={{ marginTop: 7, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {w.obligations.map((ob, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                        <span style={{ width: 14, color: ob.color, fontWeight: 700, textAlign: 'center' }}>{ob.icon}</span>
                        <span style={{ flex: 1 }}>{ob.t}</span>
                        <span style={{ color: ob.color, fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 11 }}>{ob.due}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--line)', paddingTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>Next: <b style={{ color: 'var(--ink)', fontWeight: 600 }}>{w.nextReport}</b></span>
                <button className="fos-hover-border" style={{ marginLeft: 'auto', background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 8, padding: '6px 13px', fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'border-color .16s' }}>Echo drafted the report →</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <aside style={{ position: 'sticky', top: 12 }}>
        <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12, padding: '16px 17px' }}>
          <div style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 600, fontSize: 15, marginBottom: 3 }}>Compliance calendar</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>Echo prepares each item ahead of its due date.</div>
          {store.calendarWithColors.map((cal, i) => (
            <div key={i} style={{ display: 'flex', gap: 11, padding: '10px 0', borderTop: '1px solid var(--line)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: cal.color, marginTop: 5, flex: '0 0 8px' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 500, lineHeight: 1.3 }}>{cal.what}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{cal.award} · <span style={{ color: cal.color, fontWeight: 500 }}>{cal.when}</span></div>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
});
```

- [ ] **Step 2: Create `apps/web/app/(dashboard)/awards/page.tsx`**

```tsx
import { Awards } from '@/components/screens/Awards';

export default function AwardsPage() {
  return <Awards />;
}
```

- [ ] **Step 3: Append the hover class to `apps/web/app/globals.css`**

`apps/web/app/globals.css` already exists (created in Plan 1, Task 3) and currently ends with
the `::-webkit-scrollbar-thumb:hover` rule. Append this new rule at the end of the file:

```css

.fos-hover-border:hover {
  border-color: #cfccc3;
}
```

- [ ] **Step 4: Typecheck**

Run: `cd apps/web && npm run typecheck`
Expected: exits 0, no errors.

- [ ] **Step 5: Manual smoke check**

Run: `cd apps/web && npm run dev`, open `http://localhost:3000/awards`.
Expected: header reads "Awards & Compliance / Post-award management · run by Echo" (from
`Header.tsx`'s `TITLE_MAP`, Plan 1). Two award cards render on the left — Innovate UK Smart
Grant (£1.1M, 64% disbursed, green progress bar) and GCF Readiness Grant ($800K, 38%
disbursed) — each with a 3-line obligations list (red `!` for due items, green `✓` for ok,
grey `✓` for done) and a "Next:" footer line with an "Echo drafted the report →" button whose
border darkens slightly on hover. A sticky "Compliance calendar" card on the right lists 4
items with colored dots (red/amber/green) matching their urgency.

- [ ] **Step 6: Commit**

```bash
git add "apps/web/components/screens/Awards.tsx" "apps/web/app/(dashboard)/awards" apps/web/app/globals.css
git commit -m "feat: add Awards screen"
```

---

## Task 2: AI Orchestration screen (`/agents`)

**Files:**
- Create: `apps/web/components/screens/AiOrchestration.tsx`
- Create: `apps/web/app/(dashboard)/agents/page.tsx`

Ported from `docs/reference/FundOS.dc.html:425-510`. A dark "Live pipeline" strip showing 8
stages as connected dots (done/active/queued styling via `store.pipelineWithColors`), a
3-column grid of all 12 agent cards (`store.agentsWithStatusColor`), a "What Sage has learned"
list of 3 pattern/effect/playbook-update rows (`store.learnWithColors`, with the win-rate
summary from `store.learnStats`), and a sticky dark "Live handoffs" sidebar
(`store.handoffs`). No `style-hover` attributes appear in this source range, so no new CSS
classes are needed. Note the source's two independent `fos-reveal`/`fos-slide` animations live
on the left column and the aside respectively, not on the outer grid — that placement is
preserved below.

- [ ] **Step 1: Create `apps/web/components/screens/AiOrchestration.tsx`**

```tsx
'use client';

import { observer } from 'mobx-react-lite';
import { useFundOsStore } from '@/lib/store/StoreProvider';

export const AiOrchestration = observer(function AiOrchestration() {
  const store = useFundOsStore();

  if (!store.ready) return <div style={{ padding: 30 }}>Loading FundOS…</div>;

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '24px 30px 64px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 28, alignItems: 'start' }}>
      <div style={{ animation: 'fos-reveal .45s both' }}>
        <div style={{ fontSize: 14.5, color: 'var(--muted)', maxWidth: 640, lineHeight: 1.55, marginBottom: 18 }}>
          Twelve specialists run your funding operation end-to-end. They hand work to one another automatically and surface only the decisions that need you.
        </div>

        <div style={{ background: 'linear-gradient(160deg,#12291d,#0f1a14)', borderRadius: 14, padding: '18px 22px 16px', color: '#e9f7ef', marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4fd28b', animation: 'fos-pulse 1.6s infinite' }} />
            <span style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: '#7fd3a4' }}>Live pipeline</span>
            <span style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 600, fontSize: 14.5, marginLeft: 3 }}>Horizon Europe — Soil Health Mission</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: '#8fbfa4' }}>3 agents working · 2 queued</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            {store.pipelineWithColors.map((p) => (
              <div key={p.stage} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 14, right: '50%', width: '100%', height: 2, background: p.line, zIndex: 0 }} />
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: p.dotBg, border: `2px solid ${p.dotBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: p.dotFg, zIndex: 1, position: 'relative' }}>{p.mark}</div>
                <div style={{ fontSize: 10.5, marginTop: 8, color: '#dff2e7', fontWeight: 600 }}>{p.stage}</div>
                <div style={{ fontSize: 9.5, color: '#7fa891', fontFamily: 'var(--font-ibm-plex-mono)', marginTop: 1 }}>{p.agent}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {store.agentsWithStatusColor.map((ag) => (
            <div key={ag.name} style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12, padding: '13px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: ag.statusColor }} />
                <span style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 600, fontSize: 15.5 }}>{ag.name}</span>
                <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9, letterSpacing: '.04em', textTransform: 'uppercase', color: ag.statusColor }}>{ag.status}</span>
              </div>
              <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9.5, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--accent-dark)', marginBottom: 8 }}>{ag.role}</div>
              <div style={{ fontSize: 12.5, lineHeight: 1.45, minHeight: 36 }}>{ag.task}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 9, borderTop: '1px solid var(--line)', paddingTop: 8 }}>→ hands to <span style={{ color: 'var(--accent-dark)', fontWeight: 500 }}>{ag.handoff}</span></div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
            <h2 style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 600, fontSize: 16, margin: 0 }}>What Sage has learned</h2>
            <div style={{ height: 1, flex: 1, background: 'var(--line)' }} />
            <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-ibm-plex-mono)' }}>win rate {store.learnStats?.winRate ?? ''} · {store.learnStats?.trend ?? ''}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {store.learnWithColors.map((ln, i) => (
              <div key={i} style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12, padding: '13px 15px', display: 'grid', gridTemplateColumns: '1fr auto 1.1fr', gap: 16, alignItems: 'center' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 8.5, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--faint)', marginBottom: 2 }}>Pattern</div>
                  <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.35 }}>{ln.pattern}</div>
                </div>
                <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 12, color: ln.color, whiteSpace: 'nowrap', fontWeight: 500 }}>{ln.effect}</div>
                <div style={{ borderLeft: '1px solid var(--line)', paddingLeft: 16 }}>
                  <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 8.5, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--faint)', marginBottom: 2 }}>Playbook update</div>
                  <div style={{ fontSize: 12.5, color: 'var(--accent-dark)', lineHeight: 1.35 }}>{ln.action}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <aside style={{ position: 'sticky', top: 12, animation: 'fos-slide .5s both' }}>
        <div style={{ background: 'linear-gradient(160deg,#12291d,#0f1a14)', borderRadius: 12, padding: '16px 17px', color: '#e9f7ef' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4fd28b', animation: 'fos-pulse 1.6s infinite' }} />
            <span style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 600, fontSize: 15 }}>Live handoffs</span>
          </div>
          {store.handoffs.map((h, i) => (
            <div key={i} style={{ padding: '9px 0', borderTop: '1px solid rgba(255,255,255,.09)' }}>
              <div style={{ fontSize: 11.5, lineHeight: 1.4 }}>
                <span style={{ color: '#7fd3a4', fontWeight: 600 }}>{h.from}</span> → <span style={{ color: '#7fd3a4', fontWeight: 600 }}>{h.to}</span>
              </div>
              <div style={{ fontSize: 12, color: '#a9ccb8', marginTop: 2 }}>{h.what}</div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
});
```

- [ ] **Step 2: Create `apps/web/app/(dashboard)/agents/page.tsx`**

```tsx
import { AiOrchestration } from '@/components/screens/AiOrchestration';

export default function AgentsPage() {
  return <AiOrchestration />;
}
```

- [ ] **Step 3: Typecheck**

Run: `cd apps/web && npm run typecheck`
Expected: exits 0, no errors.

- [ ] **Step 4: Manual smoke check**

Run: `cd apps/web && npm run dev`, open `http://localhost:3000/agents`.
Expected: header reads "AI Orchestration / 12 specialists collaborating in real time". A dark
green-gradient "Live pipeline" strip shows 8 connected stage dots — the first 3 (Discovered,
Eligibility, Strategy) filled solid green with a "✓" mark, the next 3 (Writing, Budget,
Documents) amber with a "●" mark, the last 2 (Compliance, Submission) hollow/translucent with
no mark. Below it, a 3-column grid of 12 agent cards (Scout through Sage), each with a status
dot (green=working, amber=waiting, grey=idle), role, current task, and a "→ hands to X"
footer. A "What Sage has learned" section lists 3 rows with pattern/effect/playbook-update
columns, red or green effect text depending on `good`. A sticky dark "Live handoffs" card on
the right lists all 5 handoffs.

- [ ] **Step 5: Commit**

```bash
git add "apps/web/components/screens/AiOrchestration.tsx" "apps/web/app/(dashboard)/agents"
git commit -m "feat: add AI Orchestration screen"
```

---

## Task 3: Relationships screen (`/relationships`)

**Files:**
- Create: `apps/web/components/screens/Relationships.tsx`
- Create: `apps/web/app/(dashboard)/relationships/page.tsx`
- Modify: `apps/web/app/globals.css`

Ported from `docs/reference/FundOS.dc.html:512-540`. A single table-like card: a header row
(Contact/Organization/Warmth/Last touch/Next action) followed by one row per contact with a
colored warmth pill. `sc-for list="{{ contacts }}"` → `.map()` over
`store.contactsWithWarmth`. The row's `style-hover="background:#faf9f6"`
(`FundOS.dc.html:525`) is another static color swap, so it becomes a `.fos-hover-row:hover`
class appended to `globals.css`.

- [ ] **Step 1: Create `apps/web/components/screens/Relationships.tsx`**

```tsx
'use client';

import { observer } from 'mobx-react-lite';
import { useFundOsStore } from '@/lib/store/StoreProvider';

export const Relationships = observer(function Relationships() {
  const store = useFundOsStore();

  if (!store.ready) return <div style={{ padding: 30 }}>Loading FundOS…</div>;

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '24px 30px 64px', animation: 'fos-reveal .45s both' }}>
      <div style={{ fontSize: 14.5, color: 'var(--muted)', maxWidth: 640, lineHeight: 1.55, marginBottom: 18 }}>
        Atlas tracks every funder, program officer and partner — warmth, last touch, and the next best action, drafted and ready.
      </div>
      <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr .8fr 1fr 1.4fr', gap: 14, padding: '12px 18px', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9.5, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted)', borderBottom: '1px solid var(--line)' }}>
          <span>Contact</span>
          <span>Organization</span>
          <span>Warmth</span>
          <span>Last touch</span>
          <span>Next action</span>
        </div>
        {store.contactsWithWarmth.map((c) => (
          <div key={c.name} className="fos-hover-row" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr .8fr 1fr 1.4fr', gap: 14, padding: '14px 18px', alignItems: 'center', borderBottom: '1px solid #f2f1eb', transition: 'background .16s' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>{c.name}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{c.role}</div>
            </div>
            <div style={{ fontSize: 12.5 }}>{c.org}</div>
            <div>
              <span style={{ fontSize: 10.5, padding: '2px 9px', borderRadius: 20, background: c.wTint, color: c.wColor, fontWeight: 500 }}>{c.warmth}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-ibm-plex-mono)' }}>{c.last}</div>
            <div style={{ fontSize: 12.5, color: 'var(--accent-dark)' }}>{c.next}</div>
          </div>
        ))}
      </div>
    </div>
  );
});
```

- [ ] **Step 2: Create `apps/web/app/(dashboard)/relationships/page.tsx`**

```tsx
import { Relationships } from '@/components/screens/Relationships';

export default function RelationshipsPage() {
  return <Relationships />;
}
```

- [ ] **Step 3: Append the hover class to `apps/web/app/globals.css`**

Append this rule at the end of the file (after the `.fos-hover-border:hover` rule added in
Task 1):

```css

.fos-hover-row:hover {
  background: #faf9f6;
}
```

- [ ] **Step 4: Typecheck**

Run: `cd apps/web && npm run typecheck`
Expected: exits 0, no errors.

- [ ] **Step 5: Manual smoke check**

Run: `cd apps/web && npm run dev`, open `http://localhost:3000/relationships`.
Expected: header reads "Relationship Intelligence / Funders, officers & partners". A single
card holds a 5-column header row (Contact/Organization/Warmth/Last touch/Next action) and 5
contact rows (Dr. Lena Voss through Sofia Reyes), each with a colored warmth pill (red "Hot",
amber "Warm", blue "Cool") and a green "Next action" line. Hovering a row lightly tints its
background.

- [ ] **Step 6: Commit**

```bash
git add "apps/web/components/screens/Relationships.tsx" "apps/web/app/(dashboard)/relationships" apps/web/app/globals.css
git commit -m "feat: add Relationships screen"
```

---

## Task 4: Combined verification

**Files:** none (verification only — no new files).

- [ ] **Step 1: Full typecheck**

Run: `cd apps/web && npm run typecheck`
Expected: exits 0, no errors across the whole project (store, data layer, shell, and all three
new screens).

- [ ] **Step 2: Full production build**

Run: `cd apps/web && npm run build`
Expected: `next build` completes successfully. The route list in the build output includes
`/awards`, `/agents`, and `/relationships` alongside the existing `/` placeholder route from
Plan 1.

- [ ] **Step 3: Manual cross-route check**

Run: `cd apps/web && npm run dev`, then in the browser:
1. Visit `http://localhost:3000/awards`, `/agents`, `/relationships` directly by URL.
2. Click each of the "Awards", "AI Agents", and "Relationships" sidebar nav items from `/` and
   confirm the corresponding route loads and the clicked item gets the active (green
   left-border, tinted background) styling in `Sidebar.tsx`.
3. Confirm the "AI team is working" panel's "View orchestration →" link at the bottom of the
   sidebar (`Sidebar.tsx`, Plan 1) navigates to `/agents`.
4. Compare each screen side-by-side against `docs/reference/FundOS.dc.html` opened directly in
   a browser (or the earlier screenshot/read-through) for visual parity — colors, spacing,
   font weights, and copy should match exactly.

No commit for this task unless Step 1–3 surface a bug; if they do, fix it in the relevant
screen file from Task 1–3, re-run Steps 1–3, and commit the fix with a `fix:` message
referencing the screen.

---

## Self-review

**1. Spec coverage:**
- Awards (`/awards`, two-column: award cards + sticky compliance calendar) — Task 1. ✓
- AI Orchestration (`/agents`, live pipeline strip + 12-agent grid + learned-patterns list +
  sticky live-handoffs sidebar) — Task 2. ✓
- Relationships (`/relationships`, single table-like card with warmth pills) — Task 3. ✓
- All three routes registered under `app/(dashboard)/` so they inherit `AppShell` (sidebar +
  header) from Plan 1's `(dashboard)/layout.tsx` — no shell edits needed since `Sidebar.tsx`
  already derives active-nav-item styling from `usePathname()` against `nav.ts`'s `awards`/
  `agents`/`relationships` keys, and `Header.tsx`'s `TITLE_MAP` already has entries for all
  three paths. ✓
- `style-hover` DSL attributes: both occurrences in this scope (Awards report button,
  Relationships row) ported to scoped CSS classes per the design doc's styling guidance,
  since both are static color swaps with no per-item dynamic value. ✓
- Design tokens, fonts as CSS variables, `sc-for`/`sc-if` → `.map()`/conditional — applied
  throughout Tasks 1–3, consuming `var(--x)` tokens and `var(--font-*)` families exactly as
  Plan 1 declared them on `AppShell`'s root div. ✓
- Combined build/typecheck/manual verification — Task 4. ✓

**2. Placeholder scan:** No "TODO", "similar to above", or unfilled steps in this plan — every
code block above is complete, real TSX ready to save verbatim. The "Echo drafted the report →"
button and the learned-pattern rows are intentionally inert (no `onClick`), matching the
source mockup exactly (confirmed by re-reading `FundOS.dc.html:542-609` and `:425-510` — no
`go=` or click-handler attributes appear on those elements).

**3. Type consistency against Plan 1's store contract:** Cross-checked every field accessed in
this plan's JSX against the exact computed/interface shapes defined in
`docs/superpowers/plans/2026-07-28-fundos-01-scaffold-data.md`:
- `AwardRecord` (`awards.ts`): `id`, `name`, `funder`, `amount`, `status`, `disbursed`,
  `milestone`, `nextReport`, `obligations` (each `Obligation` gains `color`/`icon` via
  `awardsWithObligationColors`, fields `t`/`due`/`state` plus the added `color`/`icon`) — all
  used correctly in Task 1, no invented fields.
- `CalendarItem` (`awards.ts`): `what`, `award`, `when`, `urgency`, plus `color` added by
  `calendarWithColors` — used correctly; no `id` field exists on this interface, so the
  calendar list and obligations list both key off array index, matching the source's own
  `sc-for` (which has no stable id for these either).
- `PipelineStage` (`pipeline.ts`): `stage`, `agent`, `state`, plus `dotBg`/`dotBorder`/
  `dotFg`/`mark`/`line` added by `pipelineWithColors` — used correctly, keyed by `p.stage`
  (unique across the 8 stages).
- `Agent` (`agents.ts`): `name`, `role`, `status`, `task`, `handoff`, plus `statusColor` added
  by `agentsWithStatusColor` — used correctly, keyed by `ag.name` (unique across 12 agents).
- `LearnedPattern` (`learning.ts`): `pattern`, `effect`, `good`, `action`, plus `color` added
  by `learnWithColors` — used correctly, keyed by index (no id in the interface).
- `LearnStats` (`learning.ts`): `winRate`, `trend` — the store field is typed
  `LearnStats | null` (per `FundOsStore.ts`'s raw `learnStats` observable), so Task 2 accesses
  it via `store.learnStats?.winRate ?? ''` / `store.learnStats?.trend ?? ''` rather than
  assuming non-null, keeping this plan's TSX consistent with Plan 1's actual field type
  instead of silently relying on the `ready` guard to narrow an unrelated property.
- `Handoff` (`agents.ts`): `from`, `to`, `what` — used correctly via the raw `store.handoffs`
  array (no color augmentation needed, matching the source, which renders handoffs with fixed
  colors, not per-item computed ones), keyed by index.
- `Contact` (`contacts.ts`): `name`, `role`, `org`, `warmth`, `last`, `next`, plus `wColor`/
  `wTint` added by `contactsWithWarmth` — used correctly, keyed by `c.name` (unique across the
  5 mock contacts).
- No new observables, actions, or computeds were added to `FundOsStore.ts`, and no new
  `lib/data/*.ts` fields were invented — this plan is read-only against Plan 1's existing
  contract, as scoped.
