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
