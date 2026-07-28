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
