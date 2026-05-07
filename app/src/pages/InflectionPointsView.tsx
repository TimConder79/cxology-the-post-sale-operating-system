import { useState, Fragment } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity, Zap, Calendar, TrendingUp, Users, AlertTriangle,
  ChevronRight, ArrowUpRight, Flame, Check, Clock, X, Minus, RotateCw,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { buildAccountWorkspacePath, getWorkspaceRecommendation } from '@/lib/accountRouting'
import { deriveExecutionGaps, SEVERITY_ORDER } from '@/lib/executionGaps'
import type { ExecutionGap, GapSeverity, GapType } from '@/lib/executionGaps'
import { formatCurrency, formatDateShort, STAGE_LABELS, daysSince, cn } from '@/lib/utils'
import type {
  AccountView, Opportunity, OpportunityType, NextBestAction, MilestoneId, MilestoneStatus,
  TimelineMilestone, AccountTimeline, JourneyCycle,
} from '@/types'

// ─── Severity config ──────────────────────────────────────────────────────────

const SEV: Record<GapSeverity, {
  label: string; sub: string; accent: string; badge: string; agePill: string; dot: string; impactChip: string
}> = {
  high:   { label: 'High',   sub: 'Blocking progression', accent: 'bg-red-500',   badge: 'text-red-700 bg-red-50 ring-red-200',     agePill: 'text-red-700 bg-red-50 ring-red-200',     dot: 'bg-red-500',   impactChip: 'text-red-700 bg-red-50 ring-red-200' },
  medium: { label: 'Medium', sub: 'Slowing progression',  accent: 'bg-amber-400', badge: 'text-amber-700 bg-amber-50 ring-amber-200', agePill: 'text-amber-700 bg-amber-50 ring-amber-200', dot: 'bg-amber-400', impactChip: 'text-amber-700 bg-amber-50 ring-amber-200' },
  low:    { label: 'Low',    sub: 'Optimization',         accent: 'bg-slate-300', badge: 'text-slate-600 bg-slate-50 ring-slate-200', agePill: 'text-slate-500 bg-slate-50 ring-slate-200', dot: 'bg-slate-300', impactChip: 'text-slate-600 bg-slate-50 ring-slate-200' },
}

const OPP_LABEL: Record<OpportunityType, string> = { renewal: 'Renewal', expansion: 'Expansion', upsell: 'Upsell' }

// Which opportunity types are directly affected by each gap type
const GAP_TO_OPP_TYPES: Record<GapType, OpportunityType[]> = {
  first_value_overdue:           ['renewal'],
  alignment_meeting_overdue:     ['expansion', 'upsell', 'renewal'],
  alignment_meeting_approaching: ['expansion', 'upsell'],
  goal_progress_stalled:         ['renewal'],
  stakeholder_gap:               ['renewal', 'expansion'],
  renewal_risk:                  ['renewal'],
}

function impactLabel(severity: GapSeverity): string {
  return severity === 'high' ? 'blocked' : 'at risk'
}

// ─── Milestone metadata ───────────────────────────────────────────────────────

interface MilestoneMeta {
  label: string
  shortLabel: string
  whyItMatters: string
  overdueAction: string
  inProgressAction: string
}

const MILESTONE_META: Record<MilestoneId, MilestoneMeta> = {
  purchase_moment: {
    label: 'Purchase Moment', shortLabel: 'Purchase',
    whyItMatters: 'The commercial relationship begins here. Expectations documented at this point define success for the entire customer journey.',
    overdueAction: 'Run Kickoff Play immediately — establish goals, stakeholders, and success criteria before another day passes.',
    inProgressAction: 'Confirm that success criteria, stakeholders, and a kickoff date are documented before proceeding.',
  },
  first_meeting: {
    label: 'First Meeting', shortLabel: 'First Mtg',
    whyItMatters: 'The first structured meeting sets the relationship tone. Customers who experience delayed first meetings have significantly higher early-stage churn rates.',
    overdueAction: 'Schedule Kickoff immediately — every additional day of delay increases abandonment risk.',
    inProgressAction: 'Confirm the kickoff date is locked and the primary champion is committed to attend.',
  },
  onboarding_decisions: {
    label: 'Onboarding Decisions', shortLabel: 'Onboarding',
    whyItMatters: 'Configuration and setup decisions made here determine adoption success. Delays cascade through every downstream milestone and compress the time to value.',
    overdueAction: 'Run Kickoff Play — re-establish configuration priorities and assign owners with hard due dates.',
    inProgressAction: 'Confirm all setup decisions have an assigned owner and a due date. No open items without owners.',
  },
  early_success: {
    label: 'Early Success', shortLabel: 'Early Win',
    whyItMatters: 'Customers must experience measurable value before Day 30. Early Success is the single strongest predictor of renewal. Accounts that miss it rarely recover quietly.',
    overdueAction: 'Run First Value Play — redefine scope if necessary to get the customer to one concrete, measurable win within 7 days.',
    inProgressAction: 'Confirm the customer can articulate a specific, measurable outcome achieved since going live.',
  },
  goal_attainment: {
    label: 'Goal Attainment', shortLabel: 'Goals',
    whyItMatters: 'Customers who cannot demonstrate progress toward stated goals at Day 90 see the product as a cost, not an investment. This directly undermines renewal confidence.',
    overdueAction: 'Run Alignment Meeting — document measurable progress with the champion and update success criteria before any renewal conversation begins.',
    inProgressAction: 'Ensure goal progress is documented and the executive sponsor has been briefed on current status.',
  },
  habit_transformation: {
    label: 'Habit Transformation', shortLabel: 'Habit',
    whyItMatters: 'By Day 120, the product should be embedded in daily workflow. Habit formation is what makes renewals automatic — not a negotiation.',
    overdueAction: 'Run Alignment Meeting — identify workflow blockers preventing daily adoption and assign remediation owners.',
    inProgressAction: 'Confirm adoption data shows consistent usage patterns across the primary team.',
  },
  ongoing_alignment: {
    label: 'Ongoing Alignment', shortLabel: 'Alignment',
    whyItMatters: 'Regular alignment ensures goal drift is caught before it becomes churn risk. Skipping this stage leaves renewals to chance and the relationship unmanaged.',
    overdueAction: 'Schedule and run Alignment Meeting immediately — do not let another week pass without structured review.',
    inProgressAction: 'Prepare an AI-generated brief before the meeting so all signals are visible going in.',
  },
  renewal_growth_decision: {
    label: 'Renewal & Growth Decision', shortLabel: 'Renewal',
    whyItMatters: 'This milestone determines whether the customer renews, expands, or churns. It requires deliberate preparation — not a last-minute conversation.',
    overdueAction: 'Initiate Renew & Grow play immediately — engage the decision maker and confirm renewal intent before the window closes.',
    inProgressAction: 'Confirm Renew & Grow play is active, decision maker is engaged, and commercial terms are visible to both sides.',
  },
}

const LEFT_MILESTONES: MilestoneId[]  = ['purchase_moment', 'first_meeting', 'onboarding_decisions', 'early_success']
const RENEWAL_MILESTONE: MilestoneId  = 'renewal_growth_decision'

// ─── Section definitions ──────────────────────────────────────────────────────

interface SectionDef { types: GapType[]; label: string; why: string; Icon: LucideIcon }

const SECTIONS: SectionDef[] = [
  { types: ['first_value_overdue'], label: 'First Value', Icon: Zap,
    why: 'First Value is the inflection point that converts a purchase into a partnership. Accounts that miss it rarely renew — they just go quiet.' },
  { types: ['alignment_meeting_overdue', 'alignment_meeting_approaching'], label: 'Alignment Meetings', Icon: Calendar,
    why: 'Structured alignment is the cadence that keeps customer goals visible. When it slips, goal drift happens invisibly — and by the time you notice, the relationship has already weakened.' },
  { types: ['goal_progress_stalled'], label: 'Goal Progression', Icon: TrendingUp,
    why: 'Customers who cannot articulate progress toward their goals do not see value. Without documented evidence of advancement, renewal becomes a negotiation instead of a celebration.' },
  { types: ['stakeholder_gap'], label: 'Stakeholder Coverage', Icon: Users,
    why: 'Renewal decisions are made by executives you have not spoken to yet. Every dormant decision maker is a blocker waiting to happen.' },
  { types: ['renewal_risk'], label: 'Renewal Readiness', Icon: AlertTriangle,
    why: 'Renewals do not close themselves. Without an active commercial play, the window narrows silently — and recovery becomes harder the closer you get.' },
]

// ═══════════════════════════════════════════════════════════════
// PRIORITY VIEW COMPONENTS
// ═══════════════════════════════════════════════════════════════

function TodayPriorities({ gaps, opportunitiesByAccount, workspaceHrefByAccountId }: {
  gaps: ExecutionGap[]; opportunitiesByAccount: Record<string, Opportunity[]>; workspaceHrefByAccountId: Record<string, string>
}) {
  const high = gaps.filter(g => g.severity === 'high')
  const med  = gaps.filter(g => g.severity === 'medium')
  const priorities = [...high, ...med.slice(0, Math.max(0, 5 - high.length))].slice(0, 5)
  if (priorities.length === 0) return null

  return (
    <div className="mb-8 bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2.5">
        <Flame size={13} className="text-red-500" />
        <span className="text-[13px] font-semibold text-slate-900">Today's Priorities</span>
        {high.length > 0 && (
          <span className="text-[10px] font-bold text-red-700 bg-red-50 ring-1 ring-red-200 px-1.5 py-0.5 rounded tabular-nums">
            {high.length} blocking
          </span>
        )}
      </div>
      <div className="divide-y divide-slate-50">
        {priorities.map((gap, i) => {
          const sev           = SEV[gap.severity]
          const relevantTypes = GAP_TO_OPP_TYPES[gap.gapType]
          const acctOpps      = (opportunitiesByAccount[gap.accountId] ?? []).filter(o => relevantTypes.includes(o.type))
          const href          = workspaceHrefByAccountId[gap.accountId] ?? `/accounts/${gap.accountId}`
          return (
            <div key={gap.id} className="flex items-start gap-3 px-5 py-3.5">
              <span className="w-5 h-5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-400 flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
              <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0 mt-[5px]', sev.dot)} />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-slate-900 leading-snug mb-1.5">{gap.actionLabel}</p>
                {acctOpps.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {acctOpps.map(opp => (
                      <span key={opp.id} className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded ring-1', sev.impactChip)}>
                        {formatCurrency(opp.estimatedValue)} {OPP_LABEL[opp.type].toLowerCase()} {impactLabel(gap.severity)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <Link to={href} className="flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-2.5 py-1.5 rounded-lg transition-colors flex-shrink-0 mt-0.5">
                Open Workspace
                <ChevronRight size={11} />
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function GapCard({ gap, accountOpps, workspaceHref, hasActivityWithoutProgress }: {
  gap: ExecutionGap; accountOpps: Opportunity[]; workspaceHref: string; hasActivityWithoutProgress?: boolean
}) {
  const sev = SEV[gap.severity]
  return (
    <div className="relative bg-white rounded-xl border border-slate-200 pl-5 pr-4 py-4 hover:shadow-md transition-all duration-150 group">
      <div className={cn('absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl', sev.accent)} />
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={cn('inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ring-1 flex-shrink-0', sev.badge)}>{sev.label}</span>
            <span className="text-[10px] text-slate-400">{sev.sub}</span>
          </div>
          <p className="text-[13px] font-semibold text-slate-900 leading-snug mb-1.5 group-hover:text-brand-700 transition-colors">{gap.actionLabel}</p>
          <p className="text-[11px] text-slate-400 leading-relaxed">{gap.context}</p>
          {hasActivityWithoutProgress && (
            <p className="text-[10px] font-semibold text-amber-600 mt-1.5">Active · not advancing</p>
          )}
          {accountOpps.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {accountOpps.map(opp => (
                <span key={opp.id} className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded ring-1', sev.impactChip)}>
                  {formatCurrency(opp.estimatedValue)} {OPP_LABEL[opp.type].toLowerCase()} {impactLabel(gap.severity)}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2.5 flex-shrink-0">
          {gap.ageDays > 0 && (
            <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded ring-1 tabular-nums', sev.agePill)}>{gap.ageDays}d</span>
          )}
          <Link to={workspaceHref} className="flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-2.5 py-1.5 rounded-lg transition-colors">
            Open Workspace<ArrowUpRight size={11} />
          </Link>
        </div>
      </div>
    </div>
  )
}

function GapSection({ def, gaps, opportunitiesByAccount, workspaceHrefByAccountId, activityWithoutProgressIds }: {
  def: SectionDef; gaps: ExecutionGap[]; opportunitiesByAccount: Record<string, Opportunity[]>
  workspaceHrefByAccountId: Record<string, string>; activityWithoutProgressIds: Set<string>
}) {
  if (gaps.length === 0) return null
  const { Icon } = def
  const sorted = [...gaps].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || b.ageDays - a.ageDays)
  return (
    <div className="mb-10">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Icon size={14} className="text-slate-500" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-[13px] font-semibold text-slate-900">{def.label}</h2>
            <span className="text-[10px] font-medium text-slate-400 tabular-nums">{sorted.length} issue{sorted.length !== 1 ? 's' : ''}</span>
          </div>
          <p className="text-[12px] text-slate-400 leading-relaxed max-w-xl">{def.why}</p>
        </div>
      </div>
      <div className="space-y-2 ml-10">
        {sorted.map(gap => (
          <GapCard
            key={gap.id}
            gap={gap}
            accountOpps={(opportunitiesByAccount[gap.accountId] ?? []).filter(o => GAP_TO_OPP_TYPES[gap.gapType].includes(o.type))}
            workspaceHref={workspaceHrefByAccountId[gap.accountId] ?? `/accounts/${gap.accountId}`}
            hasActivityWithoutProgress={activityWithoutProgressIds.has(gap.accountId)}
          />
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// TIMELINE VIEW COMPONENTS
// ═══════════════════════════════════════════════════════════════

const STATUS_NODE: Record<MilestoneStatus, {
  bg: string; ring: string; icon: LucideIcon; iconColor: string
}> = {
  completed:   { bg: 'bg-emerald-500', ring: 'ring-emerald-200', icon: Check,  iconColor: 'text-white' },
  in_progress: { bg: 'bg-brand-500',   ring: 'ring-brand-200',   icon: Clock,  iconColor: 'text-white' },
  overdue:     { bg: 'bg-red-500',     ring: 'ring-red-200',     icon: X,      iconColor: 'text-white' },
  not_started: { bg: 'bg-slate-200',   ring: 'ring-slate-200',   icon: Minus,  iconColor: 'text-slate-400' },
}

function lineColor(m: TimelineMilestone): string {
  if (m.status === 'completed')   return 'bg-emerald-200'
  if (m.status === 'overdue')     return 'bg-red-200'
  if (m.status === 'in_progress') return 'bg-brand-200'
  return 'bg-slate-150'
}

function MilestoneNode({
  milestone, isSelected, onClick,
}: {
  milestone: TimelineMilestone; isSelected: boolean; onClick: () => void
}) {
  const cfg = STATUS_NODE[milestone.status]
  const Icon = cfg.icon
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-150',
        cfg.bg,
        isSelected ? 'ring-2 ring-offset-2 ' + cfg.ring : 'hover:ring-2 hover:ring-offset-1 ' + cfg.ring,
        milestone.status === 'in_progress' && 'ring-2 ' + cfg.ring,
      )}
    >
      <Icon size={12} className={cfg.iconColor} />
    </button>
  )
}

function MilestoneDetail({
  milestone, workspaceHref, onClose,
}: {
  milestone: TimelineMilestone; accountName: string; workspaceHref: string; onClose: () => void
}) {
  const meta    = MILESTONE_META[milestone.id]
  const needsAction = milestone.status === 'overdue' || milestone.status === 'in_progress'

  const statusLabel: Record<MilestoneStatus, string> = {
    completed: 'Completed', in_progress: 'In Progress', overdue: 'Overdue', not_started: 'Not Started',
  }
  const statusStyle: Record<MilestoneStatus, string> = {
    completed:   'text-emerald-700 bg-emerald-50 ring-emerald-200',
    in_progress: 'text-brand-700 bg-brand-50 ring-brand-200',
    overdue:     'text-red-700 bg-red-50 ring-red-200',
    not_started: 'text-slate-600 bg-slate-50 ring-slate-200',
  }

  return (
    <div className="mt-1 mb-2 ml-[212px] bg-slate-50 rounded-xl border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[13px] font-semibold text-slate-900">{meta.label}</span>
            <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded ring-1', statusStyle[milestone.status])}>
              {statusLabel[milestone.status]}
            </span>
          </div>

          {/* Timing */}
          <div className="flex items-center gap-4 text-[11px] text-slate-400 mb-3">
            <span>Expected: <span className="font-medium text-slate-600">Day {milestone.expectedDay}</span></span>
            {milestone.actualDay && <span>Completed: <span className="font-medium text-slate-600">Day {milestone.actualDay}</span></span>}
            {milestone.status === 'overdue' && milestone.delayDays && (
              <span className="font-semibold text-red-600">{milestone.delayDays}d overdue</span>
            )}
            {milestone.actualDay && milestone.actualDay > milestone.expectedDay && (
              <span className="text-amber-600">{milestone.actualDay - milestone.expectedDay}d behind target</span>
            )}
          </div>

          {/* Why it matters */}
          <p className="text-[12px] text-slate-500 leading-relaxed mb-3">{meta.whyItMatters}</p>

          {/* Recommended action */}
          {needsAction && (
            <div className="bg-white rounded-lg border border-slate-200 px-3 py-2.5 mb-2.5">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Recommended action</p>
              <p className="text-[12px] font-semibold text-slate-800 leading-snug">
                {milestone.status === 'overdue' ? meta.overdueAction : meta.inProgressAction}
              </p>
            </div>
          )}

          {/* Notes */}
          {milestone.notes && (
            <p className="text-[11px] text-slate-400 italic leading-relaxed">{milestone.notes}</p>
          )}
        </div>

        {/* CTAs */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <button onClick={onClose} className="text-[11px] text-slate-300 hover:text-slate-500 transition-colors px-1">✕</button>
          <Link to={workspaceHref}
            className="flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-2.5 py-1.5 rounded-lg transition-colors">
            Open Workspace<ChevronRight size={11} />
          </Link>
          <Link to={workspaceHref}
            className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg transition-colors">
            View Account<ArrowUpRight size={11} />
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Portfolio Loop Cell ──────────────────────────────────────────────────────

function PortfolioLoopCell({
  cycles, isExpanded, onClick,
}: {
  cycles: JourneyCycle[]; isExpanded: boolean; onClick: () => void
}) {
  const completed  = cycles.filter(c => c.status === 'completed').length
  const inProgress = cycles.find(c => c.status === 'in_progress')
  const total      = cycles.length

  const allDone    = total > 0 && completed === total
  const someActive = !!inProgress

  const border = allDone ? 'border-emerald-200' : someActive ? 'border-brand-200' : 'border-slate-200'
  const bg     = allDone ? 'bg-emerald-50'      : someActive ? 'bg-brand-50'      : 'bg-slate-50'
  const text   = allDone ? 'text-emerald-700'   : someActive ? 'text-brand-700'   : 'text-slate-400'
  const icon   = allDone ? 'text-emerald-500'   : someActive ? 'text-brand-500'   : 'text-slate-300'

  const currentCycle = inProgress ?? (cycles.length > 0 ? cycles[cycles.length - 1] : null)

  return (
    <button
      onClick={onClick}
      disabled={total === 0}
      className={cn(
        'flex items-center gap-2 px-3 h-7 rounded-lg border-2 w-[120px] flex-shrink-0 transition-all',
        border, bg,
        total > 0
          ? isExpanded ? 'ring-2 ring-offset-1 ring-brand-300' : 'hover:shadow-sm'
          : 'opacity-40 cursor-default',
      )}
    >
      <RotateCw size={10} className={icon} />
      <span className={cn('text-[11px] font-bold tabular-nums', text)}>
        {total > 0 ? `${completed}/${total}` : '—'}
      </span>
      {currentCycle && (
        <div className="flex gap-[2px] ml-auto">
          {currentCycle.phases.map((p, i) => (
            <div key={i} className={cn(
              'w-2.5 h-1 rounded-full',
              p.status === 'completed'
                ? allDone ? 'bg-emerald-400' : 'bg-brand-400'
                : p.status === 'in_progress' ? 'bg-brand-300'
                : 'bg-slate-200'
            )} />
          ))}
        </div>
      )}
    </button>
  )
}

// ─── Portfolio Loop Inspector ─────────────────────────────────────────────────

function PortfolioLoopInspector({
  cycles, workspaceHref, onClose,
}: {
  cycles: JourneyCycle[]; workspaceHref: string; onClose: () => void
}) {
  const defaultId = cycles.find(c => c.status === 'in_progress')?.id
    ?? cycles[cycles.length - 1]?.id
    ?? null
  const [inspectId, setInspectId] = useState<string | null>(defaultId)
  const inspected = cycles.find(c => c.id === inspectId) ?? null
  const completedCount = cycles.filter(c => c.status === 'completed').length

  return (
    <div className="mt-1 mb-2 ml-[212px] bg-slate-50 rounded-xl border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <RotateCw size={11} className="text-slate-400" />
            <span className="text-[12px] font-semibold text-slate-700">
              {completedCount} of {cycles.length} cycle{cycles.length !== 1 ? 's' : ''} complete
            </span>
          </div>

          {/* Cycle badges */}
          <div className="flex gap-1.5 mb-3">
            {cycles.map(cycle => (
              <button
                key={cycle.id}
                onClick={() => setInspectId(inspectId === cycle.id ? null : cycle.id)}
                className={cn(
                  'w-7 h-7 rounded-full border-2 flex items-center justify-center text-[11px] font-bold transition-all',
                  cycle.status === 'completed'
                    ? inspectId === cycle.id
                      ? 'border-emerald-600 bg-emerald-500 text-white shadow-sm'
                      : 'border-emerald-400 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : cycle.status === 'in_progress'
                    ? inspectId === cycle.id
                      ? 'border-brand-600 bg-brand-500 text-white shadow-sm'
                      : 'border-brand-400 bg-brand-50 text-brand-700 hover:bg-brand-100'
                    : 'border-slate-200 bg-white text-slate-400 cursor-default'
                )}
              >
                {cycle.cycleNumber}
              </button>
            ))}
          </div>

          {/* Selected cycle phases */}
          {inspected && (
            <div className="bg-white rounded-lg border border-slate-100 divide-y divide-slate-50">
              {inspected.phases.map(phase => (
                <div key={phase.type} className="flex items-center gap-3 px-3 py-2">
                  <div className={cn(
                    'w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                    phase.status === 'completed'   ? 'border-emerald-500 bg-emerald-500' :
                    phase.status === 'in_progress' ? 'border-brand-400 bg-brand-50'     :
                                                     'border-slate-200 bg-white'
                  )}>
                    {phase.status === 'completed'   && <Check size={8} className="text-white" />}
                    {phase.status === 'in_progress' && <Clock size={8} className="text-brand-500" />}
                  </div>
                  <span className={cn(
                    'text-[12px] font-medium flex-1',
                    phase.status === 'completed'   ? 'text-slate-700' :
                    phase.status === 'in_progress' ? 'text-brand-700' :
                                                     'text-slate-400'
                  )}>
                    {phase.label}
                  </span>
                  {phase.completedDate && (
                    <span className="text-[10px] text-slate-400">{formatDateShort(phase.completedDate)}</span>
                  )}
                  {phase.status === 'in_progress' && (
                    <span className="text-[10px] text-brand-500">In progress</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <button onClick={onClose} className="text-[11px] text-slate-300 hover:text-slate-500 transition-colors px-1">✕</button>
          <Link to={workspaceHref}
            className="flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-2.5 py-1.5 rounded-lg transition-colors">
            Open Workspace<ChevronRight size={11} />
          </Link>
          <Link to={workspaceHref}
            className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg transition-colors">
            View Account<ArrowUpRight size={11} />
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Timeline content ─────────────────────────────────────────────────────────

function TimelineContent({ accountTimelines, workspaceHrefByAccountId }: { accountTimelines: AccountTimeline[]; workspaceHrefByAccountId: Record<string, string> }) {
  const { accounts, journeyCycles } = useApp()
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  const toggle = (accountId: string, milestoneId: MilestoneId) => {
    const key = `${accountId}/${milestoneId}`
    setSelectedKey(prev => prev === key ? null : key)
  }

  const toggleLoop = (accountId: string) => {
    const key = `${accountId}/loop`
    setSelectedKey(prev => prev === key ? null : key)
  }

  return (
    <div className="px-8 py-6 overflow-x-auto">
      {/* Column headers */}
      <div className="flex items-end mb-1 ml-[212px]">
        {LEFT_MILESTONES.map((id, i) => (
          <Fragment key={id}>
            {i > 0 && <div className="w-9 flex-shrink-0" />}
            <div className="w-7 flex-shrink-0 flex flex-col items-center gap-0.5">
              <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wide leading-none text-center whitespace-nowrap"
                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: 56 }}>
                {MILESTONE_META[id].shortLabel}
              </span>
            </div>
          </Fragment>
        ))}

        <div className="w-9 flex-shrink-0" />

        <div className="w-[120px] flex-shrink-0 flex flex-col items-center justify-end gap-1 pb-1" style={{ height: 56 }}>
          <RotateCw size={11} className="text-slate-400" />
          <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wide">Cycles</span>
        </div>

        <div className="w-9 flex-shrink-0" />

        <div className="w-7 flex-shrink-0 flex flex-col items-center gap-0.5">
          <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wide leading-none text-center whitespace-nowrap"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: 56 }}>
            {MILESTONE_META[RENEWAL_MILESTONE].shortLabel}
          </span>
        </div>
      </div>

      {/* Separator */}
      <div className="ml-[200px] h-px bg-slate-100 mb-2" />

      {/* Account rows */}
      {accounts.map(account => {
        const timeline = accountTimelines.find(t => t.accountId === account.id)
        if (!timeline) return null

        const leftMilestones = LEFT_MILESTONES
          .map(id => timeline.milestones.find(m => m.id === id)!)
          .filter(Boolean)

        const renewalMilestone = timeline.milestones.find(m => m.id === RENEWAL_MILESTONE) ?? null

        const accountCycles = journeyCycles
          .filter(c => c.accountId === account.id)
          .sort((a, b) => a.year - b.year || a.cycleNumber - b.cycleNumber)

        const overdueCount = [
          ...leftMilestones,
          ...(renewalMilestone ? [renewalMilestone] : []),
        ].filter(m => m.status === 'overdue').length

        const isLoopSelected      = selectedKey === `${account.id}/loop`
        const selectedMilestoneId = selectedKey?.startsWith(account.id + '/') && !isLoopSelected
          ? selectedKey.split('/')[1] as MilestoneId
          : null

        const lastLeft = leftMilestones[leftMilestones.length - 1]

        return (
          <div key={account.id} className="mb-0.5">
            <div className={cn(
              'flex items-center py-3 rounded-lg transition-colors',
              (selectedMilestoneId || isLoopSelected) ? 'bg-slate-50' : 'hover:bg-slate-50/60'
            )}>
              {/* Account info */}
              <div className="w-[200px] flex-shrink-0 pr-3">
                <p className="text-[13px] font-semibold text-slate-900 truncate leading-none mb-1">{account.name}</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400">{STAGE_LABELS[account.stage]}</span>
                  {overdueCount > 0 && (
                    <span className="text-[9px] font-bold text-red-600 bg-red-50 ring-1 ring-red-200 px-1 py-0.5 rounded tabular-nums">
                      {overdueCount} overdue
                    </span>
                  )}
                  {accountCycles.length > 0 && (
                    <span className={cn(
                      'text-[9px] font-bold px-1 py-0.5 rounded tabular-nums ring-1',
                      accountCycles.some(c => c.status === 'in_progress')
                        ? 'text-brand-700 bg-brand-50 ring-brand-200'
                        : 'text-emerald-700 bg-emerald-50 ring-emerald-200'
                    )}>
                      {accountCycles.filter(c => c.status === 'completed').length}/{accountCycles.length}c
                    </span>
                  )}
                </div>
              </div>

              {/* Separator */}
              <div className="w-px h-8 bg-slate-100 mr-3 flex-shrink-0" />

              {/* Timeline */}
              <div className="flex items-center">
                {leftMilestones.map((milestone, i) => (
                  <Fragment key={milestone.id}>
                    {i > 0 && (
                      <div className={cn('w-9 h-0.5 flex-shrink-0', lineColor(leftMilestones[i - 1]))} />
                    )}
                    <MilestoneNode
                      milestone={milestone}
                      isSelected={selectedKey === `${account.id}/${milestone.id}`}
                      onClick={() => toggle(account.id, milestone.id)}
                    />
                  </Fragment>
                ))}

                <div className={cn('w-9 h-0.5 flex-shrink-0', lastLeft?.status === 'completed' ? 'bg-emerald-200' : 'bg-slate-150')} />

                <PortfolioLoopCell
                  cycles={accountCycles}
                  isExpanded={isLoopSelected}
                  onClick={() => toggleLoop(account.id)}
                />

                <div className={cn(
                  'w-9 h-0.5 flex-shrink-0',
                  accountCycles.some(c => c.status === 'completed') ? 'bg-emerald-200' : 'bg-slate-150'
                )} />

                {renewalMilestone && (
                  <MilestoneNode
                    milestone={renewalMilestone}
                    isSelected={selectedKey === `${account.id}/${renewalMilestone.id}`}
                    onClick={() => toggle(account.id, renewalMilestone.id)}
                  />
                )}
              </div>
            </div>

            {isLoopSelected && accountCycles.length > 0 && (
              <PortfolioLoopInspector
                cycles={accountCycles}
                workspaceHref={workspaceHrefByAccountId[account.id] ?? `/accounts/${account.id}`}
                onClose={() => setSelectedKey(null)}
              />
            )}

            {selectedMilestoneId && (() => {
              const allMs = [...leftMilestones, ...(renewalMilestone ? [renewalMilestone] : [])]
              const ms = allMs.find(m => m.id === selectedMilestoneId)
              return ms ? (
                <MilestoneDetail
                  milestone={ms}
                  accountName={account.name}
                  workspaceHref={workspaceHrefByAccountId[account.id] ?? `/accounts/${account.id}`}
                  onClose={() => setSelectedKey(null)}
                />
              ) : null
            })()}
          </div>
        )
      })}

      {/* Legend */}
      <div className="flex items-center gap-5 mt-6 ml-[212px]">
        {(['completed', 'in_progress', 'overdue', 'not_started'] as MilestoneStatus[]).map(s => {
          const cfg = STATUS_NODE[s]
          const Icon = cfg.icon
          const labels: Record<MilestoneStatus, string> = {
            completed: 'Completed', in_progress: 'In Progress', overdue: 'Overdue', not_started: 'Not Started'
          }
          return (
            <div key={s} className="flex items-center gap-1.5">
              <div className={cn('w-4 h-4 rounded-full flex items-center justify-center', cfg.bg)}>
                <Icon size={9} className={cfg.iconColor} />
              </div>
              <span className="text-[10px] text-slate-400">{labels[s]}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── NBA item ─────────────────────────────────────────────────────────────────

function NBAItem({ nba, accountName, workspaceHref }: { nba: NextBestAction; accountName: string; workspaceHref: string }) {
  const dotColor =
    nba.priority === 'high'   ? 'bg-red-500'   :
    nba.priority === 'medium' ? 'bg-amber-400' :
                                'bg-slate-300'
  return (
    <Link
      to={workspaceHref}
      className="flex items-start gap-2.5 px-4 py-3 hover:bg-slate-50 transition-colors group border-b border-slate-50"
    >
      <div className={cn('w-1.5 h-1.5 rounded-full mt-[5px] flex-shrink-0', dotColor)} />
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium text-slate-800 leading-snug group-hover:text-brand-700 transition-colors line-clamp-2">
          {nba.label}
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5 truncate">{accountName}</p>
      </div>
      <ChevronRight size={11} className="text-slate-300 group-hover:text-brand-400 mt-1 flex-shrink-0 transition-colors" />
    </Link>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN VIEW
// ═══════════════════════════════════════════════════════════════

export function InflectionPointsView() {
  const [activeTab, setActiveTab] = useState<'priority' | 'timeline'>('priority')
  const {
    accounts, inflectionPoints, stakeholderMaps, contacts, playRuns,
    opportunities, accountTimelines, nextBestActions, getAccountView,
  } = useApp()

  const activeNBAs = nextBestActions
    .filter(n => n.status === 'active')
    .sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] ?? 2) - ({ high: 0, medium: 1, low: 2 }[b.priority] ?? 2))
    .slice(0, 10)

  const gaps         = deriveExecutionGaps(accounts, inflectionPoints, stakeholderMaps, contacts, playRuns)
  const highGaps     = gaps.filter(g => g.severity === 'high')
  const mediumGaps   = gaps.filter(g => g.severity === 'medium')
  const lowGaps      = gaps.filter(g => g.severity === 'low')
  const accountsHit  = new Set(gaps.map(g => g.accountId)).size

  const highAccountIds = new Set(highGaps.map(g => g.accountId))
  const valueAtRisk    = opportunities
    .filter(o => highAccountIds.has(o.accountId))
    .reduce((s, o) => s + o.estimatedValue, 0)

  const opportunitiesByAccount = opportunities.reduce<Record<string, Opportunity[]>>((acc, o) => {
    if (!acc[o.accountId]) acc[o.accountId] = []
    acc[o.accountId].push(o)
    return acc
  }, {})

  const accountViewsById = accounts.reduce<Record<string, AccountView>>((acc, account) => {
    const view = getAccountView(account.id)
    if (view) acc[account.id] = view
    return acc
  }, {})

  const workspaceHrefByAccountId = accounts.reduce<Record<string, string>>((acc, account) => {
    const view = accountViewsById[account.id]
    acc[account.id] = view
      ? buildAccountWorkspacePath(account.id, getWorkspaceRecommendation(view, 'inflection-points'))
      : `/accounts/${account.id}`
    return acc
  }, {})

  const overdueTotal = accountTimelines.reduce(
    (s, t) => s + t.milestones.filter(m => m.status === 'overdue').length, 0
  )

  // Accounts where play activity is happening but progression hasn't moved
  const activityWithoutProgressIds = new Set(
    accounts
      .filter(a => a.progressionStatus === 'stalled' || a.progressionStatus === 'at_risk')
      .filter(a => {
        const acctRuns = playRuns.filter(r => r.accountId === a.id)
        const hasActiveRun = acctRuns.some(r => r.status === 'in_progress')
        const hasRecentCompleted = acctRuns.some(r =>
          r.status === 'completed' && r.completedAt !== null && daysSince(r.completedAt) <= 30
        )
        return hasActiveRun || hasRecentCompleted
      })
      .map(a => a.id)
  )

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="flex-shrink-0 px-8 h-[60px] flex items-center justify-between border-b border-slate-100 bg-white">
        <div>
          <h1 className="text-[15px] font-semibold text-slate-900">Inflection Points</h1>
          <p className="text-[12px] text-slate-400 mt-0.5">
            {activeTab === 'priority' ? 'Where execution is breaking down' : 'Customer progression through the designed journey'}
          </p>
        </div>

        <div className="flex items-center gap-5">
          {highGaps.length > 0 && (
            <div className="text-right">
              <div className="text-[10px] font-medium text-red-400 uppercase tracking-wide">Blocking</div>
              <div className="text-[16px] font-bold text-red-600 leading-none mt-0.5">{highGaps.length}</div>
            </div>
          )}
          {mediumGaps.length > 0 && (
            <div className="text-right">
              <div className="text-[10px] font-medium text-amber-500 uppercase tracking-wide">Slowing</div>
              <div className="text-[16px] font-bold text-amber-600 leading-none mt-0.5">{mediumGaps.length}</div>
            </div>
          )}
          {lowGaps.length > 0 && (
            <div className="text-right">
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Optimize</div>
              <div className="text-[16px] font-bold text-slate-600 leading-none mt-0.5">{lowGaps.length}</div>
            </div>
          )}
          {valueAtRisk > 0 && (
            <div className="text-right border-l border-slate-100 pl-5">
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">ARR at Risk</div>
              <div className="text-[16px] font-bold text-slate-700 leading-none mt-0.5">{formatCurrency(valueAtRisk)}</div>
            </div>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex-shrink-0 border-b border-slate-100 bg-white flex items-center">
        <button
          onClick={() => setActiveTab('priority')}
          className={cn(
            'px-5 h-[42px] text-[12px] font-medium border-b-2 transition-colors',
            activeTab === 'priority'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-400 hover:text-slate-700',
          )}
        >
          Priority
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={cn(
            'px-5 h-[42px] text-[12px] font-medium border-b-2 transition-colors',
            activeTab === 'timeline'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-400 hover:text-slate-700',
          )}
        >
          Timeline
        </button>
        <div className="flex-1" />
        <div className="px-5 flex items-center gap-1.5 text-[11px] text-slate-400">
          <Activity size={11} />
          {activeTab === 'priority'
            ? (gaps.length > 0
                ? `${gaps.length} action${gaps.length !== 1 ? 's' : ''} across ${accountsHit} account${accountsHit !== 1 ? 's' : ''}`
                : 'All inflection points on track')
            : `${accounts.length} accounts · ${overdueTotal} milestone${overdueTotal !== 1 ? 's' : ''} overdue`
          }
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {activeTab === 'priority' ? (
            <div className="max-w-3xl mx-auto px-8 py-7">
              {gaps.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 ring-1 ring-emerald-200 flex items-center justify-center mb-4">
                    <Activity size={20} className="text-emerald-500" />
                  </div>
                  <p className="text-[14px] font-semibold text-slate-700 mb-1">Execution on track</p>
                  <p className="text-[12px] text-slate-400">No gaps detected. All inflection points are progressing.</p>
                </div>
              ) : (
                <>
                  <TodayPriorities gaps={gaps} opportunitiesByAccount={opportunitiesByAccount} workspaceHrefByAccountId={workspaceHrefByAccountId} />
                  {SECTIONS.map(def => (
                    <GapSection
                      key={def.label}
                      def={def}
                      gaps={gaps.filter(g => (def.types as string[]).includes(g.gapType))}
                      opportunitiesByAccount={opportunitiesByAccount}
                      workspaceHrefByAccountId={workspaceHrefByAccountId}
                      activityWithoutProgressIds={activityWithoutProgressIds}
                    />
                  ))}
                </>
              )}
            </div>
          ) : (
            <TimelineContent accountTimelines={accountTimelines} workspaceHrefByAccountId={workspaceHrefByAccountId} />
          )}
        </div>

        {/* Next Best Actions sidebar */}
        <div className="w-[260px] flex-shrink-0 border-l border-slate-100 bg-white flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[12px] font-semibold text-slate-900">Next Best Actions</span>
            {activeNBAs.length > 0 && (
              <span className="text-[10px] font-semibold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded tabular-nums">
                {activeNBAs.length}
              </span>
            )}
          </div>
          <div className="flex-1 overflow-auto">
            {activeNBAs.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-[12px] text-slate-400">No active actions</p>
              </div>
            ) : (
              activeNBAs.map(nba => {
                const acct = accounts.find(a => a.id === nba.accountId)
                const workspaceHref = workspaceHrefByAccountId[nba.accountId] ?? `/accounts/${nba.accountId}`
                return (
                  <NBAItem
                    key={nba.id}
                    nba={nba}
                    accountName={acct?.name ?? nba.accountId}
                    workspaceHref={workspaceHref}
                  />
                )
              })
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
