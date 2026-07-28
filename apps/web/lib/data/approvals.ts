export interface ApprovalItem {
  id: string;
  tag: string;
  urgency: 'risk' | 'warn' | 'ok';
  agent: string;
  title: string;
  detail: string;
  whyText: string;
  evidence: string[];
  declineText: string;
  reviewTitle: string;
  reviewLines: string[];
}

export const APPROVALS: ApprovalItem[] = [
  {
    id: 'a1', tag: 'Deadline · 12d', urgency: 'risk', agent: 'Envoy · Submission', title: 'File Letter of Intent — DOE Carbon Negative Shot', detail: '$4.0M · LOI drafted, compliance cleared, budget attached.',
    whyText: 'The DOE window closes in 12 days and Oracle models an 18% win-probability penalty for late-cycle submissions. Everything downstream is already prepared, so filing now costs you nothing and protects the strongest US opportunity in your pipeline.',
    evidence: ['LOI drafted & self-reviewed', 'Compliance cleared', 'Budget within ceiling'],
    declineText: 'Envoy holds the LOI and re-surfaces it in 3 days — but you forfeit the early-review advantage.',
    reviewTitle: 'Draft — Letter of Intent',
    reviewLines: [
      'To: DOE Office of Clean Energy Demonstrations',
      'Re: Carbon Negative Shot — Verdantia Ltd.',
      '',
      'Verdantia intends to submit a full application for a $4.0M award to scale ML-verified soil-carbon removal across 18,000 hectares...',
      '',
      'Requested: $4.0M over 36 months  ·  Cost share: 22%',
    ],
  },
  {
    id: 'a2', tag: 'Budget change', urgency: 'warn', agent: 'Ledger · Budget', title: 'Approve €48,000 reallocation to MRV equipment', detail: 'Horizon Europe · keeps 12% contingency, strengthens Impact score.',
    whyText: 'Reviewers on this call weight measurement rigor heavily. Ledger models that moving EUR 48k into MRV equipment lifts the predicted Impact score by ~4 points while total cost and the 12% contingency are unchanged.',
    evidence: ['Total held at €2.5M', 'Contingency stays 12%', '+4 predicted Impact pts'],
    declineText: 'The original budget stands; the predicted reviewer score remains at 79.',
    reviewTitle: 'Budget change — before → after',
    reviewLines: [
      'Travel & dissemination   €120,000 → €72,000',
      'MRV equipment            €210,000 → €258,000',
      'Contingency              €300,000 → €300,000 (12%)',
      'Total                    €2,500,000 (unchanged)',
    ],
  },
  {
    id: 'a3', tag: 'Relationship', urgency: 'ok', agent: 'Atlas · Relationships', title: 'Send intro reply to the Wageningen co-PI', detail: 'Warm lead · reply drafted in your voice, ready to send.',
    whyText: 'Atlas rates this a hot lead: the co-PI replied within a day and the consortium slot is time-sensitive. Warm threads answered inside 24 hours convert to signed partnerships 2.3x more often.',
    evidence: ['Warm reply in 24h', 'Draft matches your voice', 'Fits Horizon consortium'],
    declineText: 'The thread goes cold; Atlas will nudge you again in 2 days.',
    reviewTitle: 'Draft reply — to Prof. J. Klaassen',
    reviewLines: [
      'Hi Jan,',
      '',
      'Great to hear from you — yes, we would be glad to have Wageningen lead the MRV work package. I will send the draft consortium agreement today and propose a call Thursday.',
      '',
      'Best, Maya',
    ],
  },
];

export async function getApprovals(): Promise<ApprovalItem[]> {
  return APPROVALS;
}
