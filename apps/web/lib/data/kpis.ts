export interface Kpi {
  label: string;
  value: string;
  sub: string;
}

export interface AwayStat {
  n: string;
  l: string;
}

export const KPIS: Kpi[] = [
  { label: 'Pipeline value', value: '€14.7M', sub: 'across 23 live opportunities' },
  { label: 'Expected (weighted)', value: '€5.2M', sub: 'probability-adjusted' },
  { label: 'Active applications', value: '8', sub: '3 awaiting your input' },
  { label: 'Next deadline', value: '12d', sub: 'DOE Carbon Negative Shot' },
];

export const AWAY_STATS: AwayStat[] = [
  { n: '9', l: 'tasks completed' },
  { n: '3', l: 'new grants found' },
  { n: '2', l: 'drafts written' },
  { n: '1', l: 'application filed' },
];

export async function getKpis(): Promise<Kpi[]> {
  return KPIS;
}

export async function getAwayStats(): Promise<AwayStat[]> {
  return AWAY_STATS;
}
