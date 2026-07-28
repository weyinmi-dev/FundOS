export interface LearnedPattern {
  pattern: string;
  effect: string;
  good: boolean;
  action: string;
}

export interface LearnStats {
  winRate: string;
  trend: string;
}

export const LEARN: LearnedPattern[] = [
  { pattern: 'Proposals that open with quantified MRV field data', effect: 'won 4 of 5', good: true, action: 'Quill now leads every Impact section with trial numbers' },
  { pattern: 'GCF applications without an accredited entity partner', effect: '0 of 2 · declined', good: false, action: 'Gatekeeper flags accreditation before pursuit' },
  { pattern: 'DOE submissions filed in the final week', effect: '-18% win rate', good: false, action: 'Envoy now prioritises early filing on all US calls' },
];

export const LEARN_STATS: LearnStats = { winRate: '38%', trend: '+11 pts YoY' };

export async function getLearn(): Promise<LearnedPattern[]> {
  return LEARN;
}

export async function getLearnStats(): Promise<LearnStats> {
  return LEARN_STATS;
}
