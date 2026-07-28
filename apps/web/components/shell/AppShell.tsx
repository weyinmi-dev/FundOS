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
