export interface Contact {
  name: string;
  role: string;
  org: string;
  warmth: 'Hot' | 'Warm' | 'Cool';
  last: string;
  next: string;
}

export const CONTACTS: Contact[] = [
  { name: 'Dr. Lena Voss', role: 'Program Officer', org: 'European Commission', warmth: 'Warm', last: '6 days ago', next: 'Atlas: send trial-data brief' },
  { name: 'Marcus Bell', role: 'Investment Lead', org: 'Breakthrough Energy', warmth: 'Hot', last: '2 days ago', next: 'Reply to intro — draft ready' },
  { name: 'Amara Okoye', role: 'Regional Director', org: 'Green Climate Fund', warmth: 'Cool', last: '5 weeks ago', next: 'Atlas: re-engage via partner' },
  { name: 'Prof. J. Klaassen', role: 'Co-PI', org: 'Wageningen University', warmth: 'Hot', last: 'yesterday', next: 'Confirm consortium role' },
  { name: 'Sofia Reyes', role: 'Grants Manager', org: 'XPRIZE Foundation', warmth: 'Warm', last: '11 days ago', next: 'Register team for milestone' },
];

export async function getContacts(): Promise<Contact[]> {
  return CONTACTS;
}
