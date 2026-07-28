# FundOS Next.js Port — Plan 6: Global Overlays (Auth, Onboarding, Command Palette)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the three global overlays that gate/float above the whole dashboard regardless
of route — `AuthModal`, `OnboardingModal`, `CmdKPalette` — wire the ⌘K / Escape global keyboard
listener, and render all three as siblings inside `AppShell`, matching
`docs/reference/FundOS.dc.html`'s auth/onboarding/command-palette flow 1:1.

**Architecture:** Each overlay is a `'use client'` MobX `observer` component under
`components/overlays/`, self-gating on its own store boolean (`authOpen`, `onboardingOpen`,
`cmdOpen`) so `AppShell` can render all three unconditionally as siblings and let each decide
whether to render anything. `CmdKPalette` owns the ⌘K/Escape `window` keydown listener via a
`useEffect`, and builds its 6-command list as a local literal array (not store state) because
each command's action needs `useRouter()` for navigation — the store deliberately has no
`screen` field (see Plan 1's Contract section and the design doc's routing section). Static,
non-dynamic hover states (`style-hover` in the source) become small scoped CSS classes appended
to `globals.css`, per the design doc's styling section.

**Tech Stack:** Next.js 15 (App Router, TypeScript), React 19, MobX + mobx-react-lite,
`next/navigation` (`useRouter`). No test runner — this port's verification is `next build` /
`tsc --noEmit` passing plus a manual visual/behavioral check (see design doc Non-goals).

**Source of truth:** `docs/reference/FundOS.dc.html` lines 900–1124 (Auth, Onboarding, Command
Palette markup), lines 1342–1364 (action methods + `componentDidMount`/`componentWillUnmount`
keyboard listener), lines 1445–1455 (`cmdBase`, `cmdItems`, `cmdEmpty`). Store contract:
`docs/superpowers/plans/2026-07-28-fundos-01-scaffold-data.md` (`FundOsStore.ts`, Task 4).

---

## Contract check against Plan 1's store

Every store field/action/computed this plan needs already exists in Plan 1's `FundOsStore.ts`
— no new store fields are introduced by this plan:

- Observables: `authOpen`, `authMode`, `onboardingOpen`, `onboardStep`, `url`, `cmdOpen`,
  `cmdQuery`, `scanning`, `readyStats`.
- Actions: `setAuthMode(mode)`, `submitAuth()`, `setUrl(value)`, `startBuild()`,
  `answerInterview(value)`, `skipInterview()`, `enterApp()`, `openCmd()`, `closeCmd()`,
  `toggleCmd()`, `setCmdQuery(value)`, `approve(id)`, `openOpp(id)`, `closeOpp()`.
- Computed: `authTitle`, `authSub`, `authCta`, `currentInterviewQuestion`, `interviewNumber`,
  `interviewPercent`.

There is no `isSignup`/`isSignin` computed on the store (the source derives these inline in
`renderVals()` as `s.authMode==='signin'`/`s.authMode==='signup'`) — per the task brief, this
plan compares `store.authMode === 'signup'` / `=== 'signin'` directly inside `AuthModal`
instead of adding new store computeds. Likewise `cmdItems`/`cmdEmpty` are derived locally in
`CmdKPalette` via `useMemo`, not on the store, because the 6 base commands close over
`useRouter()`.

---

## File Structure

```
apps/web/
  app/
    globals.css                        MODIFY — append overlay hover classes
  components/
    overlays/
      AuthModal.tsx                     NEW
      OnboardingModal.tsx               NEW
      CmdKPalette.tsx                   NEW
    shell/
      AppShell.tsx                      MODIFY — render the three overlays as siblings
```

---

## Task 1: Overlay hover styles in `globals.css`

**Files:**
- Modify: `apps/web/app/globals.css`

The source uses `style-hover="..."` (a dc-runtime-only pseudo-class-via-attribute) on several
buttons/rows across these three overlays. None of them depend on a per-item dynamic color, so
per the design doc's styling section these become small scoped CSS classes rather than
`onMouseEnter`/`onMouseLeave` handlers. Four classes cover every `style-hover` occurrence in
`docs/reference/FundOS.dc.html:900-1124`:

- `.fos-btn-accent:hover` — the submit button (line 970), "Build my Digital Twin" (line 997),
  and "Enter FundOS →" (line 1082) all use `style-hover="background:var(--accent-dark)"`.
- `.fos-dropzone:hover` — the upload dropzone (line 999) uses
  `style-hover="border-color:#4fd28b"`.
- `.fos-chip:hover` — interview chip buttons (line 1058) use
  `style-hover="background:rgba(31,157,99,.22);border-color:#4fd28b"`.
- `.fos-cmd-row:hover` — command palette rows (line 1109) use
  `style-hover="background:#f2f1eb"`.

- [ ] **Step 1: Read the current end of `apps/web/app/globals.css`**

Confirm it ends with the `::-webkit-scrollbar-thumb:hover` rule from Plan 1 Task 3 (it should
be the last rule in the file) so the new rules can be appended cleanly.

- [ ] **Step 2: Append the overlay hover classes**

Add this block to the end of `apps/web/app/globals.css`:

```css

/* Overlay hover states — ports the source's style-hover="..." attributes
   (docs/reference/FundOS.dc.html:900-1124) for hovers that don't depend on
   per-item dynamic color. */
.fos-btn-accent:hover {
  background: var(--accent-dark);
}

.fos-dropzone:hover {
  border-color: #4fd28b;
}

.fos-chip:hover {
  background: rgba(31, 157, 99, 0.22);
  border-color: #4fd28b;
}

.fos-cmd-row:hover {
  background: #f2f1eb;
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/globals.css
git commit -m "feat: add overlay hover classes for Auth/Onboarding/CmdK"
```

---

## Task 2: `AuthModal.tsx`

**Files:**
- Create: `apps/web/components/overlays/AuthModal.tsx`

Ported from `docs/reference/FundOS.dc.html:900-974`. Gated on `store.authOpen` (default `true`,
so it covers the whole app on load, `zIndex: 80` — above both the onboarding overlay at 60 and
the command palette at 70). The three brand-panel bullet lines are a literal inline array in
the source (`docs/reference/FundOS.dc.html:913`), not a data module — hardcode them verbatim.
The email input's `value`/`placeholder` split between signin/signup is static in the source
(never wired to `onInput`), so this plan uses `defaultValue` (not `value`) for the signin email
and the password field to keep them "pre-filled" without making React treat them as controlled
inputs missing an `onChange` handler (which would otherwise log a console warning for a field
the source itself never updates).

- [ ] **Step 1: Create `apps/web/components/overlays/AuthModal.tsx`**

```tsx
'use client';

import { observer } from 'mobx-react-lite';
import { useFundOsStore } from '@/lib/store/StoreProvider';

const BRAND_BULLETS = [
  'Finds every grant, VC, debt & prize you qualify for',
  'Writes, critiques & files applications for you',
  'You approve the decisions that matter — it does the rest',
];

export const AuthModal = observer(function AuthModal() {
  const store = useFundOsStore();

  if (!store.authOpen) return null;

  const isSignup = store.authMode === 'signup';
  const isSignin = store.authMode === 'signin';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 80, display: 'flex', background: '#0e141a', color: '#eafaf1', animation: 'fos-fade .3s both' }}>
      {/* brand panel */}
      <div style={{ flex: 1, background: 'linear-gradient(150deg,#12291d,#0e141a)', padding: '52px 56px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-space-grotesk)', fontWeight: 700, color: '#06130c', fontSize: 19 }}>F</div>
          <span style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 600, fontSize: 19 }}>FundOS</span>
        </div>
        <div style={{ margin: 'auto 0', maxWidth: 440 }}>
          <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: '#7fd3a4', marginBottom: 14 }}>The AI funding operating system</div>
          <div style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 600, fontSize: 34, letterSpacing: '-.6px', lineHeight: 1.18, marginBottom: 20 }}>
            An elite funding team that never sleeps — discovering, qualifying and winning every opportunity you&apos;re eligible for.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {BRAND_BULLETS.map((ln) => (
              <div key={ln} style={{ display: 'flex', alignItems: 'center', gap: 11, fontSize: 14, color: '#cfead9' }}>
                <span style={{ color: '#4fd28b', fontWeight: 700 }}>✓</span>
                {ln}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 22, fontSize: 12, color: '#6f9d83' }}>
          <span>SOC 2 Type II</span>
          <span>GDPR</span>
          <span>Never trains on your data</span>
        </div>
      </div>

      {/* form panel */}
      <div style={{ width: 480, flex: '0 0 480px', background: '#0e141a', borderLeft: '1px solid rgba(255,255,255,.08)', padding: '52px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, padding: 3, marginBottom: 28, width: 'fit-content' }}>
          <button
            onClick={() => store.setAuthMode('signup')}
            style={{ border: 'none', background: isSignup ? 'var(--accent)' : 'transparent', color: isSignup ? '#fff' : '#8fbfa4', fontSize: 13, fontWeight: 600, padding: '8px 18px', borderRadius: 7, cursor: 'pointer', fontFamily: 'var(--font-ibm-plex-sans)', transition: 'background .16s' }}
          >
            Create account
          </button>
          <button
            onClick={() => store.setAuthMode('signin')}
            style={{ border: 'none', background: isSignin ? 'var(--accent)' : 'transparent', color: isSignin ? '#fff' : '#8fbfa4', fontSize: 13, fontWeight: 600, padding: '8px 18px', borderRadius: 7, cursor: 'pointer', fontFamily: 'var(--font-ibm-plex-sans)', transition: 'background .16s' }}
          >
            Sign in
          </button>
        </div>

        <h1 style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 600, fontSize: 28, letterSpacing: '-.5px', margin: '0 0 6px' }}>{store.authTitle}</h1>
        <p style={{ fontSize: 14, color: '#8fbfa4', lineHeight: 1.5, margin: '0 0 26px' }}>{store.authSub}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          <button
            onClick={() => store.submitAuth()}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: '#fff', color: '#1a1a1a', border: 'none', borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-ibm-plex-sans)' }}
          >
            <span style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 700, color: '#4285F4' }}>G</span>
            Continue with Google
          </button>
          <button
            onClick={() => store.submitAuth()}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'rgba(255,255,255,.06)', color: '#eafaf1', border: '1px solid rgba(255,255,255,.14)', borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-ibm-plex-sans)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 6 9-6" />
            </svg>
            Continue with SSO
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.1)' }} />
          <span style={{ fontSize: 11, color: '#6f9d83' }}>or with email</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.1)' }} />
        </div>

        {isSignup && (
          <div style={{ marginBottom: 13 }}>
            <label style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: '#8fbfa4', display: 'block', marginBottom: 6 }}>Work email</label>
            <input
              placeholder="maya@verdantia.earth"
              style={{ width: '100%', background: 'rgba(0,0,0,.28)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 9, padding: '11px 13px', color: '#eafaf1', fontFamily: 'var(--font-ibm-plex-sans)', fontSize: 14, outline: 'none' }}
            />
          </div>
        )}
        {isSignin && (
          <div style={{ marginBottom: 13 }}>
            <label style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: '#8fbfa4', display: 'block', marginBottom: 6 }}>Work email</label>
            <input
              defaultValue="maya@verdantia.earth"
              style={{ width: '100%', background: 'rgba(0,0,0,.28)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 9, padding: '11px 13px', color: '#eafaf1', fontFamily: 'var(--font-ibm-plex-sans)', fontSize: 14, outline: 'none' }}
            />
          </div>
        )}

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: '#8fbfa4', display: 'block', marginBottom: 6 }}>Password</label>
          <input
            type="password"
            defaultValue="verdantia"
            style={{ width: '100%', background: 'rgba(0,0,0,.28)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 9, padding: '11px 13px', color: '#eafaf1', fontFamily: 'var(--font-ibm-plex-sans)', fontSize: 14, outline: 'none' }}
          />
        </div>

        <button
          onClick={() => store.submitAuth()}
          className="fos-btn-accent"
          style={{ width: '100%', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10, padding: 13, fontSize: 14.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-ibm-plex-sans)', transition: 'background .16s' }}
        >
          {store.authCta} →
        </button>
        <div style={{ textAlign: 'center', fontSize: 12, color: '#6f9d83', marginTop: 16 }}>By continuing you agree to the Terms & Privacy Policy.</div>
      </div>
    </div>
  );
});
```

- [ ] **Step 2: Typecheck**

Run: `cd apps/web && npm run typecheck`
Expected: exits 0. (This will still fail to *build* a full page until Task 5 wires the overlay
into `AppShell` — `tsc --noEmit` alone doesn't require the file to be imported anywhere, so this
step only confirms `AuthModal.tsx` itself is type-correct.)

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/overlays/AuthModal.tsx
git commit -m "feat: add AuthModal overlay"
```

---

## Task 3: `OnboardingModal.tsx`

**Files:**
- Create: `apps/web/components/overlays/OnboardingModal.tsx`

Ported from `docs/reference/FundOS.dc.html:976-1088`. Gated on `store.onboardingOpen` (default
`true`, `zIndex: 60`). Four steps keyed by `store.onboardStep` (0-3) — the source derives
`onboardStep0`..`onboardStep3` as `s.onboardStep===N` booleans in `renderVals()`
(`docs/reference/FundOS.dc.html:1517`), so this component compares `store.onboardStep === N`
directly rather than adding four new store computeds. `store.startBuild()` (defined in Plan 1's
store) already owns the async 1→2 step transition via its internal 2.9s timer — this component
only renders whichever step is currently active.

- [ ] **Step 1: Create `apps/web/components/overlays/OnboardingModal.tsx`**

```tsx
'use client';

import { observer } from 'mobx-react-lite';
import { useFundOsStore } from '@/lib/store/StoreProvider';

export const OnboardingModal = observer(function OnboardingModal() {
  const store = useFundOsStore();

  if (!store.onboardingOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'linear-gradient(150deg,#12291d,#0e141a)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'fos-fade .3s both', color: '#eafaf1' }}>
      <div style={{ width: 640, maxWidth: '100%' }}>
        {store.onboardStep === 0 && (
          <div style={{ animation: 'fos-reveal .5s both' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 26 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-space-grotesk)', fontWeight: 700, color: '#06130c', fontSize: 19 }}>F</div>
              <span style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 600, fontSize: 19 }}>FundOS</span>
            </div>
            <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: '#7fd3a4', marginBottom: 10 }}>Set up · 2 minutes</div>
            <h1 style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 600, fontSize: 38, letterSpacing: '-.8px', lineHeight: 1.08, margin: '0 0 14px' }}>Meet your funding team.</h1>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: '#c5e6d3', maxWidth: 520, margin: '0 0 26px' }}>
              No forms. Point us at your organization and our AI will read everything public, interview you only where it must, and build a living Digital Twin — then start finding money.
            </p>
            <div style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 14, padding: 18 }}>
              <label style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: '#8fbfa4', display: 'block', marginBottom: 8 }}>Your website</label>
              <div style={{ display: 'flex', gap: 9 }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 9, background: 'rgba(0,0,0,.28)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 10, padding: '0 13px' }}>
                  <span style={{ color: '#7fd3a4', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 13 }}>https://</span>
                  <input
                    value={store.url}
                    onChange={(e) => store.setUrl(e.target.value)}
                    style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#eafaf1', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 14, padding: '12px 0' }}
                  />
                </div>
                <button
                  onClick={() => store.startBuild()}
                  className="fos-btn-accent"
                  style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10, padding: '0 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-ibm-plex-sans)', transition: 'background .16s' }}
                >
                  Build my Digital Twin
                </button>
              </div>
              <div className="fos-dropzone" style={{ marginTop: 13, border: '1px dashed rgba(255,255,255,.2)', borderRadius: 11, padding: '13px 15px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'border-color .16s' }}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#7fd3a4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 16V4M7 9l5-5 5 5M4 20h16" />
                </svg>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#eafaf1' }}>Or drop a pitch deck, annual report or past proposals</div>
                  <div style={{ fontSize: 11.5, color: '#8fbfa4' }}>PDF · DOCX · PPTX — the AI reads them and enriches your twin</div>
                </div>
              </div>
            </div>
            <div style={{ fontSize: 11.5, color: '#6f9d83', marginTop: 14, textAlign: 'center' }}>SOC 2 · your data is never used to train models · disconnect any source anytime</div>
          </div>
        )}

        {store.onboardStep === 1 && (
          <div style={{ animation: 'fos-fade .3s both', textAlign: 'center' }}>
            <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 26px', borderRadius: 16, overflow: 'hidden', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.12)' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(31,157,99,.25),transparent)' }} />
              <div style={{ position: 'absolute', left: 0, right: 0, height: '34%', background: 'linear-gradient(180deg,transparent,rgba(79,210,139,.5),transparent)', animation: 'fos-scan 1.5s ease-in-out infinite' }} />
              <svg style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', animation: 'fos-spin 3s linear infinite' }} width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#7fd3a4" strokeWidth="1.3" strokeLinecap="round">
                <path d="M12 2a10 10 0 0 1 10 10" />
                <path d="M12 6a6 6 0 0 1 6 6" opacity=".5" />
              </svg>
            </div>
            <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: '#7fd3a4' }}>Reading everything about {store.url}</div>
            <h2 style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 600, fontSize: 26, margin: '8px 0 22px' }}>Building your Digital Twin</h2>
            <div style={{ maxWidth: 440, margin: '0 auto', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 9 }}>
              {store.scanning.map((sc) => (
                <div
                  key={sc.text}
                  style={{ display: 'flex', alignItems: 'center', gap: 11, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: '11px 14px', animation: 'fos-reveal .5s both', animationDelay: sc.delay }}
                >
                  <span style={{ color: '#4fd28b', fontWeight: 700 }}>✓</span>
                  <span style={{ fontSize: 13.5, flex: 1 }}>{sc.text}</span>
                  <span style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10.5, color: '#8fbfa4' }}>{sc.src}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {store.onboardStep === 2 && (
          <div style={{ animation: 'fos-reveal .4s both' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 20 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-space-grotesk)', fontWeight: 700, color: '#06130c', fontSize: 16 }}>F</div>
              <span style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 600, fontSize: 16 }}>FundOS</span>
              <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 11, color: '#7fd3a4' }}>Question {store.interviewNumber} of 3</span>
            </div>
            <div style={{ height: 3, background: 'rgba(255,255,255,.12)', borderRadius: 2, overflow: 'hidden', marginBottom: 26 }}>
              <div style={{ height: '100%', width: `${store.interviewPercent}%`, background: '#4fd28b', transition: 'width .3s' }} />
            </div>
            <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: '#7fd3a4', marginBottom: 10 }}>A few things we could not infer</div>
            <h1 style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 600, fontSize: 30, letterSpacing: '-.5px', lineHeight: 1.15, margin: '0 0 12px' }}>{store.currentInterviewQuestion.q}</h1>
            <p style={{ fontSize: 14.5, lineHeight: 1.55, color: '#c5e6d3', margin: '0 0 22px' }}>Pick one — no typing. Nothing here is a form, and you can refine any answer later.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {store.currentInterviewQuestion.chips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => store.answerInterview(chip)}
                  className="fos-chip"
                  style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.16)', color: '#eafaf1', borderRadius: 10, padding: '12px 18px', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-ibm-plex-sans)', transition: 'background .16s,border-color .16s' }}
                >
                  {chip}
                </button>
              ))}
            </div>
            <button
              onClick={() => store.skipInterview()}
              style={{ marginTop: 22, background: 'none', border: 'none', color: '#8fbfa4', fontSize: 12.5, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '3px' }}
            >
              Skip — let the AI infer this
            </button>
          </div>
        )}

        {store.onboardStep === 3 && (
          <div style={{ animation: 'fos-reveal .5s both' }}>
            <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: '#7fd3a4', marginBottom: 10 }}>Digital Twin ready · 91% complete</div>
            <h1 style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 600, fontSize: 34, letterSpacing: '-.7px', lineHeight: 1.1, margin: '0 0 8px' }}>We already know Verdantia.</h1>
            <p style={{ fontSize: 15.5, lineHeight: 1.6, color: '#c5e6d3', maxWidth: 520, margin: '0 0 22px' }}>
              Built from 6 public sources in 94 seconds, sharpened by your 3 answers. Everything else we inferred — nothing you had to type twice.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
              {store.readyStats.map((r) => (
                <div key={r.l} style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12, padding: 16 }}>
                  <div style={{ fontFamily: 'var(--font-space-grotesk)', fontSize: 26, fontWeight: 600 }}>{r.n}</div>
                  <div style={{ fontSize: 11.5, color: '#8fbfa4', marginTop: 3 }}>{r.l}</div>
                </div>
              ))}
            </div>
            <div style={{ background: 'linear-gradient(120deg,rgba(31,157,99,.18),rgba(31,157,99,.04))', border: '1px solid rgba(56,190,125,.35)', borderRadius: 14, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div style={{ fontFamily: 'var(--font-space-grotesk)', fontSize: 34, fontWeight: 600, color: '#4fd28b' }}>€14.7M</div>
              <div style={{ fontSize: 13.5, lineHeight: 1.5, color: '#dff2e7' }}>
                across <b>23 matched opportunities</b> already found — including 3 with deadlines inside 5 weeks that fit you exceptionally well.
              </div>
            </div>
            <button
              onClick={() => store.enterApp()}
              className="fos-btn-accent"
              style={{ width: '100%', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 11, padding: 15, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-ibm-plex-sans)', transition: 'background .16s' }}
            >
              Enter FundOS →
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
```

- [ ] **Step 2: Typecheck**

Run: `cd apps/web && npm run typecheck`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/overlays/OnboardingModal.tsx
git commit -m "feat: add OnboardingModal overlay"
```

---

## Task 4: `CmdKPalette.tsx`

**Files:**
- Create: `apps/web/components/overlays/CmdKPalette.tsx`

Ported from `docs/reference/FundOS.dc.html:1090-1124` (markup), `:1445-1455` (`cmdBase`,
`cmdItems`, `cmdEmpty`), and `:1359-1362` (the `componentDidMount` ⌘K/Escape keyboard
listener). Gated on `store.cmdOpen`. The 6 base commands are a literal array defined inside
this component (not the store) because each command's `onClick` needs `useRouter()` for
navigation — the store has no `screen` field by design (Plan 1's Contract section). The
filtered list (`cmdItems`) and empty state (`cmdEmpty`) are computed locally via `useMemo`,
filtering case-insensitively on `label + ' ' + hint` against the trimmed, lowercased
`store.cmdQuery`, exactly matching the source's `renderVals()` logic at line 1454.

Translating each of the 6 commands' original `screen`/`selectedOppId` side effects
(`docs/reference/FundOS.dc.html:1446-1451`) to routes, using the source's own key→route mapping
(`home` → `/`, everything else → `/${key}`, per Plan 1's `Sidebar.tsx` `routeFor`):

| # | label | source side effect | port |
|---|---|---|---|
| 1 | File the DOE Letter of Intent | `approve('a1')`, `screen:'home'` | `store.approve('a1')` → `store.closeCmd()` → `router.push('/')` |
| 2 | Show my highest-probability opportunities | `screen:'opportunities'` | `store.closeCmd()` → `router.push('/opportunities')` |
| 3 | Draft a reply to Marcus Bell | `screen:'relationships'` | `store.closeCmd()` → `router.push('/relationships')` |
| 4 | Explain why Horizon Europe ranks first | `screen:'opportunities'`, `selectedOppId:'he'` | `store.openOpp('he')` → `store.closeCmd()` → `router.push('/opportunities')` |
| 5 | Summarise what the AI did overnight | `screen:'home'` | `store.closeCmd()` → `router.push('/')` |
| 6 | Open the Digital Twin | `screen:'twin'` | `store.closeCmd()` → `router.push('/twin')` |

The Escape handler matches the source's combined behavior (`docs/reference/FundOS.dc.html:1362`
sets both `cmdOpen:false` and `selectedOppId:null` in one `setState`): this port calls both
`store.closeCmd()` and `store.closeOpp()`.

- [ ] **Step 1: Create `apps/web/components/overlays/CmdKPalette.tsx`**

```tsx
'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { observer } from 'mobx-react-lite';
import { useFundOsStore } from '@/lib/store/StoreProvider';

interface CmdItem {
  icon: string;
  color: string;
  tint: string;
  label: string;
  hint: string;
  tagText: string;
  onClick: () => void;
}

export const CmdKPalette = observer(function CmdKPalette() {
  const store = useFundOsStore();
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        store.toggleCmd();
      } else if (e.key === 'Escape') {
        store.closeCmd();
        store.closeOpp();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [store]);

  const baseItems: CmdItem[] = useMemo(
    () => [
      {
        icon: '⚑', color: '#bd4130', tint: '#f7e8e4',
        label: 'File the DOE Letter of Intent', hint: 'Deadline in 12 days, drafted and compliance-cleared', tagText: 'approve',
        onClick: () => { store.approve('a1'); store.closeCmd(); router.push('/'); },
      },
      {
        icon: '◈', color: '#16824f', tint: '#e9f4ee',
        label: 'Show my highest-probability opportunities', hint: '23 live matches, ranked by expected value', tagText: 'go',
        onClick: () => { store.closeCmd(); router.push('/opportunities'); },
      },
      {
        icon: '✎', color: '#3567c0', tint: '#e6ecf8',
        label: 'Draft a reply to Marcus Bell', hint: 'Breakthrough Energy, warm intro logged', tagText: 'draft',
        onClick: () => { store.closeCmd(); router.push('/relationships'); },
      },
      {
        icon: '?', color: '#8a5e15', tint: '#f6efdf',
        label: 'Explain why Horizon Europe ranks first', hint: 'See the full ranking breakdown from Compass', tagText: 'open',
        onClick: () => { store.openOpp('he'); store.closeCmd(); router.push('/opportunities'); },
      },
      {
        icon: '✦', color: '#16824f', tint: '#e9f4ee',
        label: 'Summarise what the AI did overnight', hint: '14-hour activity brief', tagText: 'go',
        onClick: () => { store.closeCmd(); router.push('/'); },
      },
      {
        icon: '▤', color: '#6d7079', tint: '#f0efe9',
        label: 'Open the Digital Twin', hint: 'Verdantia, 87% complete', tagText: 'go',
        onClick: () => { store.closeCmd(); router.push('/twin'); },
      },
    ],
    [store, router],
  );

  const cmdItems = useMemo(() => {
    const q = store.cmdQuery.trim().toLowerCase();
    return q ? baseItems.filter((c) => (c.label + ' ' + c.hint).toLowerCase().includes(q)) : baseItems;
  }, [baseItems, store.cmdQuery]);

  if (!store.cmdOpen) return null;

  const cmdEmpty = cmdItems.length === 0;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 70, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '12vh' }}>
      <div onClick={() => store.closeCmd()} style={{ position: 'absolute', inset: 0, background: 'rgba(21,23,28,.34)', animation: 'fos-fade .18s both' }} />
      <div style={{ position: 'relative', width: 600, maxWidth: '92vw', background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 16, boxShadow: '0 30px 80px rgba(21,23,28,.32)', overflow: 'hidden', animation: 'fos-reveal .22s both' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '15px 18px', borderBottom: '1px solid var(--line)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <input
            value={store.cmdQuery}
            onChange={(e) => store.setCmdQuery(e.target.value)}
            placeholder="Ask your funding team to do something…"
            style={{ flex: 1, border: 'none', outline: 'none', background: 'none', fontFamily: 'var(--font-ibm-plex-sans)', fontSize: 15, color: 'var(--ink)' }}
          />
          <span style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, color: 'var(--faint)', border: '1px solid var(--line)', borderRadius: 5, padding: '2px 6px' }}>esc</span>
        </div>
        <div style={{ maxHeight: '54vh', overflowY: 'auto', padding: 8 }}>
          <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9.5, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted)', padding: '8px 10px 6px' }}>Suggested by your AI team</div>
          {cmdItems.map((c) => (
            <button
              key={c.label}
              onClick={c.onClick}
              className="fos-cmd-row"
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 11px', border: 'none', background: 'transparent', borderRadius: 10, cursor: 'pointer', textAlign: 'left', transition: 'background .14s' }}
            >
              <span style={{ width: 30, height: 30, flex: '0 0 30px', borderRadius: 8, background: c.tint, color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{c.icon}</span>
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: 13.5, fontWeight: 500 }}>{c.label}</span>
                <span style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)' }}>{c.hint}</span>
              </span>
              <span style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9.5, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--faint)', border: '1px solid var(--line)', borderRadius: 5, padding: '2px 6px' }}>{c.tagText}</span>
            </button>
          ))}
          {cmdEmpty && (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>No commands match — try &quot;opportunities&quot;, &quot;file&quot;, or &quot;draft&quot;.</div>
          )}
        </div>
      </div>
    </div>
  );
});
```

- [ ] **Step 2: Typecheck**

Run: `cd apps/web && npm run typecheck`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/overlays/CmdKPalette.tsx
git commit -m "feat: add CmdKPalette overlay with global keyboard listener"
```

---

## Task 5: Wire the overlays into `AppShell`, verify build, manual check

**Files:**
- Modify: `apps/web/components/shell/AppShell.tsx`

Plan 1 (Task 14) left `AppShell.tsx` rendering only `<Sidebar/>` + `<Header/>` + `children`
inside the design-token root `<div>`. This step adds the three overlays as additional siblings
inside that same root `<div>`, rendered unconditionally — each overlay self-gates on its own
store boolean and returns `null` when closed, so there's no conditional wrapper needed here.

**This edit is additive.** If Plan 3 (Opportunity Discovery/Detail) has already modified this
file to render its own `OpportunityDetail` overlay as a sibling, do not remove or reorder that
JSX — add the three `<AuthModal/>`, `<OnboardingModal/>`, `<CmdKPalette/>` lines alongside it.
The full file below assumes Plan 3 has *not* yet touched this file; if it has, merge by hand
(keep every existing sibling, append these three imports + JSX lines) rather than overwriting.

- [ ] **Step 1: Update `apps/web/components/shell/AppShell.tsx`**

Replace the full file contents with:

```tsx
'use client';

import type { CSSProperties, ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AuthModal } from '@/components/overlays/AuthModal';
import { OnboardingModal } from '@/components/overlays/OnboardingModal';
import { CmdKPalette } from '@/components/overlays/CmdKPalette';

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
      <AuthModal />
      <OnboardingModal />
      <CmdKPalette />
    </div>
  );
}
```

If Plan 3's `OpportunityDetail` overlay is already present in this file, keep its import line
and its JSX (e.g. `<OpportunityDetail />`) exactly where Plan 3 placed it, and add the three
lines above (`<AuthModal />`, `<OnboardingModal />`, `<CmdKPalette />`) as additional siblings —
order among the four overlays doesn't matter functionally since each is `position: fixed` with
its own explicit `zIndex` (Auth 80, Onboarding 60, CmdK 70; `OpportunityDetail`'s `zIndex` is
whatever Plan 3 assigned it).

- [ ] **Step 2: Full production build**

Run: `cd apps/web && npm run build`
Expected: `next build` completes successfully with no TypeScript errors, and every route from
whichever screen plans have landed so far still builds (this plan doesn't touch any route's
`page.tsx`, only the shared shell).

- [ ] **Step 3: Manual dev-server check**

Run: `cd apps/web && npm run dev`, open `http://localhost:3000`.

Verify, in order:
1. **Reload triggers auth then onboarding.** On first load, the Auth modal (dark split panel,
   "Hire your funding team." headline, Google/SSO buttons) covers the screen. Click "Create
   account" / fill nothing and click the primary CTA (or click "Continue with Google") — the
   auth modal closes and the Onboarding modal (dark, centered, "Meet your funding team.")
   appears underneath, still covering the dashboard.
2. **Completing/skipping onboarding reveals the dashboard.** On the onboarding step 0 screen,
   click "Build my Digital Twin" — after ~2.9s the scanning step (radar spinner + staggered
   list) auto-advances to the interview step. Click any chip 3 times (or repeatedly click
   "Skip — let the AI infer this") to reach step 3 (ready summary with the €14.7M banner), then
   click "Enter FundOS →" — the onboarding overlay closes and the Command Center dashboard
   (sidebar + header + main content) is visible.
3. **⌘K opens/closes and search filters.** Press `Cmd+K` (or `Ctrl+K` on Windows/Linux) — the
   command palette opens with 6 suggested commands. Type `twin` — the list filters down to
   "Open the Digital Twin" only. Clear the query, then press `Escape` — the palette closes.
4. **A demo command's navigation works.** Reopen the palette (`Cmd/Ctrl+K`), click "Open the
   Digital Twin" — the palette closes and the app navigates to `/twin`.

- [ ] **Step 4: Commit**

```bash
git add apps/web/components/shell/AppShell.tsx
git commit -m "feat: render Auth, Onboarding, and CmdK overlays from AppShell"
```

---

## Self-review

**1. Spec coverage.** Auth modal (brand panel, bullets, trust badges, toggle pill, OAuth
buttons, email/password fields, submit) ✓ Task 2. Onboarding modal, all 4 steps (URL input +
dropzone, scanning animation, interview chips + skip, ready stats + banner + enter) ✓ Task 3.
Command palette (search input, 6 filtered commands, empty state, esc hint) ✓ Task 4. Global
⌘K/Escape keyboard listener ✓ Task 4 Step 1 (`useEffect` in `CmdKPalette`). `AppShell` wiring +
`next build` passing end-to-end ✓ Task 5. Hover states (`style-hover` in the source) ✓ Task 1.

**2. Placeholder scan.** No "TODO"/"similar to above"/vague instructions anywhere in this plan
— every task's code block is complete, verbatim-styled TSX or CSS. The one piece of judgment
called out explicitly (not left vague) is the `defaultValue` vs `value` choice for the auth
modal's signin email and password inputs (Task 2's intro paragraph) and the CSS-class-vs-inline-
handler choice for hover states (Task 1's intro paragraph) — both are decisions made and
justified, not gaps left for the implementer to fill in.

**3. Type consistency against Plan 1's store contract.** Verified every store member this plan
references exists with the exact name/signature in `docs/superpowers/plans/2026-07-28-fundos-01-scaffold-data.md`'s
`FundOsStore.ts`: `authOpen: boolean`, `authMode: AuthMode` + `setAuthMode(mode: AuthMode)`,
`authTitle`/`authSub`/`authCta` (computed getters), `submitAuth()`, `onboardingOpen: boolean`,
`onboardStep: number`, `url: string` + `setUrl(value: string)`, `startBuild()`, `scanning:
ScanItem[]` (`.text`/`.src`/`.delay`), `readyStats: ReadyStat[]` (`.n`/`.l`),
`currentInterviewQuestion` (returns `InterviewQuestion` with `.q`/`.chips: string[]`),
`interviewNumber`, `interviewPercent`, `answerInterview(value: string)`, `skipInterview()`,
`enterApp()`, `cmdOpen: boolean`, `cmdQuery: string` + `setCmdQuery(value: string)`,
`toggleCmd()`, `closeCmd()`, `approve(id: string)`, `openOpp(id: string)`, `closeOpp()`. No new
observables, actions, or computeds were added to the store contract — confirmed against the
"Contract check" section above.

**4. `AppShell` edit is additive, not destructive.** Task 5 explicitly frames its `AppShell.tsx`
change as adding three sibling elements to the existing root `<div>`, and calls out by name
that if Plan 3's `OpportunityDetail` overlay already landed in that file, its import and JSX
must be preserved — the task provides both the "clean" full-file version (if this plan runs
first) and explicit merge instructions (if Plan 3 runs first), rather than assuming a single
execution order.
