export interface ScanItem {
  text: string;
  src: string;
  delay: string;
}

export interface ReadyStat {
  n: string;
  l: string;
}

export const SCANNING: ScanItem[] = [
  { text: 'Mission, sector & products', src: 'website', delay: '.1s' },
  { text: 'Team, PhDs & expertise', src: 'LinkedIn', delay: '.35s' },
  { text: '2 patents, 11 publications', src: 'Scholar', delay: '.6s' },
  { text: '€6.4M raised · Series A', src: 'Crunchbase', delay: '.9s' },
  { text: 'ISO 14064 · B-Corp certs', src: 'registries', delay: '1.2s' },
  { text: 'SDG 2 · 13 · 15 alignment', src: 'derived', delay: '1.5s' },
];

export const READY_STATS: ReadyStat[] = [
  { n: '34', l: 'facts captured' },
  { n: '6', l: 'sources read' },
  { n: '87%', l: 'twin complete' },
];

export async function getScanning(): Promise<ScanItem[]> {
  return SCANNING;
}

export async function getReadyStats(): Promise<ReadyStat[]> {
  return READY_STATS;
}
