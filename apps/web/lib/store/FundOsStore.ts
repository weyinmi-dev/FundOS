import { makeAutoObservable, runInAction } from 'mobx';
import { getOrg, type Org } from '@/lib/data/org';
import { getNavItems, type NavItem } from '@/lib/data/nav';
import { getKpis, getAwayStats, type Kpi, type AwayStat } from '@/lib/data/kpis';
import { getOpportunities, type Opportunity } from '@/lib/data/opportunities';
import { getActivity, type ActivityEvent } from '@/lib/data/activity';
import { getApprovals, type ApprovalItem } from '@/lib/data/approvals';
import { getTwin, getEnriching, getSources, type TwinGroup, type EnrichingItem } from '@/lib/data/twin';
import { getMemory, type MemoryEntry } from '@/lib/data/memory';
import { getAgents, getHandoffs, type Agent, type Handoff } from '@/lib/data/agents';
import { getPipeline, type PipelineStage } from '@/lib/data/pipeline';
import { getLearn, getLearnStats, type LearnedPattern, type LearnStats } from '@/lib/data/learning';
import { getContacts, type Contact } from '@/lib/data/contacts';
import { getAwards, getCalendar, type AwardRecord, type CalendarItem } from '@/lib/data/awards';
import { getSections, getCompliance, getCitations, type ProposalSection, type ComplianceItem, type Citation } from '@/lib/data/proposal';
import { getVersions, type VersionEntry } from '@/lib/data/versions';
import { getInterview, type InterviewQuestion } from '@/lib/data/interview';
import { getScanning, getReadyStats, type ScanItem, type ReadyStat } from '@/lib/data/scanning';

type SortKey = 'value' | 'match' | 'deadline' | 'effort';
type AuthMode = 'signin' | 'signup';
type ExpandedMode = 'why' | 'review' | null;

const URGENCY_COLORS = {
  risk: { color: '#bd4130', tint: '#f7e8e4' },
  warn: { color: '#8a5e15', tint: '#f6efdf' },
  ok: { color: '#16824f', tint: '#e9f4ee' },
} as const;

const CONFIDENCE_COLORS: Record<'h' | 'm' | 'l', string> = { h: '#1f9d63', m: '#b1791b', l: '#c0392b' };
const STATUS_COLORS: Record<Agent['status'], string> = { working: '#1f9d63', waiting: '#b1791b', idle: '#9a9ca4' };
const WARMTH_COLORS: Record<Contact['warmth'], { wColor: string; wTint: string }> = {
  Hot: { wColor: '#bd4130', wTint: '#f7e8e4' },
  Warm: { wColor: '#8a5e15', wTint: '#f6efdf' },
  Cool: { wColor: '#3567c0', wTint: '#e6ecf8' },
};
const OBLIGATION_COLORS: Record<'due' | 'ok' | 'done', { color: string; icon: string }> = {
  due: { color: '#bd4130', icon: '!' },
  ok: { color: '#1f9d63', icon: '✓' },
  done: { color: '#9a9ca4', icon: '✓' },
};
const CALENDAR_COLORS: Record<CalendarItem['urgency'], string> = { risk: '#bd4130', warn: '#b1791b', ok: '#1f9d63' };
const SECTION_DOT: Record<ProposalSection['comp'], string> = { ok: '#1f9d63', warn: '#b1791b', todo: '#c9c6bd' };

const EUR_VALUE: Record<string, number> = { he: 2500000, doe: 3680000, bef: 460000, xp: 920000, gcf: 2940000, bar: 1750000, seq: 8000000, ang: 750000 };

const PROPOSAL_BODY: Record<string, [string, string]> = {
  Excellence: [
    "Verdantia combines a validated biochar process with a machine-learning MRV stack that measures soil carbon at roughly a tenth the cost of manual sampling.",
    'The consortium unites a Series-A operator, a leading soil-science faculty and a regional farmer cooperative, covering the full research-to-deployment chain.',
  ],
  Implementation: [
    'Work is organised into five work packages over 36 months, with field deployment beginning in month 6 across three countries.',
    'Each work package has a named partner lead and risk-adjusted milestones, keeping delivery accountable and auditable.',
  ],
  Budget: [
    'Total cost is EUR 2.5M, of which 71% is direct research and field operations and 12% is held as contingency.',
    'Personnel and MRV equipment are the two largest lines, and every figure reconciles to the audited consortium rates.',
  ],
  Consortium: [
    'Three EU member states are represented, satisfying the collaboration requirement of the call with room to spare.',
    'Each partner brings a distinct, non-overlapping capability, and letters of commitment are attached for all five.',
  ],
  'Ethics & Data': [
    'Farm-level data is processed under GDPR with explicit consent and full anonymisation in any published dataset.',
    'An open data-management plan and a gender-equality plan are being finalised ahead of submission.',
  ],
  Impact: ['', ''],
};

function deadlineStyle(deadline: string): { dColor: string; dTint: string } {
  if (deadline === 'Rolling') return { dColor: '#6d7079', dTint: '#f0efe9' };
  const days = parseInt(deadline, 10);
  if (days <= 14) return { dColor: '#bd4130', dTint: '#f7e8e4' };
  if (days <= 35) return { dColor: '#8a5e15', dTint: '#f6efdf' };
  return { dColor: '#16824f', dTint: '#e9f4ee' };
}

function parseDeadlineDays(deadline: string): number {
  return deadline === 'Rolling' ? 99999 : parseInt(deadline, 10);
}

function effortScoreOf(o: Opportunity): number {
  return o.factors.find((f) => /Effort/.test(f.label))?.pct ?? 0;
}

function sectionStatusLabel(pct: number): string {
  if (pct >= 100) return 'Complete';
  if (pct >= 70) return 'In progress';
  if (pct >= 40) return 'Drafting';
  return 'Outline';
}

const SECTION_AGO = ['just now', '4 min ago', '1 hr ago', '2 hrs ago', '3 hrs ago', 'yesterday'];

export class FundOsStore {
  ready = false;

  org: Org | null = null;
  navItems: NavItem[] = [];
  kpis: Kpi[] = [];
  awayStats: AwayStat[] = [];
  opportunities: Opportunity[] = [];
  activity: ActivityEvent[] = [];
  approvalsRaw: ApprovalItem[] = [];
  twin: TwinGroup[] = [];
  enriching: EnrichingItem[] = [];
  sources: string[] = [];
  memory: MemoryEntry[] = [];
  agents: Agent[] = [];
  handoffs: Handoff[] = [];
  pipeline: PipelineStage[] = [];
  learn: LearnedPattern[] = [];
  learnStats: LearnStats | null = null;
  contacts: Contact[] = [];
  awards: AwardRecord[] = [];
  calendar: CalendarItem[] = [];
  sections: ProposalSection[] = [];
  compliance: ComplianceItem[] = [];
  citations: Citation[] = [];
  versions: VersionEntry[] = [];
  interview: InterviewQuestion[] = [];
  scanning: ScanItem[] = [];
  readyStats: ReadyStat[] = [];

  authOpen = true;
  authMode: AuthMode = 'signup';
  onboardingOpen = true;
  onboardStep = 0;
  building = false;
  url = 'verdantia.earth';
  selectedOppId: string | null = null;
  proposalSection = 1;
  approvedIds: string[] = [];
  sortKey: SortKey = 'value';
  expandedId: string | null = null;
  expandedMode: ExpandedMode = null;
  cmdOpen = false;
  cmdQuery = '';
  interviewIdx = 0;
  interviewAns: Record<number, string> = {};
  showAlts = false;

  private buildTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  async init() {
    const [
      org, navItems, kpis, awayStats, opportunities, activity, approvalsRaw,
      twin, enriching, sources, memory, agents, handoffs, pipeline, learn, learnStats,
      contacts, awards, calendar, sections, compliance, citations, versions,
      interview, scanning, readyStats,
    ] = await Promise.all([
      getOrg(), getNavItems(), getKpis(), getAwayStats(), getOpportunities(), getActivity(), getApprovals(),
      getTwin(), getEnriching(), getSources(), getMemory(), getAgents(), getHandoffs(), getPipeline(), getLearn(), getLearnStats(),
      getContacts(), getAwards(), getCalendar(), getSections(), getCompliance(), getCitations(), getVersions(),
      getInterview(), getScanning(), getReadyStats(),
    ]);
    runInAction(() => {
      this.org = org; this.navItems = navItems; this.kpis = kpis; this.awayStats = awayStats;
      this.opportunities = opportunities; this.activity = activity; this.approvalsRaw = approvalsRaw;
      this.twin = twin; this.enriching = enriching; this.sources = sources; this.memory = memory;
      this.agents = agents; this.handoffs = handoffs; this.pipeline = pipeline; this.learn = learn; this.learnStats = learnStats;
      this.contacts = contacts; this.awards = awards; this.calendar = calendar;
      this.sections = sections; this.compliance = compliance; this.citations = citations; this.versions = versions;
      this.interview = interview; this.scanning = scanning; this.readyStats = readyStats;
      this.ready = true;
    });
  }

  // ── actions ──────────────────────────────────────────

  openOpp(id: string) {
    this.selectedOppId = id;
  }

  closeOpp() {
    this.selectedOppId = null;
  }

  approve(id: string) {
    this.approvedIds = [...this.approvedIds, id];
    this.expandedId = null;
    this.expandedMode = null;
  }

  toggleExpand(id: string, mode: 'why' | 'review') {
    if (this.expandedId === id && this.expandedMode === mode) {
      this.expandedId = null;
      this.expandedMode = null;
    } else {
      this.expandedId = id;
      this.expandedMode = mode;
    }
  }

  setSection(i: number) {
    this.proposalSection = i;
  }

  startBuild() {
    this.building = true;
    this.onboardStep = 1;
    clearTimeout(this.buildTimer);
    this.buildTimer = setTimeout(() => {
      runInAction(() => {
        this.onboardStep = 2;
        this.building = false;
      });
    }, 2900);
  }

  enterApp() {
    this.onboardingOpen = false;
  }

  setUrl(value: string) {
    this.url = value;
  }

  setSort(key: SortKey) {
    this.sortKey = key;
  }

  answerInterview(value: string) {
    const idx = this.interviewIdx;
    this.interviewAns = { ...this.interviewAns, [idx]: value };
    if (idx >= 2) {
      this.onboardStep = 3;
      this.interviewIdx = 0;
    } else {
      this.interviewIdx = idx + 1;
    }
  }

  skipInterview() {
    this.answerInterview('(let AI infer)');
  }

  toggleAlts() {
    this.showAlts = !this.showAlts;
  }

  setAuthMode(mode: AuthMode) {
    this.authMode = mode;
  }

  submitAuth() {
    this.authOpen = false;
    if (this.authMode === 'signin') this.onboardingOpen = false;
  }

  openCmd() {
    this.cmdOpen = true;
    this.cmdQuery = '';
  }

  closeCmd() {
    this.cmdOpen = false;
  }

  toggleCmd() {
    this.cmdOpen = !this.cmdOpen;
    this.cmdQuery = '';
  }

  setCmdQuery(value: string) {
    this.cmdQuery = value;
  }

  dispose() {
    clearTimeout(this.buildTimer);
  }

  // ── computed (1:1 with the mockup's renderVals()) ────

  get pendingApprovals() {
    return this.approvalsRaw
      .filter((a) => !this.approvedIds.includes(a.id))
      .map((a) => ({ ...a, ...URGENCY_COLORS[a.urgency], agentName: a.agent.split(' · ')[0] }));
  }

  get sortedOpportunities() {
    const enriched = this.opportunities.map((o) => ({
      ...o,
      ...deadlineStyle(o.deadline),
      eur: EUR_VALUE[o.id] ?? 0,
      days: parseDeadlineDays(o.deadline),
      effortScore: effortScoreOf(o),
    }));
    const cmp: Record<SortKey, (a: typeof enriched[number], b: typeof enriched[number]) => number> = {
      value: (a, b) => b.eur - a.eur,
      match: (a, b) => b.score - a.score,
      deadline: (a, b) => a.days - b.days,
      effort: (a, b) => b.effortScore - a.effortScore,
    };
    return [...enriched].sort(cmp[this.sortKey]);
  }

  get topOpportunities() {
    return [...this.sortedOpportunities].sort((a, b) => b.score - a.score).slice(0, 2);
  }

  get selectedOpportunity() {
    const opp = this.sortedOpportunities.find((o) => o.id === this.selectedOppId);
    if (!opp) return null;
    const kind = /Equity|Angel/.test(opp.type) ? 'equity' : /Debt/.test(opp.type) ? 'debt' : /Challenge/.test(opp.type) ? 'prize' : 'grant';
    const ctaLabel = { grant: 'Assemble proposal →', equity: 'Prepare pitch & data room →', debt: 'Prepare financing pack →', prize: 'Enter the challenge →' }[kind];
    const eligLabel = { grant: 'Eligibility', equity: 'Investment thesis', debt: 'Serviceability', prize: 'Eligibility' }[kind];
    return { ...opp, kind, isEquity: kind === 'equity', isDebt: kind === 'debt', ctaLabel, eligLabel, note: opp.note ?? {} };
  }

  get twinWithConfidence() {
    return this.twin.map((g) => ({ ...g, items: g.items.map((f) => ({ ...f, confColor: CONFIDENCE_COLORS[f.conf] })) }));
  }

  get agentsWithStatusColor() {
    return this.agents.map((a) => ({ ...a, statusColor: STATUS_COLORS[a.status] }));
  }

  get activeAgentsCount() {
    return this.agents.filter((a) => a.status === 'working').length;
  }

  get contactsWithWarmth() {
    return this.contacts.map((c) => ({ ...c, ...WARMTH_COLORS[c.warmth] }));
  }

  get proposalSectionsUi() {
    return this.sections.map((sec, i) => ({
      name: sec.name,
      pct: sec.pct,
      dot: SECTION_DOT[sec.comp],
      i,
      active: i === this.proposalSection,
      bg: i === this.proposalSection ? '#f2f1eb' : 'transparent',
      weight: i === this.proposalSection ? 600 : 500,
    }));
  }

  get currentSection() {
    const sec = this.sections[this.proposalSection];
    const body = PROPOSAL_BODY[sec.name] ?? ['', ''];
    return {
      num: this.proposalSection + 1,
      name: sec.name,
      pct: sec.pct,
      dot: SECTION_DOT[sec.comp],
      statusLabel: sectionStatusLabel(sec.pct),
      ago: SECTION_AGO[this.proposalSection] ?? 'recently',
      b0: body[0],
      b1: body[1],
    };
  }

  get isImpactSection() {
    return this.proposalSection === 1;
  }

  get awardsWithObligationColors() {
    return this.awards.map((w) => ({ ...w, obligations: w.obligations.map((o) => ({ ...o, ...OBLIGATION_COLORS[o.state] })) }));
  }

  get calendarWithColors() {
    return this.calendar.map((c) => ({ ...c, color: CALENDAR_COLORS[c.urgency] }));
  }

  get learnWithColors() {
    return this.learn.map((l) => ({ ...l, color: l.good ? '#16824f' : '#bd4130' }));
  }

  get pipelineWithColors() {
    const map = {
      done: { dotBg: '#1f9d63', dotBorder: '#1f9d63', dotFg: '#06130c', mark: '✓', line: '#2f7d55' },
      active: { dotBg: '#b1791b', dotBorder: '#d19a3a', dotFg: '#fff', mark: '●', line: '#2f7d55' },
      queued: { dotBg: 'rgba(255,255,255,.06)', dotBorder: 'rgba(255,255,255,.22)', dotFg: '#7fa891', mark: '', line: 'rgba(255,255,255,.14)' },
    } as const;
    return this.pipeline.map((p) => ({ ...p, ...map[p.state] }));
  }

  get currentInterviewQuestion() {
    return this.interview[this.interviewIdx] ?? this.interview[0];
  }

  get interviewNumber() {
    return this.interviewIdx + 1;
  }

  get interviewPercent() {
    return Math.round(((this.interviewIdx + 1) / 3) * 100);
  }

  get authTitle() {
    return this.authMode === 'signin' ? 'Welcome back.' : 'Hire your funding team.';
  }

  get authSub() {
    return this.authMode === 'signin' ? 'Your AI team kept working while you were gone.' : 'Create an account and the AI starts building your Digital Twin in minutes.';
  }

  get authCta() {
    return this.authMode === 'signin' ? 'Sign in' : 'Create account';
  }
}
