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
