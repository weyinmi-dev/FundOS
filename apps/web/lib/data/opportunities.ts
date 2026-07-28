export interface OpportunityFactor {
  label: string;
  pct: number;
  note: string;
  color: string;
}

export interface OpportunityNote {
  checkSize?: string;
  stage?: string;
  ownership?: string;
  warm?: string;
  facility?: string;
  rate?: string;
  term?: string;
  security?: string;
}

export interface Opportunity {
  id: string;
  type: string;
  name: string;
  funder: string;
  amount: string;
  deadline: string;
  score: number;
  why: string;
  elig: string;
  effort: string;
  agents: string[];
  factors: OpportunityFactor[];
  note?: OpportunityNote;
}

export const OPPORTUNITIES: Opportunity[] = [
  {
    id: 'he', type: 'Gov · Grant', name: 'Horizon Europe — Soil Health Mission', funder: 'European Commission', amount: '€2.5M', deadline: '34 days', score: 94,
    why: "Your biochar field-trial data and Wageningen partnership map directly onto the Mission's regeneration KPIs. Two of three award criteria are already evidenced in your Digital Twin — the strongest strategic match in your pipeline.",
    elig: 'Eligible', effort: '~40 hrs · consortium of 3', agents: ['Quill · Writer', 'Ledger · Budget', 'Sentinel · Compliance'],
    factors: [
      { label: 'Win probability', pct: 78, note: '78% — strong', color: '#1f9d63' },
      { label: 'Strategic fit', pct: 96, note: 'Exceptional', color: '#1f9d63' },
      { label: 'Organization readiness', pct: 88, note: 'Evidence ready', color: '#1f9d63' },
      { label: 'Effort (inverse)', pct: 58, note: 'High · consortium', color: '#b1791b' },
      { label: 'Funding size', pct: 90, note: '€2.5M', color: '#1f9d63' },
      { label: 'Competition (inverse)', pct: 55, note: 'Strong field', color: '#b1791b' },
    ],
  },
  {
    id: 'doe', type: 'Gov · Grant', name: 'DOE Carbon Negative Shot', funder: 'U.S. Department of Energy', amount: '$4.0M', deadline: '12 days', score: 88,
    why: 'Filed via your U.S. subsidiary, this fits your MRV methodology precisely. Envoy has an LOI drafted and Sentinel has cleared compliance — the tight deadline is the only risk factor.',
    elig: 'Eligible via US subsidiary', effort: '~60 hrs · LOI first', agents: ['Envoy · Submission', 'Quill · Writer', 'Oracle · Risk'],
    factors: [
      { label: 'Win probability', pct: 74, note: '74%', color: '#1f9d63' },
      { label: 'Strategic fit', pct: 86, note: 'Strong', color: '#1f9d63' },
      { label: 'Organization readiness', pct: 72, note: 'LOI ready', color: '#1f9d63' },
      { label: 'Effort (inverse)', pct: 44, note: 'High', color: '#bd4130' },
      { label: 'Funding size', pct: 95, note: '$4.0M', color: '#1f9d63' },
      { label: 'Competition (inverse)', pct: 60, note: 'Moderate', color: '#b1791b' },
    ],
  },
  {
    id: 'bef', type: 'Philanthropic · Fellowship', name: 'Breakthrough Energy Fellows', funder: 'Breakthrough Energy', amount: '$500K', deadline: '21 days', score: 82,
    why: 'A warm intro is already logged by Atlas. The program favors deep-tech founders with field validation — your TRL 7 pilot and publication record are a natural fit.',
    elig: 'Eligible', effort: '~18 hrs · light', agents: ['Quill · Writer', 'Atlas · Relationships'],
    factors: [
      { label: 'Win probability', pct: 70, note: '70%', color: '#1f9d63' },
      { label: 'Strategic fit', pct: 84, note: 'Strong', color: '#1f9d63' },
      { label: 'Organization readiness', pct: 90, note: 'Ready', color: '#1f9d63' },
      { label: 'Effort (inverse)', pct: 82, note: 'Low', color: '#1f9d63' },
      { label: 'Funding size', pct: 52, note: '$500K', color: '#b1791b' },
      { label: 'Competition (inverse)', pct: 48, note: 'Very competitive', color: '#bd4130' },
    ],
  },
  {
    id: 'xp', type: 'Challenge · Prize', name: 'XPRIZE Carbon Removal', funder: 'XPRIZE Foundation', amount: '$1.0M', deadline: '47 days', score: 79,
    why: "Non-dilutive prize capital that rewards exactly your measurable-removal thesis. Effort is moderate and there's no eligibility barrier — a high-upside, low-downside entry.",
    elig: 'Eligible', effort: '~30 hrs', agents: ['Quill · Writer', 'Oracle · Risk'],
    factors: [
      { label: 'Win probability', pct: 58, note: '58%', color: '#b1791b' },
      { label: 'Strategic fit', pct: 88, note: 'Strong', color: '#1f9d63' },
      { label: 'Organization readiness', pct: 80, note: 'Ready', color: '#1f9d63' },
      { label: 'Effort (inverse)', pct: 66, note: 'Moderate', color: '#b1791b' },
      { label: 'Funding size', pct: 70, note: '$1.0M', color: '#1f9d63' },
      { label: 'Competition (inverse)', pct: 40, note: 'Global field', color: '#bd4130' },
    ],
  },
  {
    id: 'gcf', type: 'International · Grant', name: 'Green Climate Fund — SAP', funder: 'Green Climate Fund', amount: '$3.2M', deadline: '68 days', score: 73,
    why: 'Large-ticket climate finance aligned to your geographies. Sage learned from a prior GCF decline that vague MRV hurt you — the updated playbook addresses it directly.',
    elig: 'Needs accredited entity', effort: '~80 hrs · partner-led', agents: ['Atlas · Relationships', 'Ledger · Budget', 'Sentinel · Compliance'],
    factors: [
      { label: 'Win probability', pct: 52, note: '52%', color: '#b1791b' },
      { label: 'Strategic fit', pct: 78, note: 'Good', color: '#1f9d63' },
      { label: 'Organization readiness', pct: 60, note: 'Partner needed', color: '#b1791b' },
      { label: 'Effort (inverse)', pct: 34, note: 'Very high', color: '#bd4130' },
      { label: 'Funding size', pct: 92, note: '$3.2M', color: '#1f9d63' },
      { label: 'Competition (inverse)', pct: 64, note: 'Moderate', color: '#b1791b' },
    ],
  },
  {
    id: 'bar', type: 'Debt · Loan', name: 'Barclays Sustainable Growth', funder: 'Barclays', amount: '£1.5M', deadline: 'Rolling', score: 64,
    why: 'Working-capital debt to bridge grant disbursement cycles. Ledger flags this only as a liquidity backstop, not a primary route — kept ranked for completeness.',
    elig: 'Eligible', effort: '~12 hrs', agents: ['Ledger · Budget', 'Oracle · Risk'],
    factors: [
      { label: 'Win probability', pct: 80, note: '80%', color: '#1f9d63' },
      { label: 'Strategic fit', pct: 44, note: 'Backstop only', color: '#bd4130' },
      { label: 'Organization readiness', pct: 76, note: 'Ready', color: '#1f9d63' },
      { label: 'Effort (inverse)', pct: 88, note: 'Low', color: '#1f9d63' },
      { label: 'Funding size', pct: 58, note: '£1.5M', color: '#b1791b' },
      { label: 'Competition (inverse)', pct: 82, note: 'Low', color: '#1f9d63' },
    ],
    note: { facility: 'Working-capital line', rate: '~7.5% APR', term: '36 months', security: 'Grant receivables' },
  },
  {
    id: 'seq', type: 'Equity · Series B', name: 'Aster Ventures — Climate Fund III', funder: 'Aster Ventures', amount: '€8.0M', deadline: 'Rolling', score: 76,
    why: "Aster's Fund III thesis targets MRV-enabled carbon removal at exactly your stage. Atlas has a warm path via a portfolio founder, and your ARR growth clears their traction bar — the strongest equity fit in the market right now.",
    elig: 'Thesis fit: strong', effort: 'Data room + 3 meetings', agents: ['Atlas · Relationships', 'Ledger · Financials', 'Oracle · Risk'],
    note: { checkSize: '€6–10M lead', stage: 'Series B', ownership: '15–20% target', warm: '2-hop intro via Aster portfolio' },
    factors: [
      { label: 'Thesis fit', pct: 88, note: 'Strong', color: '#1f9d63' },
      { label: 'Traction vs bar', pct: 74, note: 'Above bar', color: '#1f9d63' },
      { label: 'Warm path', pct: 80, note: '2-hop intro', color: '#1f9d63' },
      { label: 'Dilution (inverse)', pct: 52, note: '15–20%', color: '#b1791b' },
      { label: 'Check size', pct: 95, note: '€8.0M', color: '#1f9d63' },
      { label: 'Round heat (inverse)', pct: 58, note: 'Competitive', color: '#b1791b' },
    ],
  },
  {
    id: 'ang', type: 'Angel · Syndicate', name: 'Regenerative Capital Angels', funder: 'RegenCap Syndicate', amount: '€750K', deadline: 'Rolling', score: 69,
    why: 'A climate-focused angel syndicate that co-invests alongside grants. Useful to extend runway between disbursement cycles without a heavy dilution hit — Ledger models it as a clean bridge.',
    elig: 'Thesis fit: good', effort: 'Deck + 1 pitch', agents: ['Atlas · Relationships', 'Ledger · Financials'],
    note: { checkSize: '€250–750K', stage: 'Bridge', ownership: '5–8% target', warm: 'Direct application open' },
    factors: [
      { label: 'Thesis fit', pct: 80, note: 'Good', color: '#1f9d63' },
      { label: 'Traction vs bar', pct: 78, note: 'Clears', color: '#1f9d63' },
      { label: 'Warm path', pct: 60, note: 'Direct', color: '#b1791b' },
      { label: 'Dilution (inverse)', pct: 74, note: '5–8%', color: '#1f9d63' },
      { label: 'Check size', pct: 50, note: '€750K', color: '#b1791b' },
      { label: 'Round heat (inverse)', pct: 66, note: 'Moderate', color: '#b1791b' },
    ],
  },
];

export async function getOpportunities(): Promise<Opportunity[]> {
  return OPPORTUNITIES;
}
