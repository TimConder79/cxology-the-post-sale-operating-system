// ─── Enums ────────────────────────────────────────────────────────────────────

export type PipelineStageId =
  | 'identify'
  | 'align'
  | 'advocate'
  | 'intent'
  | 'nrr_close'

export type ProgressionStatus = 'advancing' | 'stalled' | 'at_risk'

export type OpportunityType = 'renewal' | 'expansion' | 'upsell'
export type ConfidenceLevel = 'high' | 'medium' | 'low'
export type MovementTrend = 'improving' | 'declining' | 'flat'
export type ExecutionRiskType =
  | 'first_value_not_achieved'
  | 'missing_alignment_meeting'
  | 'no_executive_stakeholder'
  | 'renewal_window_closing'
  | 'decision_maker_dormant'

export interface ExecutionRisk {
  type: ExecutionRiskType
  severity: 'blocking' | 'warning'
  label: string
}

export interface Opportunity {
  id: string
  accountId: string
  accountName: string
  type: OpportunityType
  stage: PipelineStageId
  estimatedValue: number
  confidence: ConfidenceLevel
  daysInStage: number
  progressionStatus: ProgressionStatus
  movement: MovementTrend
  closeDate: string | null
  executionRisks: ExecutionRisk[]
}

export type PlayType =
  | 'purchase_welcome'
  | 'kickoff'
  | 'onboarding'
  | 'first_value'
  | 'alignment_meeting'
  | 'value_blocks'
  | 'goal_facilitation'
  | 'renew_grow'
  | 'key_contact_change'
  | 'offboarding'

export type PlayRunStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped'

export type InflectionPointType =
  | 'first_value'
  | 'alignment_meeting'
  | 'goal_progress'
  | 'stakeholder_coverage'
  | 'insight_delivery'

export type InflectionPointStatus = 'not_started' | 'pending' | 'achieved' | 'overdue'

export type StakeholderInfluence = 'champion' | 'decision_maker' | 'end_user' | 'blocker'

export type StakeholderCoverage = 'engaged' | 'dormant' | 'not_contacted'

export type ActionPriority = 'high' | 'medium' | 'low'
export type ActionSource   = 'ai' | 'rule' | 'seed'
export type ActionStatus   = 'active' | 'dismissed' | 'completed'

export type ConfidenceSignalStatus = 'met' | 'partial' | 'unmet'

// ─── Reference: Pipeline Stage ───────────────────────────────────────────────

export interface PipelineStage {
  id: PipelineStageId
  label: string
  order: number
  description: string
  entrySignals: string[]
  exitCriteria: string[]
  requiredPlayTypes: PlayType[]
  keyInflectionPoints: InflectionPointType[]
}

// ─── Reference: Play Template ────────────────────────────────────────────────

export interface OutputFieldDef {
  key: string
  label: string
  inputType: 'textarea' | 'boolean' | 'select' | 'number'
  required: boolean
  placeholder: string
}

export interface InteractionGuide {
  agenda: string[]
  requiredComponents: string[]
  keyQuestions: string[]
  stakeholderTalkingPoints: string[]
}

export interface PlayTemplate {
  id: string
  type: PlayType
  label: string
  description: string
  stageId: PipelineStageId
  entryCriteria: string[]
  interactionGuide: InteractionGuide
  requiredOutputFields: OutputFieldDef[]
  progressionInfluence: InflectionPointType[]
}

// ─── Core: Contact ───────────────────────────────────────────────────────────

export interface Contact {
  id: string
  accountId: string
  name: string
  title: string
  email: string | null
  notes: string | null
}

// ─── Core: Stakeholder Map ───────────────────────────────────────────────────

export interface StakeholderMap {
  id: string
  accountId: string
  contactId: string
  influence: StakeholderInfluence
  coverageStatus: StakeholderCoverage
  lastContactDate: string | null
  coverageRisk: boolean
  notes: string | null
}

// ─── Core: Inflection Point ──────────────────────────────────────────────────

export interface InflectionPoint {
  id: string
  accountId: string
  type: InflectionPointType
  label: string
  status: InflectionPointStatus
  dueDate: string | null
  achievedDate: string | null
  achievedByRunId: string | null
}

// ─── Core: Stage Confidence ──────────────────────────────────────────────────

export interface ConfidenceSignal {
  id: string
  label: string
  weight: number
  status: ConfidenceSignalStatus
  detail: string
  linkedInflectionPointId: string | null
}

export interface StageConfidence {
  id: string
  accountId: string
  stage: PipelineStageId
  score: number
  trend: 'improving' | 'declining' | 'stable'
  priorScore: number | null
  signals: ConfidenceSignal[]
  updatedAt: string
  updatedByRunId: string | null
}

// ─── Core: Play Run ──────────────────────────────────────────────────────────

export interface PlayRun {
  id: string
  accountId: string
  playTemplateId: string
  type: PlayType
  label: string
  status: PlayRunStatus
  currentStep: 1 | 2 | 3 | 4
  scheduledDate: string | null
  startedAt: string | null
  completedAt: string | null
  briefId: string | null
  outputId: string | null
}

// ─── Core: Meeting Brief ─────────────────────────────────────────────────────

export interface BriefItem {
  id: string
  text: string
  priority: ActionPriority
  linkedInflectionPointId: string | null
  linkedStakeholderMapId: string | null
}

export interface MeetingBrief {
  id: string
  playRunId: string
  accountId: string
  generatedAt: string
  generatedBy: 'ai' | 'seed'
  customerSummary: string
  goalProgress: string
  risks: BriefItem[]
  expansionSignals: BriefItem[]
  recommendedFocus: BriefItem[]
}

// ─── Core: Meeting Output ────────────────────────────────────────────────────

export interface MeetingOutput {
  id: string
  playRunId: string
  accountId: string
  capturedAt: string
  meetingSummary: string
  goalUpdates: string
  stakeholderNotes: string
  risksOpportunities: string
  customerAdvanced: boolean
  stageConfidenceDelta: number
  progressionNotes: string
}

// ─── Core: Next Best Action ──────────────────────────────────────────────────

export interface NextBestAction {
  id: string
  accountId: string
  label: string
  reason: string
  priority: ActionPriority
  source: ActionSource
  status: ActionStatus
  linkedPlayTemplateId: string | null
  linkedInflectionPointId: string | null
  linkedStakeholderMapId: string | null
  createdAt: string
  completedAt: string | null
  triggeredByOutputId: string | null
}

// ─── Core: Account ───────────────────────────────────────────────────────────

export interface Account {
  id: string
  name: string
  industry: string
  arr: number
  csm: string
  stage: PipelineStageId
  progressionStatus: ProgressionStatus
  renewalDate: string
  daysInStage: number
  createdAt: string
}

// ─── View helpers (derived / composed) ───────────────────────────────────────

export interface AccountView extends Account {
  stageConfidence: StageConfidence
  inflectionPoints: InflectionPoint[]
  playRuns: PlayRun[]
  stakeholderMaps: StakeholderMap[]
  contacts: Contact[]
  nextBestActions: NextBestAction[]
}
