import type {
  PipelineStageId, ProgressionStatus, InflectionPointStatus,
  StakeholderInfluence, StakeholderCoverage, ActionPriority,
  PlayRunStatus, ConfidenceSignalStatus,
} from '@/types'

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)
}

export function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
}

// ─── Stage config ─────────────────────────────────────────────────────────────

export const STAGE_ORDER: PipelineStageId[] = ['identify', 'align', 'advocate', 'intent', 'nrr_close']

export const STAGE_LABELS: Record<PipelineStageId, string> = {
  identify:  'Identify',
  align:     'Align',
  advocate:  'Advocate',
  intent:    'Intent',
  nrr_close: 'NRR Close',
}

export const STAGE_DESCRIPTIONS: Record<PipelineStageId, string> = {
  identify:  'Goals & kickoff',
  align:     'First value & alignment',
  advocate:  'Adoption & champions',
  intent:    'Renewal intent confirmed',
  nrr_close: 'Close & expand',
}

// ─── Display configs ──────────────────────────────────────────────────────────

export const PROGRESSION: Record<ProgressionStatus, { label: string; dot: string; badge: string }> = {
  advancing: { label: 'Advancing', dot: 'bg-emerald-500', badge: 'text-emerald-700 bg-emerald-50 ring-emerald-200' },
  stalled:   { label: 'Stalled',   dot: 'bg-amber-400',   badge: 'text-amber-700 bg-amber-50 ring-amber-200' },
  at_risk:   { label: 'At Risk',   dot: 'bg-red-500',     badge: 'text-red-700 bg-red-50 ring-red-200' },
}

export const IP_STATUS: Record<InflectionPointStatus, { label: string; color: string; ring: string }> = {
  achieved:    { label: 'Achieved',    color: 'text-emerald-600', ring: 'ring-emerald-200 bg-emerald-50' },
  pending:     { label: 'Pending',     color: 'text-blue-600',    ring: 'ring-blue-200 bg-blue-50' },
  overdue:     { label: 'Overdue',     color: 'text-red-600',     ring: 'ring-red-200 bg-red-50' },
  not_started: { label: 'Not Started', color: 'text-slate-400',   ring: 'ring-slate-200 bg-slate-50' },
}

export const INFLUENCE: Record<StakeholderInfluence, { label: string; color: string }> = {
  champion:       { label: 'Champion',       color: 'text-violet-700 bg-violet-50 ring-violet-200' },
  decision_maker: { label: 'Decision Maker', color: 'text-brand-700 bg-brand-50 ring-brand-200' },
  end_user:       { label: 'End User',       color: 'text-slate-600 bg-slate-50 ring-slate-200' },
  blocker:        { label: 'Blocker',        color: 'text-red-700 bg-red-50 ring-red-200' },
}

export const COVERAGE: Record<StakeholderCoverage, { label: string; color: string; dot: string }> = {
  engaged:       { label: 'Engaged',       color: 'text-emerald-700 bg-emerald-50 ring-emerald-200', dot: 'bg-emerald-400' },
  dormant:       { label: 'Dormant',       color: 'text-amber-700 bg-amber-50 ring-amber-200',       dot: 'bg-amber-400' },
  not_contacted: { label: 'Not Contacted', color: 'text-slate-500 bg-slate-50 ring-slate-200',       dot: 'bg-slate-300' },
}

export const PRIORITY: Record<ActionPriority, { label: string; bar: string; text: string }> = {
  high:   { label: 'High',   bar: 'bg-red-500',   text: 'text-red-700' },
  medium: { label: 'Medium', bar: 'bg-amber-400',  text: 'text-amber-700' },
  low:    { label: 'Low',    bar: 'bg-slate-300',  text: 'text-slate-500' },
}

export const PLAY_RUN_STATUS: Record<PlayRunStatus, { label: string; color: string }> = {
  not_started: { label: 'Not Started', color: 'text-slate-500 bg-slate-50 ring-slate-200' },
  in_progress: { label: 'In Progress', color: 'text-brand-700 bg-brand-50 ring-brand-200' },
  completed:   { label: 'Completed',   color: 'text-emerald-700 bg-emerald-50 ring-emerald-200' },
  skipped:     { label: 'Skipped',     color: 'text-slate-400 bg-slate-50 ring-slate-200' },
}

export const SIGNAL_STATUS: Record<ConfidenceSignalStatus, { icon: string; color: string }> = {
  met:     { icon: '✓', color: 'text-emerald-600' },
  partial: { icon: '◐', color: 'text-amber-500' },
  unmet:   { icon: '✗', color: 'text-red-500' },
}
