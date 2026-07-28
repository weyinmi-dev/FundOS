export interface VersionEntry {
  label: string;
  when: string;
  color: string;
}

export const VERSIONS: VersionEntry[] = [
  { label: 'Quill draft v3 — Impact', when: '4 min ago', color: '#1f9d63' },
  { label: 'Your edit — trimmed intro', when: '2 hrs ago', color: '#3567c0' },
  { label: 'Sage playbook applied', when: 'yesterday', color: '#b1791b' },
  { label: 'Quill draft v1', when: '2 days ago', color: '#c9c6bd' },
];

export async function getVersions(): Promise<VersionEntry[]> {
  return VERSIONS;
}
