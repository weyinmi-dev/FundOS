export interface PipelineStage {
  stage: string;
  agent: string;
  state: 'done' | 'active' | 'queued';
}

export const PIPELINE: PipelineStage[] = [
  { stage: 'Discovered', agent: 'Scout', state: 'done' },
  { stage: 'Eligibility', agent: 'Gatekeeper', state: 'done' },
  { stage: 'Strategy', agent: 'Compass', state: 'done' },
  { stage: 'Writing', agent: 'Quill', state: 'active' },
  { stage: 'Budget', agent: 'Ledger', state: 'active' },
  { stage: 'Documents', agent: 'Archivist', state: 'active' },
  { stage: 'Compliance', agent: 'Sentinel', state: 'queued' },
  { stage: 'Submission', agent: 'Envoy', state: 'queued' },
];

export async function getPipeline(): Promise<PipelineStage[]> {
  return PIPELINE;
}
