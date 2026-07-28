export interface ActivityEvent {
  time: string;
  agent: string;
  text: string;
}

export const ACTIVITY: ActivityEvent[] = [
  { time: '07:12', agent: 'Scout · Discovery', text: 'Found 3 new grants matching soil-carbon (€6.2M combined) across EU and US databases.' },
  { time: '06:40', agent: 'Sentinel · Compliance', text: 'Flagged a missing ISO 14064 attachment on 2 opportunities and drafted the request.' },
  { time: '05:55', agent: 'Quill · Writer', text: 'Drafted the Impact narrative for Horizon Europe — awaiting your review.' },
  { time: '04:30', agent: 'Ledger · Budget', text: 'Rebuilt the 3-year budget after your headcount update; contingency held at 12%.' },
  { time: '02:10', agent: 'Atlas · Relationships', text: 'Logged a warm intro from a Breakthrough Energy scout and drafted a reply.' },
  { time: 'Yest.', agent: 'Sage · Learning', text: 'Learned reviewers penalised vague MRV language — updated the proposal playbook.' },
];

export async function getActivity(): Promise<ActivityEvent[]> {
  return ACTIVITY;
}
