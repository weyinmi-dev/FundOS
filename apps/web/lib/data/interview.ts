export interface InterviewQuestion {
  q: string;
  chips: string[];
}

export const INTERVIEW: InterviewQuestion[] = [
  { q: 'We could not confirm your Verra VM0042 status. Where are you?', chips: ['In validation', 'Registered', 'Not started'] },
  { q: 'What is your primary funding goal for the next 12 months?', chips: ['Scale field pilots', 'Fund core R&D', 'Working capital', 'Enter new markets'] },
  { q: 'Any regions you must prioritise or avoid?', chips: ['EU priority', 'Africa priority', 'US expansion', 'No preference'] },
];

export async function getInterview(): Promise<InterviewQuestion[]> {
  return INTERVIEW;
}
