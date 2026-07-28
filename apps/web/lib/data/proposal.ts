export interface ProposalSection {
  name: string;
  pct: number;
  comp: 'ok' | 'warn' | 'todo';
}

export interface ComplianceItem {
  icon: string;
  color: string;
  text: string;
  textColor: string;
}

export interface Citation {
  claim: string;
  source: string;
  color: string;
}

export const SECTIONS: ProposalSection[] = [
  { name: 'Excellence', pct: 100, comp: 'ok' },
  { name: 'Impact', pct: 72, comp: 'warn' },
  { name: 'Implementation', pct: 40, comp: 'todo' },
  { name: 'Budget', pct: 85, comp: 'ok' },
  { name: 'Consortium', pct: 90, comp: 'ok' },
  { name: 'Ethics & Data', pct: 15, comp: 'todo' },
];

export const COMPLIANCE: ComplianceItem[] = [
  { icon: '✓', color: '#1f9d63', text: 'Page limit — 9 of 10 pages used', textColor: '#191b21' },
  { icon: '!', color: '#b1791b', text: 'Gender Equality Plan not yet attached', textColor: '#7a520f' },
  { icon: '✓', color: '#1f9d63', text: 'Budget within call ceiling (€2.5M)', textColor: '#191b21' },
  { icon: '✓', color: '#1f9d63', text: 'Consortium spans ≥3 EU member states', textColor: '#191b21' },
];

export const CITATIONS: Citation[] = [
  { claim: '"40% average yield uplift in Kisumu trials"', source: 'Verdantia field report 2024, p.12 — verified', color: '#1f9d63' },
  { claim: '"Permanent carbon storage exceeding 100 years"', source: 'Needs a peer-reviewed citation', color: '#b1791b' },
];

export async function getSections(): Promise<ProposalSection[]> {
  return SECTIONS;
}

export async function getCompliance(): Promise<ComplianceItem[]> {
  return COMPLIANCE;
}

export async function getCitations(): Promise<Citation[]> {
  return CITATIONS;
}
