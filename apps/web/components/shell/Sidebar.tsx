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
