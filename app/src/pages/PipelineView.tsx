import { useNavigate, Link } from 'react-router-dom'
import { TrendingUp, TrendingDown, Minus, ArrowRight, ChevronRight, AlertCircle } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import {
  STAGE_ORDER, STAGE_LABELS, formatCurrency, daysUntil, cn,
} from '@/lib/utils'
import type { PipelineStageId, Opportunity, NextBestAction, ProgressionStatus, MovementTrend, OpportunityType, ConfidenceLevel } from '@/types'

// ─── Config ───────────────────────────────────────────────────────────────────

const OPP_TYPE: Record<OpportunityType, { label: string; style: string }> = {
  renewal:   { label: 'Renewal',   style: 'text-brand-700 bg-brand-50 ring-brand-200' },
  expansion: { label: 'Expansion', style: 'text-emerald-700 bg-emerald-50 ring-emerald-200' },
  upsell:    { label: 'Upsell',    style: 'text-violet-700 bg-violet-50 ring-violet-200' },
}

const CONFIDENCE: Record<ConfidenceLevel, { label: string; style: string }> = {
  high:   { label: 'High',   style: 'text-emerald-700 bg-emerald-50 ring-emerald-200' },
  medium: { label: 'Medium', style: 'text-amber-700 bg-amber-50 ring-amber-200' },
  low:    { label: 'Low',    style: 'text-red-700 bg-red-50 ring-red-200' },
}

const STATUS_STYLE: Record<ProgressionStatus, string> = {
  advancing: 'text-emerald-600',
  stalled:   'text-amber-600',
  at_risk:   'text-red-600',
}

const STATUS_LABEL: Record<ProgressionStatus, string> = {
  advancing: 'Advancing',
  stalled:   'Stalled',
  at_risk:   'At Risk',
}

function MovementIcon({ movement, status }: { movement: MovementTrend; status: ProgressionStatus }) {
  const color =
    status === 'advancing' ? 'text-emerald-500' :
    status === 'at_risk'   ? 'text-red-500'     :
                             'text-amber-400'
  if (movement === 'improving') return <TrendingUp  size={11} className={color} />
  if (movement === 'declining') return <TrendingDown size={11} className={color} />
  return <Minus size={11} className="text-slate-300" />
}

// ─── Opportunity card ─────────────────────────────────────────────────────────

function OppCard({ opp }: { opp: Opportunity }) {
  const navigate  = useNavigate()
  const typeConf  = OPP_TYPE[opp.type]
  const confConf  = CONFIDENCE[opp.confidence]
  const isAtRisk  = opp.progressionStatus === 'at_risk'
  const blocking  = opp.executionRisks.filter(r => r.severity === 'blocking')
  const warnings  = opp.executionRisks.filter(r => r.severity === 'warning')
  const closeDays = opp.closeDate ? daysUntil(opp.closeDate) : null
  const closeUrgent = closeDays !== null && closeDays < 60

  return (
    <button
      onClick={() => navigate(`/accounts/${opp.accountId}`)}
      className={cn(
        'w-full text-left bg-white rounded-xl border transition-all group',
        'hover:shadow-md hover:-translate-y-0.5 duration-150',
        isAtRisk && blocking.length > 0
          ? 'border-red-200 hover:border-red-300'
          : opp.progressionStatus === 'stalled'
            ? 'border-amber-200 hover:border-amber-300'
            : 'border-slate-200 hover:border-brand-200',
      )}
    >
      {/* Urgency bar */}
      {isAtRisk && blocking.length > 0 && (
        <div className="h-0.5 bg-red-400 rounded-t-xl" />
      )}

      <div className="p-3.5">
        {/* Row 1: type + status */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className={cn(
            'inline-flex items-center text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ring-1',
            typeConf.style,
          )}>
            {typeConf.label}
          </span>
          <span className={cn('flex items-center gap-1 text-[10px] font-semibold', STATUS_STYLE[opp.progressionStatus])}>
            <MovementIcon movement={opp.movement} status={opp.progressionStatus} />
            {STATUS_LABEL[opp.progressionStatus]}
          </span>
        </div>

        {/* Row 2: account name */}
        <p className="text-[13px] font-semibold text-slate-900 group-hover:text-brand-700 transition-colors leading-snug mb-2.5">
          {opp.accountName}
        </p>

        {/* Row 3: value + confidence */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[14px] font-bold text-slate-800 tabular-nums">
            {formatCurrency(opp.estimatedValue)}
          </span>
          <span className={cn(
            'text-[10px] font-semibold px-1.5 py-0.5 rounded ring-1',
            confConf.style,
          )}>
            {confConf.label}
          </span>
        </div>

        {/* Row 4: stage time + close date */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2.5">
          <span>{opp.daysInStage}d in stage</span>
          {closeDays !== null && (
            <span className={closeUrgent ? (closeDays < 30 ? 'font-semibold text-red-500' : 'font-medium text-amber-500') : ''}>
              {closeDays < 0 ? 'Overdue' : `Closes ${closeDays}d`}
            </span>
          )}
        </div>

        {/* Execution risks */}
        {opp.executionRisks.length > 0 && (
          <div className="space-y-1 pt-2 border-t border-slate-50">
            {blocking.map((r, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <AlertCircle size={10} className="text-red-500 flex-shrink-0" />
                <span className="text-[10px] text-red-700 leading-snug">{r.label}</span>
              </div>
            ))}
            {warnings.map((r, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <AlertCircle size={10} className="text-amber-500 flex-shrink-0" />
                <span className="text-[10px] text-amber-700 leading-snug">{r.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </button>
  )
}

// ─── NBA item ─────────────────────────────────────────────────────────────────

function NBAItem({ nba, playRunId, accountName }: { nba: NextBestAction; playRunId: string | null; accountName: string }) {
  const dotColor =
    nba.priority === 'high'   ? 'bg-red-500'   :
    nba.priority === 'medium' ? 'bg-amber-400' :
                                'bg-slate-300'

  const href = playRunId
    ? `/accounts/${nba.accountId}/plays/${playRunId}`
    : `/accounts/${nba.accountId}`

  return (
    <Link
      to={href}
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

// ─── Main view ────────────────────────────────────────────────────────────────

export function PipelineView() {
  const { opportunities, accounts, nextBestActions, playRuns } = useApp()

  const byStage = STAGE_ORDER.reduce<Record<PipelineStageId, Opportunity[]>>(
    (acc, s) => { acc[s] = opportunities.filter(o => o.stage === s); return acc },
    {} as Record<PipelineStageId, Opportunity[]>
  )

  const totalValue   = opportunities.reduce((s, o) => s + o.estimatedValue, 0)
  const atRiskValue  = opportunities.filter(o => o.progressionStatus === 'at_risk').reduce((s, o) => s + o.estimatedValue, 0)
  const advancingCt  = opportunities.filter(o => o.progressionStatus === 'advancing').length
  const stalledCt    = opportunities.filter(o => o.progressionStatus === 'stalled').length
  const atRiskCt     = opportunities.filter(o => o.progressionStatus === 'at_risk').length

  const activeNBAs = nextBestActions
    .filter(n => n.status === 'active')
    .sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] ?? 2) - ({ high: 0, medium: 1, low: 2 }[b.priority] ?? 2))
    .slice(0, 7)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-8 h-[60px] flex items-center justify-between border-b border-slate-100 bg-white">
        <div>
          <h1 className="text-[15px] font-semibold text-slate-900">Post-Sale Pipeline</h1>
          <p className="text-[12px] text-slate-400 mt-0.5">Where is our revenue and what moves it forward</p>
        </div>

        <div className="flex items-center gap-5">
          {advancingCt > 0 && (
            <div className="text-right">
              <div className="text-[10px] font-medium text-emerald-500 uppercase tracking-wide">Advancing</div>
              <div className="text-[16px] font-bold text-emerald-600 leading-none mt-0.5">{advancingCt}</div>
            </div>
          )}
          {stalledCt > 0 && (
            <div className="text-right">
              <div className="text-[10px] font-medium text-amber-500 uppercase tracking-wide">Stalled</div>
              <div className="text-[16px] font-bold text-amber-600 leading-none mt-0.5">{stalledCt}</div>
            </div>
          )}
          {atRiskCt > 0 && (
            <div className="text-right">
              <div className="text-[10px] font-medium text-red-400 uppercase tracking-wide">At Risk</div>
              <div className="text-[16px] font-bold text-red-600 leading-none mt-0.5">{atRiskCt}</div>
            </div>
          )}
          <div className="text-right border-l border-slate-100 pl-5">
            <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Pipeline</div>
            <div className="text-[16px] font-bold text-slate-700 leading-none mt-0.5">{formatCurrency(totalValue)}</div>
          </div>
          {atRiskValue > 0 && (
            <div className="text-right">
              <div className="text-[10px] font-medium text-red-400 uppercase tracking-wide">At-Risk ARR</div>
              <div className="text-[16px] font-bold text-red-600 leading-none mt-0.5">{formatCurrency(atRiskValue)}</div>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">

        {/* Kanban */}
        <div className="flex-1 overflow-auto p-6">
          <div className="flex gap-4 min-w-max">
            {STAGE_ORDER.map((stage, stageIndex) => {
              const stageOpps  = byStage[stage]
              const stageValue = stageOpps.reduce((s, o) => s + o.estimatedValue, 0)

              return (
                <div key={stage} className="flex items-start gap-4">
                  <div className="w-[220px]">
                    {/* Stage header */}
                    <div className="mb-3 px-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[13px] font-semibold text-slate-800">{STAGE_LABELS[stage]}</span>
                        <span className="text-[11px] font-medium text-slate-400 tabular-nums">
                          {stageOpps.length}
                        </span>
                      </div>
                      {stageValue > 0 && (
                        <p className="text-[11px] font-semibold text-slate-500 tabular-nums">
                          {formatCurrency(stageValue)}
                        </p>
                      )}
                    </div>

                    {/* Opportunity cards */}
                    <div className="space-y-2">
                      {stageOpps.length === 0 && (
                        <div className="border border-dashed border-slate-200 rounded-xl p-5 text-center">
                          <span className="text-[12px] text-slate-300">No opportunities</span>
                        </div>
                      )}
                      {stageOpps.map(opp => <OppCard key={opp.id} opp={opp} />)}
                    </div>
                  </div>

                  {stageIndex < STAGE_ORDER.length - 1 && (
                    <div className="flex items-start pt-[46px]">
                      <ArrowRight size={14} className="text-slate-200 mt-0.5" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* NBA Sidebar */}
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
                const run  = playRuns.find(
                  r => r.accountId === nba.accountId &&
                       r.playTemplateId === nba.linkedPlayTemplateId &&
                       r.status === 'in_progress'
                )
                const acct = accounts.find(a => a.id === nba.accountId)
                return (
                  <NBAItem
                    key={nba.id}
                    nba={nba}
                    playRunId={run?.id ?? null}
                    accountName={acct?.name ?? nba.accountId}
                  />
                )
              })
            )}
          </div>
          <div className="px-4 py-3 border-t border-slate-100">
            <Link
              to="/inflection-points"
              className="flex items-center justify-between text-[11px] font-medium text-brand-600 hover:text-brand-800 transition-colors"
            >
              View all execution gaps
              <ChevronRight size={11} />
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
