import type {
  Account, Contact, StakeholderMap, InflectionPoint, StageConfidence,
  PlayRun, MeetingBrief, NextBestAction, PipelineStage, PlayTemplate, Opportunity,
  AccountTimeline, TimelineMilestone,
} from '@/types'

// ─── Reference: Pipeline Stages ──────────────────────────────────────────────

export const pipelineStages: PipelineStage[] = [
  {
    id: 'identify',
    label: 'Identify',
    order: 1,
    description: 'Establishing goals, stakeholders, and success criteria',
    entrySignals: ['Deal closed', 'IKT handoff completed from sales'],
    exitCriteria: ['Success criteria documented', 'Primary champion identified', 'Kickoff scheduled'],
    requiredPlayTypes: ['purchase_welcome', 'kickoff'],
    keyInflectionPoints: ['first_value'],
  },
  {
    id: 'align',
    label: 'Align',
    order: 2,
    description: 'Achieving first value and building shared ownership',
    entrySignals: ['Kickoff completed', 'Goals documented'],
    exitCriteria: ['First Value milestone achieved', 'Goals progressing', 'Alignment Meeting completed'],
    requiredPlayTypes: ['onboarding', 'first_value', 'alignment_meeting'],
    keyInflectionPoints: ['first_value', 'alignment_meeting'],
  },
  {
    id: 'advocate',
    label: 'Advocate',
    order: 3,
    description: 'Driving adoption, building champions, expanding stakeholder coverage',
    entrySignals: ['First Value achieved', 'Champion actively engaged'],
    exitCriteria: ['Executive sponsor engaged', 'Expansion signal identified', 'Measurable value articulated'],
    requiredPlayTypes: ['alignment_meeting', 'value_blocks'],
    keyInflectionPoints: ['goal_progress', 'stakeholder_coverage', 'insight_delivery'],
  },
  {
    id: 'intent',
    label: 'Intent',
    order: 4,
    description: 'Confirmed renewal and expansion intent from the customer',
    entrySignals: ['All exit criteria for Advocate met', 'Renewal conversation initiated'],
    exitCriteria: ['Renewal intent confirmed', 'Expansion scope agreed', 'Decision maker aligned'],
    requiredPlayTypes: ['renew_grow'],
    keyInflectionPoints: ['stakeholder_coverage'],
  },
  {
    id: 'nrr_close',
    label: 'NRR Close',
    order: 5,
    description: 'Executing renewal and growth close',
    entrySignals: ['Intent confirmed', 'Commercial discussion underway'],
    exitCriteria: ['Renewal signed', 'Expansion committed'],
    requiredPlayTypes: ['renew_grow'],
    keyInflectionPoints: [],
  },
]

// ─── Reference: Play Templates ───────────────────────────────────────────────

export const playTemplates: PlayTemplate[] = [
  {
    id: 'tmpl-alignment-meeting',
    type: 'alignment_meeting',
    label: 'Alignment Meeting',
    description: 'A structured quarterly meeting to realign on goals, assess progress, surface risks, and confirm the path to renewal.',
    stageId: 'advocate',
    entryCriteria: [
      'First Value milestone achieved',
      'At least 30 days since last Alignment Meeting or Kickoff',
      'Primary champion identified',
    ],
    interactionGuide: {
      agenda: [
        'Open: reason for meeting and desired outcomes',
        'Revisit goals from last session — what has changed?',
        'Review progress against primary success criteria',
        'Identify blockers or risks to progression',
        'Discuss next milestones and assign owners',
        'Close: confirm alignment and agree on next steps',
      ],
      requiredComponents: [
        'Revisit the reason for purchase',
        'Confirm success criteria are still relevant',
        'Update goal progress with evidence',
        'Assign owners to all open milestones',
      ],
      keyQuestions: [
        'What has changed since we last met — internally or with your goals?',
        'Are you on track with the outcomes you committed to at kickoff?',
        'What would make the next 90 days a clear success for your team?',
        'Who else in your organization should be part of this conversation?',
        'Is there anything that could slow down or derail your progress?',
      ],
      stakeholderTalkingPoints: [
        'For executive sponsors: frame around business outcomes and ROI',
        'For champions: focus on adoption blockers and team enablement',
        'For end users: confirm ease of use and unmet workflow needs',
      ],
    },
    requiredOutputFields: [
      { key: 'meetingSummary',    label: 'Meeting Summary',                  inputType: 'textarea', required: true,  placeholder: 'What was discussed and agreed?' },
      { key: 'goalUpdates',       label: 'Goal & Value Progress',            inputType: 'textarea', required: true,  placeholder: 'What changed? Any evidence of progress or regression?' },
      { key: 'stakeholderNotes',  label: 'Stakeholder Notes',                inputType: 'textarea', required: false, placeholder: 'Changes in contacts, influence, or engagement level' },
      { key: 'risksOpportunities',label: 'Risks & Opportunities Identified', inputType: 'textarea', required: false, placeholder: 'New risks surfaced or expansion signals identified' },
      { key: 'customerAdvanced',  label: 'Customer advanced toward next stage?', inputType: 'boolean', required: true, placeholder: '' },
      { key: 'progressionNotes',  label: 'Next Steps & Commitments',         inputType: 'textarea', required: true,  placeholder: 'What was committed to? Who owns what by when?' },
    ],
    progressionInfluence: ['alignment_meeting', 'goal_progress'],
  },
  {
    id: 'tmpl-kickoff',
    type: 'kickoff',
    label: 'Kickoff',
    description: 'Align both organizations using The Five Questions and establish the foundation for the post-sale journey.',
    stageId: 'identify',
    entryCriteria: ['Deal closed', 'IKT handoff completed'],
    interactionGuide: { agenda: [], requiredComponents: [], keyQuestions: [], stakeholderTalkingPoints: [] },
    requiredOutputFields: [],
    progressionInfluence: ['first_value'],
  },
  {
    id: 'tmpl-renew-grow',
    type: 'renew_grow',
    label: 'Renew & Grow',
    description: 'License audit + expansion discovery at renewal.',
    stageId: 'intent',
    entryCriteria: ['Account at Intent stage', 'Renewal within 90 days'],
    interactionGuide: { agenda: [], requiredComponents: [], keyQuestions: [], stakeholderTalkingPoints: [] },
    requiredOutputFields: [],
    progressionInfluence: ['stakeholder_coverage'],
  },
]

// ─── Accounts ─────────────────────────────────────────────────────────────────

export const accounts: Account[] = [
  {
    id: 'acc-001',
    name: 'Meridian Health Systems',
    industry: 'Healthcare SaaS',
    arr: 180000,
    csm: 'Sarah Chen',
    stage: 'advocate',
    progressionStatus: 'advancing',
    renewalDate: '2026-09-15',
    daysInStage: 18,
    createdAt: '2025-12-01T00:00:00Z',
  },
  {
    id: 'acc-002',
    name: 'Apex Logistics Group',
    industry: 'Supply Chain SaaS',
    arr: 95000,
    csm: 'Marcus Reid',
    stage: 'align',
    progressionStatus: 'stalled',
    renewalDate: '2026-07-01',
    daysInStage: 34,
    createdAt: '2026-01-10T00:00:00Z',
  },
  {
    id: 'acc-003',
    name: 'Vantage Financial',
    industry: 'Fintech',
    arr: 240000,
    csm: 'Sarah Chen',
    stage: 'intent',
    progressionStatus: 'advancing',
    renewalDate: '2026-06-01',
    daysInStage: 12,
    createdAt: '2025-09-01T00:00:00Z',
  },
  {
    id: 'acc-004',
    name: 'Thornwood Media',
    industry: 'Media & Publishing',
    arr: 48000,
    csm: 'Marcus Reid',
    stage: 'identify',
    progressionStatus: 'at_risk',
    renewalDate: '2026-05-15',
    daysInStage: 62,
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 'acc-005',
    name: 'ClearPath Analytics',
    industry: 'Data & Analytics',
    arr: 132000,
    csm: 'Sarah Chen',
    stage: 'align',
    progressionStatus: 'advancing',
    renewalDate: '2026-11-01',
    daysInStage: 9,
    createdAt: '2026-02-01T00:00:00Z',
  },
]

// ─── Contacts ─────────────────────────────────────────────────────────────────

export const contacts: Contact[] = [
  // Meridian
  { id: 'con-001', accountId: 'acc-001', name: 'James Whitfield',  title: 'VP Operations',         email: 'j.whitfield@meridianhealth.com',  notes: 'Executive sponsor. Renewal authority.' },
  { id: 'con-002', accountId: 'acc-001', name: 'Priya Nair',       title: 'Director of IT',         email: 'p.nair@meridianhealth.com',        notes: 'Primary champion. Drives internal adoption.' },
  { id: 'con-003', accountId: 'acc-001', name: 'David Ko',         title: 'CFO',                    email: null,                              notes: 'Finance sign-off for renewal. No contact yet.' },
  { id: 'con-004', accountId: 'acc-001', name: 'Aisha Torres',     title: 'Finance Ops Manager',    email: null,                              notes: 'Potential expansion contact. Finance Ops team.' },
  // Apex
  { id: 'con-005', accountId: 'acc-002', name: 'Ron Castellano',   title: 'COO',                    email: 'r.castellano@apexlogistics.com',   notes: null },
  { id: 'con-006', accountId: 'acc-002', name: 'Linda Park',       title: 'Operations Lead',        email: 'l.park@apexlogistics.com',         notes: 'Champion. Active in weekly check-ins.' },
  // Vantage
  { id: 'con-007', accountId: 'acc-003', name: 'Claire Nguyen',    title: 'Chief Revenue Officer',  email: 'c.nguyen@vantagefinancial.com',    notes: 'Renewal authority.' },
  { id: 'con-008', accountId: 'acc-003', name: 'Tom Adler',        title: 'Head of RevOps',         email: 't.adler@vantagefinancial.com',     notes: 'Power user and champion.' },
  { id: 'con-009', accountId: 'acc-003', name: 'Fatima Osei',      title: 'FP&A Lead',              email: null,                              notes: null },
  // Thornwood
  { id: 'con-010', accountId: 'acc-004', name: 'Gwen Hartley',     title: 'VP Content',             email: 'g.hartley@thornwoodmedia.com',     notes: 'Decision maker. Gone dark.' },
  { id: 'con-011', accountId: 'acc-004', name: 'Sam Burgess',      title: 'Digital Producer',       email: 's.burgess@thornwoodmedia.com',     notes: 'End user. Still engaged.' },
  // ClearPath
  { id: 'con-012', accountId: 'acc-005', name: 'Beth Morales',     title: 'Head of Data Science',   email: 'b.morales@clearpathanalytics.com', notes: 'Champion.' },
  { id: 'con-013', accountId: 'acc-005', name: 'Kevin Walsh',      title: 'CTO',                    email: null,                              notes: 'Decision maker. Not re-engaged since kickoff.' },
]

// ─── Stakeholder Maps ─────────────────────────────────────────────────────────

export const stakeholderMaps: StakeholderMap[] = [
  // Meridian
  { id: 'sm-001', accountId: 'acc-001', contactId: 'con-001', influence: 'decision_maker', coverageStatus: 'engaged',       lastContactDate: '2026-03-22', coverageRisk: false, notes: null },
  { id: 'sm-002', accountId: 'acc-001', contactId: 'con-002', influence: 'champion',       coverageStatus: 'engaged',       lastContactDate: '2026-04-12', coverageRisk: false, notes: null },
  { id: 'sm-003', accountId: 'acc-001', contactId: 'con-003', influence: 'decision_maker', coverageStatus: 'not_contacted', lastContactDate: null,         coverageRisk: true,  notes: 'Renewal requires CFO sign-off. Needs intro before Q3.' },
  { id: 'sm-004', accountId: 'acc-001', contactId: 'con-004', influence: 'end_user',       coverageStatus: 'not_contacted', lastContactDate: null,         coverageRisk: false, notes: 'Potential expansion contact via Finance Ops team.' },
  // Apex
  { id: 'sm-005', accountId: 'acc-002', contactId: 'con-005', influence: 'decision_maker', coverageStatus: 'dormant',       lastContactDate: '2026-02-01', coverageRisk: true,  notes: 'COO gone dark. Last contact 78 days ago.' },
  { id: 'sm-006', accountId: 'acc-002', contactId: 'con-006', influence: 'champion',       coverageStatus: 'engaged',       lastContactDate: '2026-04-10', coverageRisk: false, notes: null },
  // Vantage
  { id: 'sm-007', accountId: 'acc-003', contactId: 'con-007', influence: 'decision_maker', coverageStatus: 'engaged',       lastContactDate: '2026-04-08', coverageRisk: false, notes: null },
  { id: 'sm-008', accountId: 'acc-003', contactId: 'con-008', influence: 'champion',       coverageStatus: 'engaged',       lastContactDate: '2026-04-15', coverageRisk: false, notes: null },
  { id: 'sm-009', accountId: 'acc-003', contactId: 'con-009', influence: 'end_user',       coverageStatus: 'engaged',       lastContactDate: '2026-04-02', coverageRisk: false, notes: null },
  // Thornwood
  { id: 'sm-010', accountId: 'acc-004', contactId: 'con-010', influence: 'decision_maker', coverageStatus: 'dormant',       lastContactDate: '2026-02-05', coverageRisk: true,  notes: null },
  { id: 'sm-011', accountId: 'acc-004', contactId: 'con-011', influence: 'end_user',       coverageStatus: 'engaged',       lastContactDate: '2026-04-01', coverageRisk: false, notes: null },
  // ClearPath
  { id: 'sm-012', accountId: 'acc-005', contactId: 'con-012', influence: 'champion',       coverageStatus: 'engaged',       lastContactDate: '2026-04-14', coverageRisk: false, notes: null },
  { id: 'sm-013', accountId: 'acc-005', contactId: 'con-013', influence: 'decision_maker', coverageStatus: 'dormant',       lastContactDate: '2026-02-01', coverageRisk: true,  notes: null },
]

// ─── Inflection Points ────────────────────────────────────────────────────────

export const inflectionPoints: InflectionPoint[] = [
  // Meridian
  { id: 'ip-001', accountId: 'acc-001', type: 'first_value',         label: 'First Value',          status: 'achieved',    dueDate: '2026-02-28', achievedDate: '2026-02-10', achievedByRunId: 'run-003' },
  { id: 'ip-002', accountId: 'acc-001', type: 'alignment_meeting',   label: 'Alignment Meeting',    status: 'pending',     dueDate: '2026-04-28', achievedDate: null,         achievedByRunId: null },
  { id: 'ip-003', accountId: 'acc-001', type: 'goal_progress',       label: 'Goal Progress',        status: 'pending',     dueDate: '2026-05-01', achievedDate: null,         achievedByRunId: null },
  { id: 'ip-004', accountId: 'acc-001', type: 'stakeholder_coverage',label: 'Stakeholder Coverage', status: 'pending',     dueDate: null,         achievedDate: null,         achievedByRunId: null },
  { id: 'ip-005', accountId: 'acc-001', type: 'insight_delivery',    label: 'Insight Delivery',     status: 'not_started', dueDate: null,         achievedDate: null,         achievedByRunId: null },
  // Apex
  { id: 'ip-006', accountId: 'acc-002', type: 'first_value',         label: 'First Value',          status: 'overdue',     dueDate: '2026-03-15', achievedDate: null,         achievedByRunId: null },
  { id: 'ip-007', accountId: 'acc-002', type: 'alignment_meeting',   label: 'Alignment Meeting',    status: 'pending',     dueDate: '2026-04-30', achievedDate: null,         achievedByRunId: null },
  { id: 'ip-008', accountId: 'acc-002', type: 'goal_progress',       label: 'Goal Progress',        status: 'not_started', dueDate: null,         achievedDate: null,         achievedByRunId: null },
  // Vantage
  { id: 'ip-009', accountId: 'acc-003', type: 'first_value',         label: 'First Value',          status: 'achieved',    dueDate: null,         achievedDate: '2025-11-05', achievedByRunId: 'run-007' },
  { id: 'ip-010', accountId: 'acc-003', type: 'alignment_meeting',   label: 'Alignment Meeting',    status: 'achieved',    dueDate: null,         achievedDate: '2026-03-10', achievedByRunId: 'run-008' },
  { id: 'ip-011', accountId: 'acc-003', type: 'goal_progress',       label: 'Goal Progress',        status: 'achieved',    dueDate: null,         achievedDate: '2026-04-01', achievedByRunId: null },
  { id: 'ip-012', accountId: 'acc-003', type: 'stakeholder_coverage',label: 'Stakeholder Coverage', status: 'achieved',    dueDate: null,         achievedDate: '2026-02-14', achievedByRunId: null },
  // Thornwood
  { id: 'ip-013', accountId: 'acc-004', type: 'first_value',         label: 'First Value',          status: 'overdue',     dueDate: '2026-02-28', achievedDate: null,         achievedByRunId: null },
  { id: 'ip-014', accountId: 'acc-004', type: 'alignment_meeting',   label: 'Alignment Meeting',    status: 'not_started', dueDate: null,         achievedDate: null,         achievedByRunId: null },
  // ClearPath
  { id: 'ip-015', accountId: 'acc-005', type: 'first_value',         label: 'First Value',          status: 'achieved',    dueDate: null,         achievedDate: '2026-04-05', achievedByRunId: null },
  { id: 'ip-016', accountId: 'acc-005', type: 'alignment_meeting',   label: 'Alignment Meeting',    status: 'pending',     dueDate: '2026-05-10', achievedDate: null,         achievedByRunId: null },
  { id: 'ip-017', accountId: 'acc-005', type: 'goal_progress',       label: 'Goal Progress',        status: 'pending',     dueDate: null,         achievedDate: null,         achievedByRunId: null },
]

// ─── Play Runs ────────────────────────────────────────────────────────────────

export const playRuns: PlayRun[] = [
  // Meridian — history
  { id: 'run-001', accountId: 'acc-001', playTemplateId: 'tmpl-kickoff',           type: 'kickoff',           label: 'Kickoff',           status: 'completed',   currentStep: 4, scheduledDate: '2026-01-15', startedAt: '2026-01-15T09:00:00Z', completedAt: '2026-01-15T10:30:00Z', briefId: null,       outputId: null },
  { id: 'run-002', accountId: 'acc-001', playTemplateId: 'tmpl-kickoff',           type: 'onboarding',        label: 'Onboarding',        status: 'completed',   currentStep: 4, scheduledDate: '2026-02-01', startedAt: '2026-02-01T09:00:00Z', completedAt: '2026-02-20T16:00:00Z', briefId: null,       outputId: null },
  { id: 'run-003', accountId: 'acc-001', playTemplateId: 'tmpl-kickoff',           type: 'first_value',       label: 'First Value',       status: 'completed',   currentStep: 4, scheduledDate: '2026-02-10', startedAt: '2026-02-10T09:00:00Z', completedAt: '2026-02-10T11:00:00Z', briefId: null,       outputId: null },
  // Meridian — ACTIVE alignment meeting
  { id: 'run-004', accountId: 'acc-001', playTemplateId: 'tmpl-alignment-meeting', type: 'alignment_meeting', label: 'Alignment Meeting', status: 'in_progress', currentStep: 1, scheduledDate: '2026-04-28', startedAt: '2026-04-21T09:00:00Z', completedAt: null,                   briefId: 'brief-001', outputId: null },
  // Meridian — upcoming
  { id: 'run-005', accountId: 'acc-001', playTemplateId: 'tmpl-kickoff',           type: 'value_blocks',      label: 'Value Blocks',      status: 'not_started', currentStep: 1, scheduledDate: '2026-05-15', startedAt: null,                   completedAt: null,                   briefId: null,       outputId: null },
  // Apex
  { id: 'run-006', accountId: 'acc-002', playTemplateId: 'tmpl-kickoff',           type: 'kickoff',           label: 'Kickoff',           status: 'completed',   currentStep: 4, scheduledDate: '2026-01-28', startedAt: '2026-01-28T09:00:00Z', completedAt: '2026-01-28T10:30:00Z', briefId: null,       outputId: null },
  // Vantage
  { id: 'run-007', accountId: 'acc-003', playTemplateId: 'tmpl-kickoff',           type: 'first_value',       label: 'First Value',       status: 'completed',   currentStep: 4, scheduledDate: '2025-11-05', startedAt: '2025-11-05T09:00:00Z', completedAt: '2025-11-05T11:00:00Z', briefId: null,       outputId: null },
  { id: 'run-008', accountId: 'acc-003', playTemplateId: 'tmpl-alignment-meeting', type: 'alignment_meeting', label: 'Alignment Meeting', status: 'completed',   currentStep: 4, scheduledDate: '2026-03-10', startedAt: '2026-03-10T09:00:00Z', completedAt: '2026-03-10T11:00:00Z', briefId: null,       outputId: null },
  { id: 'run-009', accountId: 'acc-003', playTemplateId: 'tmpl-renew-grow',        type: 'renew_grow',        label: 'Renew & Grow',      status: 'in_progress', currentStep: 1, scheduledDate: '2026-05-01', startedAt: '2026-04-15T09:00:00Z', completedAt: null,                   briefId: null,       outputId: null },
  // ClearPath
  { id: 'run-010', accountId: 'acc-005', playTemplateId: 'tmpl-alignment-meeting', type: 'alignment_meeting', label: 'Alignment Meeting', status: 'not_started', currentStep: 1, scheduledDate: '2026-05-10', startedAt: null,                   completedAt: null,                   briefId: null,       outputId: null },
]

// ─── Meeting Brief (Meridian's active Alignment Meeting) ──────────────────────

export const meetingBriefs: MeetingBrief[] = [
  {
    id: 'brief-001',
    playRunId: 'run-004',
    accountId: 'acc-001',
    generatedAt: '2026-04-21T08:45:00Z',
    generatedBy: 'seed',
    customerSummary:
      'Meridian Health Systems is 3 months post-onboarding and has achieved their First Value milestone — reducing manual reporting time by 40%. The executive sponsor, VP of Operations James Whitfield, is engaged and attended the last alignment session in March. Primary champion Priya Nair (Director of IT) has been active in weekly check-ins and is driving internal adoption across two departments.',
    goalProgress:
      'Primary goal (reporting automation) is tracking at 40% complete against a 60% target for this period — slightly behind pace but recoverable. The secondary goal (cross-department visibility) has not yet been formally addressed and has no assigned owner on the customer side. This gap is the most significant risk to progressing out of Advocate stage.',
    risks: [
      {
        id: 'risk-001',
        text: 'Cross-department visibility goal has no assigned owner on the customer side — risk of stalling at Advocate',
        priority: 'high',
        linkedInflectionPointId: 'ip-003',
        linkedStakeholderMapId: null,
      },
      {
        id: 'risk-002',
        text: 'No contact established with CFO David Ko — renewal sign-off typically requires finance approval',
        priority: 'high',
        linkedInflectionPointId: null,
        linkedStakeholderMapId: 'sm-003',
      },
      {
        id: 'risk-003',
        text: 'Two power users have not logged in within the past 14 days — potential adoption plateau',
        priority: 'medium',
        linkedInflectionPointId: null,
        linkedStakeholderMapId: null,
      },
    ],
    expansionSignals: [
      {
        id: 'exp-001',
        text: 'Director of IT mentioned Finance Ops team is struggling with the same reporting problem — natural expansion play',
        priority: 'high',
        linkedInflectionPointId: null,
        linkedStakeholderMapId: 'sm-004',
      },
      {
        id: 'exp-002',
        text: 'Product usage spiked 35% in March — suggests growing internal adoption beyond initial team',
        priority: 'medium',
        linkedInflectionPointId: null,
        linkedStakeholderMapId: null,
      },
    ],
    recommendedFocus: [
      {
        id: 'focus-001',
        text: 'Assign an owner and set a milestone date for the cross-department visibility goal before close of meeting',
        priority: 'high',
        linkedInflectionPointId: 'ip-003',
        linkedStakeholderMapId: null,
      },
      {
        id: 'focus-002',
        text: 'Facilitate a CFO introduction — request that James Whitfield make the intro before end of May',
        priority: 'high',
        linkedInflectionPointId: null,
        linkedStakeholderMapId: 'sm-003',
      },
      {
        id: 'focus-003',
        text: 'Surface the Finance Ops expansion opportunity — position as a natural next step, not a sales conversation',
        priority: 'medium',
        linkedInflectionPointId: null,
        linkedStakeholderMapId: 'sm-004',
      },
    ],
  },
]

// ─── Stage Confidences ────────────────────────────────────────────────────────

export const stageConfidences: StageConfidence[] = [
  {
    id: 'sc-001',
    accountId: 'acc-001',
    stage: 'advocate',
    score: 72,
    trend: 'improving',
    priorScore: 60,
    updatedAt: '2026-04-12T00:00:00Z',
    updatedByRunId: null,
    signals: [
      { id: 'sig-001', label: 'First Value achieved',                         weight: 25, status: 'met',     detail: 'Achieved 2026-02-10. Reporting automation milestone confirmed.',                                  linkedInflectionPointId: 'ip-001' },
      { id: 'sig-002', label: 'Alignment Meeting within last 60 days',        weight: 20, status: 'partial', detail: 'Last alignment was 2026-03-22 — 30 days ago. Next due April 28.',                                linkedInflectionPointId: 'ip-002' },
      { id: 'sig-003', label: 'Primary goal on track',                        weight: 20, status: 'partial', detail: 'Reporting automation at 40% vs 60% target. Cross-dept goal has no owner.',                      linkedInflectionPointId: 'ip-003' },
      { id: 'sig-004', label: 'Decision maker engaged',                       weight: 20, status: 'partial', detail: 'VP Operations engaged. CFO not yet contacted — renewal sign-off risk.',                         linkedInflectionPointId: 'ip-004' },
      { id: 'sig-005', label: 'Expansion signal identified',                  weight: 15, status: 'met',     detail: 'Finance Ops expansion opportunity identified by champion.',                                       linkedInflectionPointId: null },
    ],
  },
  {
    id: 'sc-002',
    accountId: 'acc-002',
    stage: 'align',
    score: 32,
    trend: 'declining',
    priorScore: 45,
    updatedAt: '2026-04-01T00:00:00Z',
    updatedByRunId: null,
    signals: [
      { id: 'sig-006', label: 'First Value achieved',          weight: 40, status: 'unmet',   detail: 'First Value is 36 days overdue.',                           linkedInflectionPointId: 'ip-006' },
      { id: 'sig-007', label: 'Decision maker engaged',        weight: 30, status: 'unmet',   detail: 'COO last contacted 78 days ago — effectively dormant.',     linkedInflectionPointId: null },
      { id: 'sig-008', label: 'Champion actively engaged',     weight: 30, status: 'met',     detail: 'Operations Lead Linda Park is engaged and responsive.',     linkedInflectionPointId: null },
    ],
  },
  {
    id: 'sc-003',
    accountId: 'acc-003',
    stage: 'intent',
    score: 88,
    trend: 'improving',
    priorScore: 76,
    updatedAt: '2026-04-15T00:00:00Z',
    updatedByRunId: 'run-008',
    signals: [
      { id: 'sig-009', label: 'All Advocate milestones achieved', weight: 40, status: 'met', detail: 'First Value, Alignment Meeting, Goal Progress, Stakeholder Coverage all achieved.', linkedInflectionPointId: null },
      { id: 'sig-010', label: 'Decision maker aligned',          weight: 30, status: 'met', detail: 'CRO Claire Nguyen confirmed renewal intent on April 8.',                            linkedInflectionPointId: null },
      { id: 'sig-011', label: 'Expansion scope identified',      weight: 30, status: 'met', detail: 'Budget discussion in June. FP&A team expansion confirmed.',                        linkedInflectionPointId: null },
    ],
  },
  {
    id: 'sc-004',
    accountId: 'acc-004',
    stage: 'identify',
    score: 18,
    trend: 'declining',
    priorScore: 30,
    updatedAt: '2026-03-15T00:00:00Z',
    updatedByRunId: null,
    signals: [
      { id: 'sig-012', label: 'Kickoff completed',              weight: 33, status: 'met',   detail: 'Kickoff completed Jan 10.',                                  linkedInflectionPointId: null },
      { id: 'sig-013', label: 'Goals documented',               weight: 33, status: 'unmet', detail: 'No success criteria documented post-kickoff.',               linkedInflectionPointId: null },
      { id: 'sig-014', label: 'Decision maker engaged',         weight: 34, status: 'unmet', detail: 'VP Content last contacted 74 days ago.',                     linkedInflectionPointId: null },
    ],
  },
  {
    id: 'sc-005',
    accountId: 'acc-005',
    stage: 'align',
    score: 58,
    trend: 'improving',
    priorScore: 40,
    updatedAt: '2026-04-10T00:00:00Z',
    updatedByRunId: null,
    signals: [
      { id: 'sig-015', label: 'First Value achieved',           weight: 40, status: 'met',     detail: 'First Value achieved April 5.',                            linkedInflectionPointId: 'ip-015' },
      { id: 'sig-016', label: 'Alignment Meeting scheduled',    weight: 30, status: 'partial', detail: 'Alignment Meeting scheduled May 10 — not yet completed.',  linkedInflectionPointId: 'ip-016' },
      { id: 'sig-017', label: 'Decision maker re-engaged',      weight: 30, status: 'unmet',   detail: 'CTO Kevin Walsh not re-engaged since kickoff.',             linkedInflectionPointId: null },
    ],
  },
]

// ─── Next Best Actions ────────────────────────────────────────────────────────

// ─── Opportunities ────────────────────────────────────────────────────────────

export const opportunities: Opportunity[] = [
  // ── Meridian Health Systems ──────────────────────────────────────────────────
  {
    id: 'opp-001', accountId: 'acc-001', accountName: 'Meridian Health Systems',
    type: 'renewal', stage: 'advocate',
    estimatedValue: 180000, confidence: 'medium',
    daysInStage: 18, progressionStatus: 'advancing', movement: 'improving',
    closeDate: '2026-09-15',
    executionRisks: [],
  },
  {
    id: 'opp-002', accountId: 'acc-001', accountName: 'Meridian Health Systems',
    type: 'expansion', stage: 'identify',
    estimatedValue: 45000, confidence: 'high',
    daysInStage: 7, progressionStatus: 'advancing', movement: 'flat',
    closeDate: null,
    executionRisks: [],
  },
  // ── Apex Logistics Group ─────────────────────────────────────────────────────
  {
    id: 'opp-003', accountId: 'acc-002', accountName: 'Apex Logistics Group',
    type: 'renewal', stage: 'align',
    estimatedValue: 95000, confidence: 'low',
    daysInStage: 34, progressionStatus: 'at_risk', movement: 'declining',
    closeDate: '2026-07-01',
    executionRisks: [
      { type: 'first_value_not_achieved', severity: 'blocking', label: 'First Value not achieved' },
      { type: 'decision_maker_dormant',   severity: 'blocking', label: 'COO dark — 78d no contact' },
    ],
  },
  // ── Vantage Financial ────────────────────────────────────────────────────────
  {
    id: 'opp-004', accountId: 'acc-003', accountName: 'Vantage Financial',
    type: 'renewal', stage: 'intent',
    estimatedValue: 240000, confidence: 'high',
    daysInStage: 12, progressionStatus: 'advancing', movement: 'improving',
    closeDate: '2026-06-01',
    executionRisks: [],
  },
  {
    id: 'opp-005', accountId: 'acc-003', accountName: 'Vantage Financial',
    type: 'expansion', stage: 'advocate',
    estimatedValue: 72000, confidence: 'medium',
    daysInStage: 21, progressionStatus: 'advancing', movement: 'flat',
    closeDate: null,
    executionRisks: [],
  },
  // ── Thornwood Media ──────────────────────────────────────────────────────────
  {
    id: 'opp-006', accountId: 'acc-004', accountName: 'Thornwood Media',
    type: 'renewal', stage: 'align',
    estimatedValue: 48000, confidence: 'low',
    daysInStage: 62, progressionStatus: 'at_risk', movement: 'declining',
    closeDate: '2026-05-15',
    executionRisks: [
      { type: 'first_value_not_achieved',  severity: 'blocking', label: 'First Value not achieved' },
      { type: 'no_executive_stakeholder',  severity: 'blocking', label: 'No executive stakeholder' },
      { type: 'renewal_window_closing',    severity: 'blocking', label: 'Renewal in 23d — window closing' },
    ],
  },
  // ── ClearPath Analytics ──────────────────────────────────────────────────────
  {
    id: 'opp-007', accountId: 'acc-005', accountName: 'ClearPath Analytics',
    type: 'renewal', stage: 'align',
    estimatedValue: 132000, confidence: 'medium',
    daysInStage: 9, progressionStatus: 'advancing', movement: 'improving',
    closeDate: '2026-11-01',
    executionRisks: [
      { type: 'missing_alignment_meeting', severity: 'warning', label: 'Alignment Meeting due in 19d' },
    ],
  },
  {
    id: 'opp-008', accountId: 'acc-005', accountName: 'ClearPath Analytics',
    type: 'upsell', stage: 'identify',
    estimatedValue: 28000, confidence: 'medium',
    daysInStage: 9, progressionStatus: 'stalled', movement: 'flat',
    closeDate: null,
    executionRisks: [],
  },
]

// ─── Next Best Actions ────────────────────────────────────────────────────────

export const nextBestActions: NextBestAction[] = [
  // Meridian
  {
    id: 'nba-001', accountId: 'acc-001',
    label: 'Run Alignment Meeting — Meridian Renewal',
    reason: 'Last alignment was 30 days ago. Goal progress needs review before end of quarter. Stage confidence requires this to advance.',
    priority: 'high', source: 'rule', status: 'active',
    linkedPlayTemplateId: 'tmpl-alignment-meeting', linkedInflectionPointId: 'ip-002', linkedStakeholderMapId: null,
    createdAt: '2026-04-21T08:00:00Z', completedAt: null, triggeredByOutputId: null,
  },
  {
    id: 'nba-002', accountId: 'acc-001',
    label: 'Introduce CFO — required for Meridian Renewal close',
    reason: 'Renewal requires finance sign-off. No contact established with CFO David Ko. Renewal is in 147 days.',
    priority: 'high', source: 'rule', status: 'active',
    linkedPlayTemplateId: null, linkedInflectionPointId: null, linkedStakeholderMapId: 'sm-003',
    createdAt: '2026-04-21T08:00:00Z', completedAt: null, triggeredByOutputId: null,
  },
  {
    id: 'nba-003', accountId: 'acc-001',
    label: 'Initiate Finance Ops expansion conversation',
    reason: 'Expansion signal detected. Director of IT confirmed Finance Ops has the same pain point. Budget discussion in June.',
    priority: 'medium', source: 'rule', status: 'active',
    linkedPlayTemplateId: 'tmpl-kickoff', linkedInflectionPointId: null, linkedStakeholderMapId: 'sm-004',
    createdAt: '2026-04-21T08:00:00Z', completedAt: null, triggeredByOutputId: null,
  },
  // Apex
  {
    id: 'nba-004', accountId: 'acc-002',
    label: 'First Value overdue — Apex Renewal at risk',
    reason: 'Customer has not achieved First Value. Risk of churn is elevated. Renewal in 71 days.',
    priority: 'high', source: 'rule', status: 'active',
    linkedPlayTemplateId: null, linkedInflectionPointId: 'ip-006', linkedStakeholderMapId: null,
    createdAt: '2026-04-20T08:00:00Z', completedAt: null, triggeredByOutputId: null,
  },
  {
    id: 'nba-005', accountId: 'acc-002',
    label: 'Re-engage COO — Apex Renewal stalling',
    reason: 'Decision maker has gone dark. Renewal is in 71 days. Non-renewal risk is high.',
    priority: 'high', source: 'rule', status: 'active',
    linkedPlayTemplateId: null, linkedInflectionPointId: null, linkedStakeholderMapId: 'sm-005',
    createdAt: '2026-04-20T08:00:00Z', completedAt: null, triggeredByOutputId: null,
  },
  // Vantage
  {
    id: 'nba-006', accountId: 'acc-003',
    label: 'Advance Renew & Grow — Vantage Renewal in 41d',
    reason: 'Account is at Intent stage with 88% confidence. Begin license audit and expansion discovery.',
    priority: 'high', source: 'rule', status: 'active',
    linkedPlayTemplateId: 'tmpl-renew-grow', linkedInflectionPointId: null, linkedStakeholderMapId: null,
    createdAt: '2026-04-21T08:00:00Z', completedAt: null, triggeredByOutputId: null,
  },
  // Thornwood
  {
    id: 'nba-007', accountId: 'acc-004',
    label: 'CRITICAL: Thornwood Renewal closes in 23d',
    reason: 'First Value not achieved. Onboarding overdue. Decision maker dormant. Non-renewal risk is critical.',
    priority: 'high', source: 'rule', status: 'active',
    linkedPlayTemplateId: null, linkedInflectionPointId: 'ip-013', linkedStakeholderMapId: 'sm-010',
    createdAt: '2026-04-20T08:00:00Z', completedAt: null, triggeredByOutputId: null,
  },
  // ClearPath
  {
    id: 'nba-008', accountId: 'acc-005',
    label: 'Schedule Alignment Meeting — due in 19 days',
    reason: 'First Value achieved. Alignment Meeting is the next required step to advance to Advocate stage.',
    priority: 'medium', source: 'rule', status: 'active',
    linkedPlayTemplateId: 'tmpl-alignment-meeting', linkedInflectionPointId: 'ip-016', linkedStakeholderMapId: null,
    createdAt: '2026-04-21T08:00:00Z', completedAt: null, triggeredByOutputId: null,
  },
]

// ─── Account Timelines ────────────────────────────────────────────────────────

function m(
  id: TimelineMilestone['id'],
  status: TimelineMilestone['status'],
  expectedDay: number,
  actualDay: number | null,
  delayDays: number | null,
  notes: string | null,
  linkedPlayTemplateId: string | null,
  linkedPlayRunId: string | null,
): TimelineMilestone {
  return { id, status, expectedDay, actualDay, delayDays, notes, linkedPlayTemplateId, linkedPlayRunId }
}

export const accountTimelines: AccountTimeline[] = [
  // ── Meridian Health Systems (acc-001, ~142d, advocate, advancing) ─────────
  {
    accountId: 'acc-001',
    year: 1,
    milestones: [
      m('purchase_moment',         'completed',   1,   1,   null, 'IKT handoff completed. Goals and stakeholders documented.',                          'tmpl-kickoff',           null),
      m('first_meeting',           'completed',   7,   14,  7,    'Kickoff delayed 7 days due to executive scheduling conflict.',                        'tmpl-kickoff',           'run-001'),
      m('onboarding_decisions',    'completed',   14,  28,  14,   'Configuration scope expanded during onboarding — extended by 2 weeks.',              'tmpl-kickoff',           'run-002'),
      m('early_success',           'completed',   30,  71,  41,   'First Value achieved on reporting automation milestone. 41 days behind target.',      'tmpl-kickoff',           'run-003'),
      m('goal_attainment',         'in_progress', 90,  null, null,'Goal reviews underway. Champion confirmed progress on 2 of 3 success criteria.',     'tmpl-alignment-meeting', 'run-004'),
      m('habit_transformation',    'not_started', 120, null, null, null,                                                                                  'tmpl-alignment-meeting', null),
      m('ongoing_alignment',       'not_started', 180, null, null, null,                                                                                  'tmpl-alignment-meeting', null),
      m('renewal_growth_decision', 'not_started', 275, null, null, null,                                                                                  'tmpl-renew-grow',        null),
    ],
  },

  // ── Apex Logistics Group (acc-002, ~102d, align, at_risk) ────────────────
  {
    accountId: 'acc-002',
    year: 1,
    milestones: [
      m('purchase_moment',         'completed',   1,   1,   null, 'Deal closed. IKT handoff initiated.',                                                 'tmpl-kickoff',           null),
      m('first_meeting',           'completed',   7,   18,  11,   'Kickoff delayed 11 days. Champion availability was the primary blocker.',             'tmpl-kickoff',           'run-006'),
      m('onboarding_decisions',    'overdue',     14,  null, 88,  'Configuration never completed. Kickoff output not actioned. 88 days without progress.', 'tmpl-kickoff',         null),
      m('early_success',           'overdue',     30,  null, 36,  'First Value not achieved. Customer has not experienced measurable value.',             'tmpl-kickoff',           null),
      m('goal_attainment',         'not_started', 90,  null, null,'Cannot progress until Early Success is achieved.',                                    'tmpl-alignment-meeting', null),
      m('habit_transformation',    'not_started', 120, null, null, null,                                                                                  'tmpl-alignment-meeting', null),
      m('ongoing_alignment',       'not_started', 180, null, null, null,                                                                                  'tmpl-alignment-meeting', null),
      m('renewal_growth_decision', 'not_started', 275, null, null, null,                                                                                  'tmpl-renew-grow',        null),
    ],
  },

  // ── Vantage Financial (acc-003, ~233d, intent, advancing, renewal 41d) ───
  {
    accountId: 'acc-003',
    year: 1,
    milestones: [
      m('purchase_moment',         'completed',   1,   1,   null, 'Clean handoff. Executive sponsor introduced on Day 1.',                               'tmpl-kickoff',           null),
      m('first_meeting',           'completed',   7,   7,   null, 'Kickoff on time. Five questions completed.',                                           'tmpl-kickoff',           null),
      m('onboarding_decisions',    'completed',   14,  12,  null, 'All configuration decisions made 2 days ahead of schedule.',                           'tmpl-kickoff',           null),
      m('early_success',           'completed',   30,  65,  35,   'First Value delayed 35 days due to data migration dependency. Achieved Day 65.',       'tmpl-kickoff',           'run-007'),
      m('goal_attainment',         'completed',   90,  98,  8,    'Goal review confirmed. All 3 success criteria progressing. CFO briefed.',              'tmpl-alignment-meeting', null),
      m('habit_transformation',    'completed',   120, 128, 8,    'Adoption metrics confirmed across core team. Usage embedded in weekly workflow.',      'tmpl-alignment-meeting', null),
      m('ongoing_alignment',       'completed',   180, 190, 10,   'Alignment Meeting completed. Executive sponsor re-engaged for renewal conversation.',  'tmpl-alignment-meeting', 'run-008'),
      m('renewal_growth_decision', 'in_progress', 275, null, null,'Renew & Grow play active. Renewal intent confirmed. Expansion scope under discussion.', 'tmpl-renew-grow',       'run-009'),
    ],
  },

  // ── Thornwood Media (acc-004, ~107d, identify, at_risk, renewal 23d) ─────
  {
    accountId: 'acc-004',
    year: 1,
    milestones: [
      m('purchase_moment',         'completed',   1,   1,   null, 'Deal closed. Handoff documentation incomplete.',                                       'tmpl-kickoff',           null),
      m('first_meeting',           'completed',   7,   21,  14,   'Kickoff delayed 14 days. Executive not available at deal close.',                      'tmpl-kickoff',           null),
      m('onboarding_decisions',    'overdue',     14,  null, 93,  'No configuration completed. Account stuck in kickoff phase for 93 days.',              'tmpl-kickoff',           null),
      m('early_success',           'overdue',     30,  null, 77,  'First Value not achieved. Customer at critical churn risk. 77 days overdue.',          'tmpl-kickoff',           null),
      m('goal_attainment',         'overdue',     90,  null, 17,  'Cannot advance without Early Success. Goal framework never established.',              'tmpl-alignment-meeting', null),
      m('habit_transformation',    'not_started', 120, null, null, null,                                                                                  'tmpl-alignment-meeting', null),
      m('ongoing_alignment',       'not_started', 180, null, null, null,                                                                                  'tmpl-alignment-meeting', null),
      m('renewal_growth_decision', 'in_progress', 40,  null, 67,  'Renewal in 23 days. No commercial play active. Immediate escalation required.',       'tmpl-renew-grow',        null),
    ],
  },

  // ── ClearPath Analytics (acc-005, ~80d, align, advancing) ────────────────
  {
    accountId: 'acc-005',
    year: 1,
    milestones: [
      m('purchase_moment',         'completed',   1,   1,   null, 'Handoff complete. Success criteria documented at close.',                              'tmpl-kickoff',           null),
      m('first_meeting',           'completed',   7,   7,   null, 'Kickoff on schedule. Champion confirmed.',                                             'tmpl-kickoff',           null),
      m('onboarding_decisions',    'completed',   14,  15,  1,    'Configuration decisions finalized 1 day behind schedule.',                             'tmpl-kickoff',           null),
      m('early_success',           'completed',   30,  63,  33,   'First Value achieved April 5th — 33 days behind target. Champion confirmed the win.',  'tmpl-kickoff',           null),
      m('goal_attainment',         'in_progress', 90,  null, null,'Goal progress tracking initiated. Alignment Meeting scheduled in 19 days.',            'tmpl-alignment-meeting', 'run-010'),
      m('habit_transformation',    'not_started', 120, null, null, null,                                                                                  'tmpl-alignment-meeting', null),
      m('ongoing_alignment',       'not_started', 180, null, null, null,                                                                                  'tmpl-alignment-meeting', null),
      m('renewal_growth_decision', 'not_started', 275, null, null, null,                                                                                  'tmpl-renew-grow',        null),
    ],
  },
]
