export interface Obligation {
  t: string;
  due: string;
  state: 'due' | 'ok' | 'done';
}

export interface AwardRecord {
  id: string;
  name: string;
  funder: string;
  amount: string;
  status: string;
  disbursed: number;
  milestone: string;
  nextReport: string;
  obligations: Obligation[];
}

export interface CalendarItem {
  what: string;
  award: string;
  when: string;
  urgency: 'risk' | 'warn' | 'ok';
}

export const AWARDS: AwardRecord[] = [
  {
    id: 'w1', name: 'Innovate UK Smart Grant', funder: 'Innovate UK', amount: '£1.1M', status: 'Active', disbursed: 64, milestone: 'WP3 field deployment — 72%', nextReport: 'Q3 financial report · in 18 days',
    obligations: [
      { t: 'Quarterly financial report', due: '18 days', state: 'due' },
      { t: 'Annual impact audit', due: '4 months', state: 'ok' },
      { t: 'IP disclosure', due: 'filed', state: 'done' },
    ],
  },
  {
    id: 'w2', name: 'GCF Readiness Grant', funder: 'Green Climate Fund', amount: '$800K', status: 'Active', disbursed: 38, milestone: 'Baseline MRV dataset — 45%', nextReport: 'Interim narrative · in 41 days',
    obligations: [
      { t: 'Procurement compliance check', due: '12 days', state: 'due' },
      { t: 'Interim narrative report', due: '41 days', state: 'ok' },
      { t: 'Safeguards screening', due: 'cleared', state: 'done' },
    ],
  },
];

export const CALENDAR: CalendarItem[] = [
  { what: 'GCF procurement compliance check', award: 'GCF Readiness', when: 'in 12 days', urgency: 'risk' },
  { what: 'Innovate UK Q3 financial report', award: 'Innovate UK Smart', when: 'in 18 days', urgency: 'warn' },
  { what: 'GCF interim narrative report', award: 'GCF Readiness', when: 'in 41 days', urgency: 'ok' },
  { what: 'Innovate UK annual impact audit', award: 'Innovate UK Smart', when: 'in 4 months', urgency: 'ok' },
];

export async function getAwards(): Promise<AwardRecord[]> {
  return AWARDS;
}

export async function getCalendar(): Promise<CalendarItem[]> {
  return CALENDAR;
}
