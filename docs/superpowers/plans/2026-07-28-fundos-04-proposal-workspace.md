# FundOS Next.js Port — Plan 4: Proposal Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the mockup's Proposal Workspace screen (`docs/reference/FundOS.dc.html:611-761`) to a real Next.js route at `/proposal`, as a 3-column layout: section outline + version history (left), the active section's document body (center, with a hardcoded special case for the "Impact" section), and an AI review panel — predicted reviewer score, compliance, citations, action buttons (right).

**Architecture:** One new client component, `components/screens/ProposalWorkspace.tsx`, wrapped in `observer(...)` from `mobx-react-lite` and consuming `useFundOsStore()`. A thin server-component route file, `app/(dashboard)/proposal/page.tsx`, renders it inside the existing `(dashboard)` layout (which already supplies `AppShell`, the sidebar, and the header — this plan does not touch those). All data comes from the store contract defined in Plan 1 (`FundOsStore.ts`): `proposalSectionsUi`, `versions`, `currentSection`, `isImpactSection`, `showAlts`/`toggleAlts()`, `setSection(i)`, `compliance`, `citations`. The Impact section's three paragraphs, the AI-critique card, the two alternative-phrasing cards, and the reviewer-score gauge's numbers are literal hardcoded JSX/text in this screen (not store-driven), copied verbatim from the source.

**Tech Stack:** Next.js 15 (App Router, TypeScript), React 19, MobX + mobx-react-lite. No CSS framework — inline `style` objects ported 1:1 from the source's inline `style="..."` strings. No test runner; verification is `tsc --noEmit` / `next build` passing plus a manual `next dev` visual check against the source mockup (see Non-goals in `docs/superpowers/specs/2026-07-28-fundos-nextjs-port-design.md`).

**Source of truth:** `docs/reference/FundOS.dc.html:611-761` (the markup being ported) and `docs/superpowers/plans/2026-07-28-fundos-01-scaffold-data.md` (the store/data contract this plan builds against — read in full before this plan; do not invent field/action names not present there).

---

## Prerequisite

This plan assumes Plan 1 (`docs/superpowers/plans/2026-07-28-fundos-01-scaffold-data.md`) is already implemented and `npm run build` passes for `apps/web` standalone (its own Task 14, Step 5). In particular this plan depends on, unmodified:

- `apps/web/lib/store/FundOsStore.ts` — `proposalSectionsUi`, `currentSection`, `isImpactSection`, `showAlts`, `toggleAlts()`, `setSection(i)`, `versions`, `compliance`, `citations`, `ready`.
- `apps/web/lib/store/StoreProvider.tsx` — `useFundOsStore()`.
- `apps/web/components/shell/AppShell.tsx` and `apps/web/app/(dashboard)/layout.tsx` — already renders the shell around every route; this plan only adds a new route inside it.
- Design tokens (`--ink`, `--accent`, `--amber`, etc.) declared on `AppShell`'s root `<div>` — consumed here as `var(--x)`.
- Fonts exposed as `var(--font-space-grotesk)`, `var(--font-ibm-plex-sans)`, `var(--font-ibm-plex-mono)`.

No changes to `lib/data/*.ts`, the store, or shell components are needed for this plan — the Proposal Workspace screen is purely additive.

---

## File Structure

```
apps/web/
  app/
    (dashboard)/
      proposal/
        page.tsx                     new — route for /proposal, renders <ProposalWorkspace />
  components/
    screens/
      ProposalWorkspace.tsx          new — the 3-column Proposal Workspace screen
```

`components/screens/` does not exist yet in this repo (Plan 1 only created `components/shell/`); this plan creates the directory implicitly by writing the first file into it.

---

## Task 1: `ProposalWorkspace` screen component

**Files:**
- Create: `apps/web/components/screens/ProposalWorkspace.tsx`

Ported from `docs/reference/FundOS.dc.html:611-761`. `sc-for list="{{ sections }}"` and
`sc-for list="{{ versions }}"` become `.map()` over `store.proposalSectionsUi` /
`store.versions`; `sc-if value="{{ isImpact }}"` / `sc-if value="{{ notImpact }}"` become a
single JS ternary on `store.isImpactSection` (the source's two mutually-exclusive `sc-if`
blocks collapse to one `if/else`); `sc-if value="{{ showAlts }}"` becomes
`{store.showAlts && (...)}`. The `style-hover="..."` attributes on the section-outline
buttons and the two right-rail action buttons have no direct React equivalent (per the design
doc's styling section) — this plan handles all three with local `useState` hover flags rather
than a shared `globals.css` class, since `globals.css` is a file other in-flight screen plans
may also be touching and a component-local `onMouseEnter`/`onMouseLeave` avoids any collision.

- [ ] **Step 1: Create `apps/web/components/screens/ProposalWorkspace.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useFundOsStore } from '@/lib/store/StoreProvider';

export const ProposalWorkspace = observer(function ProposalWorkspace() {
  const store = useFundOsStore();
  const [hoveredSectionIdx, setHoveredSectionIdx] = useState<number | null>(null);
  const [strengthenHover, setStrengthenHover] = useState(false);
  const [verifyHover, setVerifyHover] = useState(false);

  if (!store.ready) return null;

  const curSec = store.currentSection;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '230px 1fr 300px', height: '100%', animation: 'fos-fade .4s both' }}>
      {/* outline */}
      <div style={{ borderRight: '1px solid var(--line)', padding: '20px 16px', overflowY: 'auto' }}>
        <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9.5, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12 }}>Sections</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {store.proposalSectionsUi.map((sec) => (
            <button
              key={sec.i}
              onClick={() => store.setSection(sec.i)}
              onMouseEnter={() => setHoveredSectionIdx(sec.i)}
              onMouseLeave={() => setHoveredSectionIdx(null)}
              style={{
                textAlign: 'left',
                border: 'none',
                background: hoveredSectionIdx === sec.i ? '#efeee9' : sec.bg,
                borderRadius: 9,
                padding: '10px 11px',
                cursor: 'pointer',
                transition: 'background .16s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: sec.dot, flex: '0 0 7px' }} />
                <span style={{ fontSize: 13, fontWeight: sec.weight, color: 'var(--ink)' }}>{sec.name}</span>
                <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, color: 'var(--muted)' }}>{sec.pct}%</span>
              </div>
              <div style={{ height: 3, borderRadius: 2, background: '#eceae4', marginTop: 8, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${sec.pct}%`, background: sec.dot }} />
              </div>
            </button>
          ))}
        </div>

        <div style={{ marginTop: 22, borderTop: '1px solid var(--line)', paddingTop: 14 }}>
          <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9.5, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>Version history</div>
          {store.versions.map((v, i) => (
            <div key={i} style={{ display: 'flex', gap: 9, padding: '5px 0' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: v.color, marginTop: 5, flex: '0 0 7px' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.3 }}>{v.label}</div>
                <div style={{ fontSize: 10.5, color: 'var(--muted)', fontFamily: 'var(--font-ibm-plex-mono)', marginTop: 1 }}>{v.when}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* document */}
      <div style={{ overflowY: 'auto', padding: '34px 8%', background: 'var(--panel)' }}>
        <div style={{ maxWidth: 660, margin: '0 auto' }}>
          <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--accent-dark)' }}>
            Horizon Europe · Soil Health Mission — Section {curSec.num}
          </div>
          <h1 style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 600, fontSize: 27, letterSpacing: '-.4px', margin: '8px 0 6px' }}>{curSec.name}</h1>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 22, fontSize: 11.5, color: 'var(--muted)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: curSec.dot }} /> {curSec.statusLabel} · {curSec.pct}% · last edited by{' '}
            <span style={{ color: 'var(--accent-dark)', fontWeight: 500 }}>Quill</span> {curSec.ago}
          </div>

          {store.isImpactSection ? (
            <>
              <p style={{ fontSize: 15.5, lineHeight: 1.72, margin: '0 0 16px' }}>
                Verdantia's biochar-based soil amendment addresses two of the Mission's headline objectives simultaneously: restoring degraded agricultural land and delivering measurable, durable carbon removal.{' '}
                <span style={{ background: 'var(--tint)', borderBottom: '2px solid var(--accent)', padding: '1px 2px' }}>
                  In field trials across 4,200 enrolled smallholdings in Kisumu, treated plots showed a 40% average yield uplift within two seasons.
                </span>
              </p>
              <p style={{ fontSize: 15.5, lineHeight: 1.72, margin: '0 0 16px' }}>
                The pathway to impact extends from farm to policy. By 2028 the consortium will have generated an open MRV dataset covering 18,000 hectares,{' '}
                <span style={{ background: 'var(--amber-t)', borderBottom: '2px dashed var(--amber)', padding: '1px 2px' }} title="AI-flagged: weak evidence">
                  establishing the reference methodology for soil-carbon verification across the region.
                </span>
              </p>
              <p style={{ fontSize: 15.5, lineHeight: 1.72, margin: '0 0 16px' }}>
                Beyond environmental returns, the intervention strengthens food security and rural livelihoods, aligning with SDGs 2, 13 and 15 and the EU's Farm-to-Fork commitments.
              </p>

              <div style={{ margin: '26px 0', border: '1px solid #ecd9b0', background: 'var(--amber-t)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#8a5e15" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 9v4M12 17h.01" />
                    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
                  </svg>
                  <span style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 600, fontSize: 13.5, color: '#7a520f' }}>Quill flagged a weak argument</span>
                </div>
                <div style={{ fontSize: 13, color: '#6e4d17', lineHeight: 1.5, marginBottom: 11 }}>
                  "Establishing the reference methodology" is asserted without evidence. Reviewers on this call score Impact partly on <em>credibility of the pathway</em>. Suggest citing the Verra VM0042 alignment already in your Digital Twin.
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={{ background: '#8a5e15', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 13px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    Apply Quill's revision
                  </button>
                  <button
                    onClick={() => store.toggleAlts()}
                    style={{ background: 'transparent', border: '1px solid #ceb377', color: '#7a520f', borderRadius: 7, padding: '6px 13px', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
                  >
                    See 2 alternatives
                  </button>
                </div>
              </div>

              {store.showAlts && (
                <div style={{ margin: '0 0 26px', display: 'flex', flexDirection: 'column', gap: 10, animation: 'fos-reveal .2s both' }}>
                  <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9.5, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--accent-dark)' }}>
                    Quill · two stronger phrasings
                  </div>
                  <div style={{ border: '1px solid var(--line)', borderRadius: 11, padding: '13px 15px', background: 'var(--panel)' }}>
                    <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9.5, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Evidence-led</div>
                    <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                      "Building on our Verra VM0042 validation, the consortium will publish the region's first open, third-party-verified soil-carbon MRV dataset across 18,000 hectares by 2028."
                    </div>
                    <button style={{ marginTop: 10, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 13px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      Use this
                    </button>
                  </div>
                  <div style={{ border: '1px solid var(--line)', borderRadius: 11, padding: '13px 15px', background: 'var(--panel)' }}>
                    <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9.5, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Policy-led</div>
                    <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                      "By anchoring the dataset to Verra VM0042 and EU Farm-to-Fork targets, the project hands policymakers a ready reference methodology for regional soil-carbon accreditation."
                    </div>
                    <button style={{ marginTop: 10, background: 'var(--panel)', color: 'var(--ink)', border: '1px solid var(--line)', borderRadius: 7, padding: '6px 13px', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                      Use this
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <p style={{ fontSize: 15.5, lineHeight: 1.72, margin: '0 0 16px' }}>{curSec.b0}</p>
              <p style={{ fontSize: 15.5, lineHeight: 1.72, margin: '0 0 16px' }}>{curSec.b1}</p>
              <div style={{ margin: '26px 0', border: '1px solid #c9e6d5', background: 'var(--tint)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: 'var(--accent-dark)', fontWeight: 700, fontSize: 15 }}>✓</span>
                <span style={{ fontSize: 13, color: '#245c40', lineHeight: 1.5 }}>Quill drafted this section — no open issues. Ask for a critique whenever you're ready to sharpen it.</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* AI panel */}
      <div style={{ borderLeft: '1px solid var(--line)', overflowY: 'auto', padding: '20px 17px', background: 'var(--paper)' }}>
        {/* reviewer perception */}
        <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12, padding: '15px 16px', marginBottom: 14 }}>
          <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9.5, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted)' }}>Predicted reviewer score</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '8px 0 10px' }}>
            <span style={{ fontFamily: 'var(--font-space-grotesk)', fontSize: 34, fontWeight: 600, color: 'var(--accent-dark)', lineHeight: 1 }}>79</span>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>/ 100 · funded threshold 72</span>
          </div>
          <div style={{ height: 8, borderRadius: 5, background: '#eceae4', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: '0 auto 0 0', width: '79%', background: 'linear-gradient(90deg,#1f9d63,#2fbf7d)', borderRadius: 5 }} />
            <div style={{ position: 'absolute', top: -3, bottom: -3, left: '72%', width: 2, background: 'var(--ink)' }} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5, marginTop: 11 }}>
            Above funded threshold. <span style={{ color: 'var(--ink)', fontWeight: 500 }}>Impact</span> is the swing factor — resolving the flagged claim lifts the estimate to ~84.
          </div>
        </div>

        {/* compliance */}
        <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12, padding: '15px 16px', marginBottom: 14 }}>
          <div style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 600, fontSize: 14, marginBottom: 11 }}>Compliance — Sentinel</div>
          {store.compliance.map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', padding: '6px 0' }}>
              <span style={{ width: 16, flex: '0 0 16px', color: c.color, fontSize: 13, fontWeight: 700, textAlign: 'center' }}>{c.icon}</span>
              <span style={{ fontSize: 12.5, lineHeight: 1.4, color: c.textColor }}>{c.text}</span>
            </div>
          ))}
        </div>

        {/* fact check */}
        <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12, padding: '15px 16px', marginBottom: 14 }}>
          <div style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 600, fontSize: 14, marginBottom: 11 }}>Fact-check &amp; citations</div>
          {store.citations.map((ct, i) => (
            <div key={i} style={{ padding: '9px 0', borderTop: '1px solid var(--line)' }}>
              <div style={{ fontSize: 12.5, lineHeight: 1.45, fontStyle: 'italic' }}>{ct.claim}</div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 5 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: ct.color, flex: '0 0 7px' }} />
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>{ct.source}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onMouseEnter={() => setStrengthenHover(true)}
            onMouseLeave={() => setStrengthenHover(false)}
            style={{
              background: strengthenHover ? 'var(--accent-dark)' : 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 9,
              padding: 10,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-ibm-plex-sans)',
              transition: 'background .16s',
            }}
          >
            Strengthen this section
          </button>
          <button
            onMouseEnter={() => setVerifyHover(true)}
            onMouseLeave={() => setVerifyHover(false)}
            style={{
              background: 'var(--panel)',
              color: 'var(--ink)',
              border: `1px solid ${verifyHover ? '#cfccc3' : 'var(--line)'}`,
              borderRadius: 9,
              padding: 10,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'border-color .16s',
            }}
          >
            Verify all facts
          </button>
        </div>
      </div>
    </div>
  );
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/components/screens/ProposalWorkspace.tsx
git commit -m "feat: add ProposalWorkspace screen component"
```

---

## Task 2: Wire the `/proposal` route

**Files:**
- Create: `apps/web/app/(dashboard)/proposal/page.tsx`

The `(dashboard)` route group's `layout.tsx` (from Plan 1, Task 14) already wraps every route
in `AppShell`, so this file only needs to render the screen component. It can stay a plain
Server Component — `ProposalWorkspace` itself carries the `'use client'` directive, and
Next.js allows Server Components to render Client Components as children.

- [ ] **Step 1: Create `apps/web/app/(dashboard)/proposal/page.tsx`**

```tsx
import { ProposalWorkspace } from '@/components/screens/ProposalWorkspace';

export default function ProposalPage() {
  return <ProposalWorkspace />;
}
```

- [ ] **Step 2: Typecheck**

Run: `cd apps/web && npm run typecheck`
Expected: exits cleanly, no TypeScript errors (in particular, no mismatch between
`store.proposalSectionsUi[].{name,pct,dot,i,bg,weight}`, `store.currentSection.{num,name,pct,dot,statusLabel,ago,b0,b1}`,
`store.versions[].{label,when,color}`, `store.compliance[].{icon,color,text,textColor}`, or
`store.citations[].{claim,source,color}` and what `ProposalWorkspace.tsx` reads off them).

- [ ] **Step 3: Build**

Run: `cd apps/web && npm run build`
Expected: `next build` completes successfully, producing a `/proposal` route in the build
output alongside the existing routes, no TypeScript or React errors.

- [ ] **Step 4: Manual dev-server visual check**

Run: `cd apps/web && npm run dev`, open `http://localhost:3000/proposal`, and compare against
`docs/reference/FundOS.dc.html` (open directly in a browser) side by side. Confirm:

- Left rail lists all 6 sections (Excellence, Impact, Implementation, Budget, Consortium,
  Ethics & Data) each with a colored status dot, a percentage, and a thin progress bar; the
  active section has a light `#f2f1eb` background and bold (600-weight) label. Clicking a
  different section updates the highlighted row and the center document immediately.
- "Version history" below the outline lists 4 entries with colored dots, label, and relative
  timestamp ("4 min ago", etc.).
- With "Impact" selected (the default — `store.proposalSection` starts at `1`): the center
  column shows three paragraphs of prose, the first with a green-highlighted inline citation
  (light green background, green underline), the second with an amber dashed-underline phrase
  that shows the tooltip "AI-flagged: weak evidence" on hover. Below that, an amber card titled
  "Quill flagged a weak argument" with a warning-triangle icon and two buttons. Clicking "See 2
  alternatives" reveals two additional cards ("Evidence-led" and "Policy-led" phrasings, each
  with a "Use this" button); clicking it again hides them.
- Selecting any other section (e.g. "Excellence") replaces the center column with two plain
  paragraphs and a green "Quill drafted this section — no open issues" confirmation box — the
  amber critique card must not appear for non-Impact sections.
- The right rail shows a "Predicted reviewer score" card with "79 / 100 · funded threshold 72",
  a green horizontal gauge bar filled to 79% with a dark vertical tick at the 72% mark, and the
  "resolving the flagged claim lifts the estimate to ~84" note below it — this card's content
  is hardcoded and does not change when switching sections.
- "Compliance — Sentinel" lists 4 rows (3 green checkmarks, 1 amber "!") and "Fact-check &
  citations" lists 2 italic claims each with a colored dot and source line — like the reviewer
  score card, this panel is not per-section in the source, so it also stays constant across
  section switches.
- "Strengthen this section" (solid green) and "Verify all facts" (outlined) buttons render at
  the bottom of the right rail; hovering swaps the green button to the darker green and adds a
  slightly darker border to the outlined button. Neither button needs to do anything on click.
- Navigating to `/proposal` via the sidebar's "Proposals" nav item highlights that item active
  (this is handled by the existing `Sidebar` component from Plan 1 — no change needed here).

- [ ] **Step 5: Commit**

```bash
git add "apps/web/app/(dashboard)/proposal"
git commit -m "feat: wire /proposal route to ProposalWorkspace"
```

---

## Self-review

**1. Spec coverage** — every element called out in the task description is implemented:

- Left rail: 6-section outline (`store.proposalSectionsUi.map`, click → `store.setSection(sec.i)`)
  ✓, version history (`store.versions.map`) ✓.
- Center: `store.isImpactSection` special case with the three verbatim paragraphs (including
  the green-highlighted citation span and the amber dashed/`title`-tooltip span), the amber
  critique card with the warning SVG and the two buttons (one no-op, one
  `store.toggleAlts()`), and the two verbatim alternative-phrasing cards gated on
  `store.showAlts` ✓. Generic-section case: `curSec.b0`/`curSec.b1` plus the green confirmation
  box ✓.
- Right rail: hardcoded 79/100 gauge with the 72% threshold tick and literal gradient
  (`linear-gradient(90deg,#1f9d63,#2fbf7d)`) ✓, `store.compliance`-driven compliance card ✓,
  `store.citations`-driven fact-check card ✓, two no-op action buttons with hover states ✓.
- Header line hardcoded to "Horizon Europe · Soil Health Mission — Section {curSec.num}",
  intentionally not wired to `store.selectedOpportunity` ✓.
- Route: `/proposal` via `app/(dashboard)/proposal/page.tsx` ✓.
- Every inline `style="..."` from `FundOS.dc.html:611-761` ported to a camelCase style object
  with the same colors/spacing/radii/animation values (`fos-fade`, `fos-reveal` keyframe names
  preserved verbatim so they resolve against the `globals.css` keyframes Plan 1 already
  defined) ✓. `sc-for` → `.map()`, `sc-if` → ternary/`&&` ✓.

**2. Placeholder scan** — no "TODO", "similar to above", or unfilled step in this plan; both
Impact-branch paragraphs/cards and the non-Impact branch are written out in full in Task 1
Step 1, not summarized. The two right-rail buttons are explicitly documented as no-ops
(matching the source, which doesn't attach an `onClick` to either).

**3. Type consistency against Plan 1's store contract** — cross-checked every property this
component reads against `FundOsStore.ts` (Plan 1, Task 4) and the `lib/data/proposal.ts` /
`lib/data/versions.ts` interfaces (Plan 1, Task 11):

- `store.proposalSectionsUi[]`: `{ name, pct, dot, i, active, bg, weight }` — this component
  uses `name`, `pct`, `dot`, `i`, `bg`, `weight` (all present); `active` is not read directly
  since `bg`/`weight` already encode active-vs-inactive, matching the source template which
  does the same.
- `store.currentSection`: `{ num, name, pct, dot, statusLabel, ago, b0, b1 }` — all eight
  fields are used (`b0`/`b1` only in the non-Impact branch).
- `store.isImpactSection: boolean`, `store.showAlts: boolean`, `store.toggleAlts(): void`,
  `store.setSection(i: number): void` — all called with the exact names/signatures from Plan 1.
- `store.versions[]`: `VersionEntry = { label, when, color }` — all three used.
- `store.compliance[]`: `ComplianceItem = { icon, color, text, textColor }` — all four used.
- `store.citations[]`: `Citation = { claim, source, color }` — all three used.
- No new observable, action, or computed was introduced on the store — this plan only adds
  presentation components, per the design doc's instruction that screen plans must not add ad
  hoc component state duplicating store concerns (the three `useState` hover flags here are
  pure UI-only, session-less presentation state with no equivalent in the source's `state`
  object, which is the documented exception for `style-hover` ports).

**Judgment call flagged for the caller:** the design doc leaves the `style-hover` → React
translation "per-occurrence" without mandating local state vs. a `globals.css` class. This plan
chose local `useState` hover flags for all three occurrences in this screen, to avoid touching
the shared `globals.css` file that other in-flight screen plans (5, 6) may also need to edit —
reducing merge risk if those plans run in parallel worktrees.
