import { Link } from 'react-router-dom'
import { Activity, Zap, Calendar, TrendingUp, Users, AlertTriangle, ChevronRight, ArrowUpRight, Flame } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { deriveExecutionGaps, SEVERITY_ORDER } from '@/lib/executionGaps'
import type { ExecutionGap, GapSeverity, GapType } from '@/lib/executionGaps'
import { formatCurrency, cn } from '@/lib/utils'
import type { Opportunity, OpportunityType } from '@/types'

// ─── Severity config ──────────────────────────────────────────────────────────

const SEV: Record<GapSeverity, {
  label: string
  sub: string
  accent: string
  badge: string
  agePill: string
  dot: string
  impactChip: string
}> = {
  high: {
    label:      'High',
    sub:        'Blocking progression',
    accent:     'bg-red-500',
    badge:      'text-red-700 bg-red-50 ring-red-200',
    agePill:    'text-red-700 bg-red-50 ring-red-200',
    dot:        'bg-red-500',
    impactChip: 'text-red-700 bg-red-50 ring-red-200',
  },
  medium: {
    label:      'Medium',
    sub:        'Slowing progression',
    accent:     'bg-amber-400',
    badge:      'text-amber-700 bg-amber-50 ring-amber-200',
    agePill:    'text-amber-700 bg-amber-50 ring-amber-200',
    dot:        'bg-amber-400',
    impactChip: 'text-amber-700 bg-amber-50 ring-amber-200',
  },
  low: {
    label:      'Low',
    sub:        'Optimization',
    accent:     'bg-slate-300',
    badge:      'text-slate-600 bg-slate-50 ring-slate-200',
    agePill:    'text-slate-500 bg-slate-50 ring-slate-200',
    dot:        'bg-slate-300',
    impactChip: 'text-slate-600 bg-slate-50 ring-slate-200',
  },
}

const OPP_LABEL: Record<OpportunityType, string> = {
  renewal:   'Renewal',
  expansion: 'Expansion',
  upsell:    'Upsell',
}

// ─── Section definitions ──────────────────────────────────────────────────────

interface SectionDef {
  types: GapType[]
  label: string
  why: string
  Icon: LucideIcon
}

const SECTIONS: SectionDef[] = [
  {
    types: ['first_value_overdue'],
    label: 'First Value',
    why: 'First Value is the inflection point that converts a purchase into a partnership. Accounts that miss it rarely renew — they just go quiet.',
    Icon: Zap,
  },
  {
    types: ['alignment_meeting_overdue', 'alignment_meeting_approaching'],
    label: 'Alignment Meetings',
    why: 'Structured alignment is the cadence that keeps customer goals visible. When it slips, goal drift happens invisibly — and by the time you notice, the relationship has already weakened.',
    Icon: Calendar,
  },
  {
    types: ['goal_progress_stalled'],
    label: 'Goal Progression',
    why: 'Customers who cannot articulate progress toward their goals do not see value. Without documented evidence of advancement, renewal becomes a negotiation instead of a celebration.',
    Icon: TrendingUp,
  },
  {
    types: ['stakeholder_gap'],
    label: 'Stakeholder Coverage',
    why: 'Renewal decisions are made by executives you have not spoken to yet. Every dormant decision maker is a blocker waiting to happen.',
    Icon: Users,
  },
  {
    types: ['renewal_risk'],
    label: 'Renewal Readiness',
    why: 'Renewals do not close themselves. Without an active commercial play, the window narrows silently — and recovery becomes harder the closer you get.',
    Icon: AlertTriangle,
  },
]

// ─── Today's Priorities ───────────────────────────────────────────────────────

function TodayPriorities({
  gaps,
  opportunitiesByAccount,
}: {
  gaps: ExecutionGap[]
  opportunitiesByAccount: Record<string, Opportunity[]>
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
          const sev      = SEV[gap.severity]
          const acctOpps = opportunitiesByAccount[gap.accountId] ?? []
          const hasPlay  = !!gap.linkedPlayRunId
          const href     = hasPlay
            ? `/accounts/${gap.accountId}/plays/${gap.linkedPlayRunId}`
            : `/accounts/${gap.accountId}`

          return (
            <div key={gap.id} className="flex items-start gap-3 px-5 py-3.5 group">
              {/* Priority number */}
              <span className="w-5 h-5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </span>

              {/* Severity dot */}
              <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0 mt-[5px]', sev.dot)} />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-slate-900 leading-snug mb-1.5">
                  {gap.actionLabel}
                </p>
                {acctOpps.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {acctOpps.map(opp => (
                      <span key={opp.id} className={cn(
                        'text-[10px] font-semibold px-1.5 py-0.5 rounded ring-1',
                        sev.impactChip,
                      )}>
                        {OPP_LABEL[opp.type]} · {formatCurrency(opp.estimatedValue)}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* CTA */}
              <Link
                to={href}
                className="flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-2.5 py-1.5 rounded-lg transition-colors flex-shrink-0 mt-0.5"
              >
                {hasPlay ? 'Open Play' : 'View Account'}
                <ChevronRight size={11} />
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Gap card ─────────────────────────────────────────────────────────────────

function GapCard({ gap, accountOpps }: { gap: ExecutionGap; accountOpps: Opportunity[] }) {
  const sev     = SEV[gap.severity]
  const hasPlay = !!gap.linkedPlayRunId

  return (
    <div className="relative bg-white rounded-xl border border-slate-200 pl-5 pr-4 py-4 hover:shadow-md transition-all duration-150 group">
      {/* Severity accent bar */}
      <div className={cn('absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl', sev.accent)} />

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">

          {/* Severity badge */}
          <div className="flex items-center gap-2 mb-2">
            <span className={cn(
              'inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ring-1 flex-shrink-0',
              sev.badge,
            )}>
              {sev.label}
            </span>
            <span className="text-[10px] text-slate-400">{sev.sub}</span>
          </div>

          {/* Action label */}
          <p className="text-[13px] font-semibold text-slate-900 leading-snug mb-1.5 group-hover:text-brand-700 transition-colors">
            {gap.actionLabel}
          </p>

          {/* Context */}
          <p className="text-[11px] text-slate-400 leading-relaxed">{gap.context}</p>

          {/* Revenue at stake */}
          {accountOpps.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {accountOpps.map(opp => (
                <span key={opp.id} className={cn(
                  'text-[10px] font-semibold px-1.5 py-0.5 rounded ring-1',
                  sev.impactChip,
                )}>
                  {OPP_LABEL[opp.type]} · {formatCurrency(opp.estimatedValue)}
                </span>
              ))}
            </div>
          )}

        </div>

        {/* Right column: age + CTAs */}
        <div className="flex flex-col items-end gap-2.5 flex-shrink-0">
          {gap.ageDays > 0 && (
            <span className={cn(
              'text-[10px] font-semibold px-1.5 py-0.5 rounded ring-1 tabular-nums',
              sev.agePill,
            )}>
              {gap.ageDays}d
            </span>
          )}
          <div className="flex items-center gap-1.5">
            {hasPlay && (
              <Link
                to={`/accounts/${gap.accountId}/plays/${gap.linkedPlayRunId}`}
                className="flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                Open Play
                <ChevronRight size={11} />
              </Link>
            )}
            <Link
              to={`/accounts/${gap.accountId}`}
              className={cn(
                'flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-lg transition-colors',
                hasPlay
                  ? 'text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100'
                  : 'text-brand-600 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 font-semibold',
              )}
            >
              View Account
              <ArrowUpRight size={11} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Section ──────────────────────────────────────────────────────────────────

function Section({
  def,
  gaps,
  opportunitiesByAccount,
}: {
  def: SectionDef
  gaps: ExecutionGap[]
  opportunitiesByAccount: Record<string, Opportunity[]>
}) {
  if (gaps.length === 0) return null
  const { Icon } = def
  const sorted = [...gaps].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || b.ageDays - a.ageDays
  )

  return (
    <div className="mb-10">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Icon size={14} className="text-slate-500" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-[13px] font-semibold text-slate-900">{def.label}</h2>
            <span className="text-[10px] font-medium text-slate-400 tabular-nums">
              {sorted.length} issue{sorted.length !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-[12px] text-slate-400 leading-relaxed max-w-xl">{def.why}</p>
        </div>
      </div>

      <div className="space-y-2 ml-10">
        {sorted.map(gap => (
          <GapCard
            key={gap.id}
            gap={gap}
            accountOpps={opportunitiesByAccount[gap.accountId] ?? []}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Main view ────────────────────────────────────────────────────────────────

export function InflectionPointsView() {
  const { accounts, inflectionPoints, stakeholderMaps, contacts, playRuns, opportunities } = useApp()

  const gaps       = deriveExecutionGaps(accounts, inflectionPoints, stakeholderMaps, contacts, playRuns)
  const highGaps   = gaps.filter(g => g.severity === 'high')
  const mediumGaps = gaps.filter(g => g.severity === 'medium')
  const lowGaps    = gaps.filter(g => g.severity === 'low')
  const accountsHit = new Set(gaps.map(g => g.accountId)).size

  // Revenue at stake: sum of opportunity values for accounts with high-severity gaps
  const highAccountIds = new Set(highGaps.map(g => g.accountId))
  const valueAtRisk = opportunities
    .filter(o => highAccountIds.has(o.accountId))
    .reduce((s, o) => s + o.estimatedValue, 0)

  // Build accountId → opportunities lookup for passing to cards
  const opportunitiesByAccount = opportunities.reduce<Record<string, Opportunity[]>>((acc, o) => {
    if (!acc[o.accountId]) acc[o.accountId] = []
    acc[o.accountId].push(o)
    return acc
  }, {})

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="flex-shrink-0 px-8 h-[60px] flex items-center justify-between border-b border-slate-100 bg-white">
        <div>
          <h1 className="text-[15px] font-semibold text-slate-900">Inflection Points</h1>
          <p className="text-[12px] text-slate-400 mt-0.5">Where execution is breaking down</p>
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

      {/* Subheader */}
      <div className="flex-shrink-0 px-8 py-2.5 border-b border-slate-100 bg-white">
        <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
          <Activity size={11} />
          {gaps.length > 0
            ? `${gaps.length} action${gaps.length !== 1 ? 's' : ''} across ${accountsHit} account${accountsHit !== 1 ? 's' : ''} — sorted by severity and age`
            : 'All inflection points on track'}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
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
              <TodayPriorities gaps={gaps} opportunitiesByAccount={opportunitiesByAccount} />

              {SECTIONS.map(def => (
                <Section
                  key={def.label}
                  def={def}
                  gaps={gaps.filter(g => (def.types as string[]).includes(g.gapType))}
                  opportunitiesByAccount={opportunitiesByAccount}
                />
              ))}
            </>
          )}

        </div>
      </div>
    </div>
  )
}
