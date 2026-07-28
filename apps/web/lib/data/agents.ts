export interface Agent {
  name: string;
  role: string;
  status: 'working' | 'waiting' | 'idle';
  task: string;
  handoff: string;
}

export interface Handoff {
  from: string;
  to: string;
  what: string;
}

export const AGENTS: Agent[] = [
  { name: 'Scout', role: 'Opportunity Discovery', status: 'working', task: 'Scanning 41 new calls across 6 funding databases.', handoff: 'Gatekeeper' },
  { name: 'Gatekeeper', role: 'Eligibility Analysis', status: 'working', task: 'Screening DOE Carbon Shot criteria against the twin.', handoff: 'Compass' },
  { name: 'Compass', role: 'Strategic Fit', status: 'idle', task: 'Ranked 23 live opportunities by expected value.', handoff: 'You' },
  { name: 'Quill', role: 'Proposal Writing', status: 'working', task: 'Drafting the Impact section for Horizon Europe.', handoff: 'Ledger' },
  { name: 'Ledger', role: 'Budget Planning', status: 'waiting', task: 'Awaiting your approval on the €48k reallocation.', handoff: 'Quill' },
  { name: 'Archivist', role: 'Document Collection', status: 'working', task: 'Gathering ISO cert + audited accounts.', handoff: 'Sentinel' },
  { name: 'Sentinel', role: 'Compliance Review', status: 'idle', task: 'Cleared 3 of 4 Horizon Europe annexes.', handoff: 'Quill' },
  { name: 'Oracle', role: 'Risk Analysis', status: 'working', task: 'Modelling co-funding exposure across the pipeline.', handoff: 'You' },
  { name: 'Envoy', role: 'Submission', status: 'waiting', task: 'LOI ready to file the moment you approve.', handoff: 'Echo' },
  { name: 'Echo', role: 'Follow-up', status: 'working', task: 'Tracking 5 submitted applications for updates.', handoff: 'Atlas' },
  { name: 'Atlas', role: 'Relationship Intel', status: 'working', task: 'Mapping Green Climate Fund program officers.', handoff: 'Envoy' },
  { name: 'Sage', role: 'Learning', status: 'working', task: 'Analysing why the last GCF LOI was declined.', handoff: 'All agents' },
];

export const HANDOFFS: Handoff[] = [
  { from: 'Scout', to: 'Gatekeeper', what: '3 fresh soil-carbon grants for eligibility screening' },
  { from: 'Gatekeeper', to: 'Compass', what: 'DOE Carbon Shot cleared — ready to rank' },
  { from: 'Quill', to: 'Ledger', what: 'Impact draft needs budget figures for cost-benefit' },
  { from: 'Sage', to: 'Quill', what: 'Playbook update: lead Impact with MRV evidence' },
  { from: 'Atlas', to: 'Envoy', what: 'Warm GCF officer contact — schedule outreach' },
];

export async function getAgents(): Promise<Agent[]> {
  return AGENTS;
}

export async function getHandoffs(): Promise<Handoff[]> {
  return HANDOFFS;
}
