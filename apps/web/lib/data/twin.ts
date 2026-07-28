export interface TwinField {
  label: string;
  value: string;
  conf: 'h' | 'm' | 'l';
  source: string;
}

export interface TwinGroup {
  group: string;
  items: TwinField[];
}

export interface EnrichingItem {
  icon: string;
  color: string;
  title: string;
  src: string;
}

export const TWIN: TwinGroup[] = [
  { group: 'Identity', items: [
    { label: 'Sector', value: 'Climate / AgTech', conf: 'h', source: 'verified' },
    { label: 'HQ', value: 'Nairobi + Wageningen', conf: 'h', source: 'verified' },
    { label: 'Founded', value: '2021', conf: 'h', source: 'Crunchbase' },
    { label: 'Growth stage', value: 'Series A', conf: 'h', source: 'from deck' },
  ]},
  { group: 'Financials', items: [
    { label: 'Revenue', value: 'ARR €1.9M', conf: 'm', source: 'from deck' },
    { label: 'Total raised', value: '€6.4M', conf: 'h', source: 'Crunchbase' },
    { label: 'Runway', value: '19 months', conf: 'm', source: 'inferred' },
    { label: 'Grants won', value: '€2.1M (4)', conf: 'h', source: 'verified' },
  ]},
  { group: 'Innovation', items: [
    { label: 'Patents', value: '2 granted · 1 pending', conf: 'h', source: 'patent office' },
    { label: 'Publications', value: '11 peer-reviewed', conf: 'h', source: 'Scholar' },
    { label: 'Maturity', value: 'TRL 7 — pilot', conf: 'm', source: 'inferred' },
    { label: 'R&D focus', value: 'Biochar MRV, ML', conf: 'h', source: 'website' },
  ]},
  { group: 'Credentials', items: [
    { label: 'Certifications', value: 'ISO 14064 · B-Corp', conf: 'h', source: 'verified' },
    { label: 'SDG alignment', value: '2 · 13 · 15', conf: 'h', source: 'derived' },
    { label: 'Carbon standard', value: 'Verra VM0042', conf: 'l', source: 'in progress' },
    { label: 'Impact metric', value: '42kt CO₂e / yr', conf: 'm', source: 'from deck' },
  ]},
  { group: 'Team', items: [
    { label: 'Headcount', value: '34', conf: 'h', source: 'LinkedIn' },
    { label: 'PhDs', value: '7', conf: 'h', source: 'LinkedIn' },
    { label: 'Expertise', value: 'Soil science, MRV', conf: 'h', source: 'derived' },
    { label: 'Advisors', value: '3 (ex-CGIAR)', conf: 'm', source: 'website' },
  ]},
  { group: 'Footprint', items: [
    { label: 'Operating in', value: 'KE · RW · NL', conf: 'h', source: 'website' },
    { label: 'Farmers enrolled', value: '4,200', conf: 'h', source: 'from deck' },
    { label: 'Land under mgmt', value: '18,000 ha', conf: 'h', source: 'from deck' },
    { label: 'Partners', value: 'Wageningen +5', conf: 'h', source: 'verified' },
  ]},
];

export const ENRICHING: EnrichingItem[] = [
  { icon: '↻', color: '#1f9d63', title: 'Parsing 2024 audited accounts', src: 'from uploaded PDF · 60%' },
  { icon: '↻', color: '#1f9d63', title: 'Cross-checking patent citations', src: 'Google Patents' },
  { icon: '?', color: '#b1791b', title: 'Confirming Verra VM0042 status', src: 'needs your input' },
  { icon: '✓', color: '#9a9ca4', title: 'Mapped SDG alignment', src: 'completed 2h ago' },
];

export const SOURCES: string[] = ['Website', 'Pitch deck', 'Crunchbase', 'Patents', 'Scholar', 'LinkedIn'];

export async function getTwin(): Promise<TwinGroup[]> {
  return TWIN;
}

export async function getEnriching(): Promise<EnrichingItem[]> {
  return ENRICHING;
}

export async function getSources(): Promise<string[]> {
  return SOURCES;
}
