import { useNavigate, Link } from 'react-router-dom'
import { AlertTriangle, TrendingUp, Minus, ArrowRight, ChevronRight } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import {
  STAGE_ORDER, STAGE_LABELS, STAGE_DESCRIPTIONS,
  PROGRESSION, formatCurrency, daysUntil, cn,
} from '@/lib/utils'
import type { PipelineStageId, ProgressionStatus, NextBestAction } from '@/types'

function ProgressionIcon({ status }: { status: ProgressionStatus }) {
  if (status === 'advancing') return <TrendingUp size={12} className="text-emerald-500" />
  if (status === 'at_risk')   return <AlertTriangle size={12} className="text-red-500" />
  return <Minus size={12} className="text-amber-400" />
}

function ConfidenceBar({ score }: { score: number }) {
  const color = score >= 70 ? 'bg-emerald-400' : score >= 40 ? 'bg-amber-400' : 'bg-red-400'
  return (
    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
      <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${score}%` }} />
    </div>
  )
}

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
      <div className={cn('w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0', dotColor)} />
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

export function PipelineView() {
  const navigate = useNavigate()
  const { accounts, stageConfidences, nextBestActions, playRuns } = useApp()

  const byStage = STAGE_ORDER.reduce<Record<PipelineStageId, typeof accounts>>(
    (acc, s) => { acc[s] = accounts.filter(a => a.stage === s); return acc },
    {} as Record<PipelineStageId, typeof accounts>
  )

  const activeNBAs = nextBestActions
    .filter(n => n.status === 'active')
    .sort((a, b) => {
      const p = { high: 0, medium: 1, low: 2 }
      return (p[a.priority] ?? 2) - (p[b.priority] ?? 2)
    })
    .slice(0, 7)

  // Map accountId → count of high-priority active NBAs for card indicators
  const highNBAMap = nextBestActions
    .filter(n => n.status === 'active' && n.priority === 'high')
    .reduce<Record<string, number>>((acc, n) => {
      acc[n.accountId] = (acc[n.accountId] ?? 0) + 1
      return acc
    }, {})

  const totalARR    = accounts.reduce((s, a) => s + a.arr, 0)
  const atRiskCount = accounts.filter(a => a.progressionStatus === 'at_risk').length
  const stalledCount= accounts.filter(a => a.progressionStatus === 'stalled').length
  const advancingCount = accounts.filter(a => a.progressionStatus === 'advancing').length
  const atRiskARR   = accounts.filter(a => a.progressionStatus === 'at_risk').reduce((s, a) => s + a.arr, 0)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-8 h-[60px] flex items-center justify-between border-b border-slate-100 bg-white">
        <div>
          <h1 className="text-[15px] font-semibold text-slate-900">Post-Sale Pipeline</h1>
          <p className="text-[12px] text-slate-400 mt-0.5">Progression over activity</p>
        </div>
        <div className="flex items-center gap-5">
          {advancingCount > 0 && (
            <div className="text-right">
              <div className="text-[10px] font-medium text-emerald-500 uppercase tracking-wide">Advancing</div>
              <div className="text-[16px] font-bold text-emerald-600 leading-none mt-0.5">{advancingCount}</div>
            </div>
          )}
          {stalledCount > 0 && (
            <div className="text-right">
              <div className="text-[10px] font-medium text-amber-500 uppercase tracking-wide">Stalled</div>
              <div className="text-[16px] font-bold text-amber-600 leading-none mt-0.5">{stalledCount}</div>
            </div>
          )}
          {atRiskCount > 0 && (
            <div className="text-right">
              <div className="text-[10px] font-medium text-red-400 uppercase tracking-wide">At Risk</div>
              <div className="text-[16px] font-bold text-red-600 leading-none mt-0.5">{atRiskCount}</div>
            </div>
          )}
          <div className="text-right border-l border-slate-100 pl-5">
            <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Total ARR</div>
            <div className="text-[16px] font-bold text-slate-700 leading-none mt-0.5">{formatCurrency(totalARR)}</div>
          </div>
          {atRiskARR > 0 && (
            <div className="text-right">
              <div className="text-[10px] font-medium text-red-400 uppercase tracking-wide">At-Risk ARR</div>
              <div className="text-[16px] font-bold text-red-600 leading-none mt-0.5">{formatCurrency(atRiskARR)}</div>
            </div>
          )}
        </div>
      </div>

      {/* Body: kanban + NBA panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Kanban */}
        <div className="flex-1 overflow-auto p-6">
          <div className="flex gap-4 min-w-max">
            {STAGE_ORDER.map((stage, stageIndex) => {
              const stageAccounts = byStage[stage]
              const atRisk  = stageAccounts.filter(a => a.progressionStatus === 'at_risk').length
              const stalled = stageAccounts.filter(a => a.progressionStatus === 'stalled').length

              return (
                <div key={stage} className="flex items-start gap-4">
                  <div className="w-[240px]">
                    {/* Stage header */}
                    <div className="mb-3 px-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[13px] font-semibold text-slate-800">{STAGE_LABELS[stage]}</span>
                        <span className="text-[11px] font-medium text-slate-400 tabular-nums">{stageAccounts.length}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mb-2">{STAGE_DESCRIPTIONS[stage]}</p>
                      {(atRisk > 0 || stalled > 0) && (
                        <div className="flex flex-wrap gap-1.5">
                          {atRisk > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                              {atRisk} at risk
                            </span>
                          )}
                          {stalled > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                              {stalled} stalled
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Account cards */}
                    <div className="space-y-2">
                      {stageAccounts.length === 0 && (
                        <div className="border border-dashed border-slate-200 rounded-xl p-5 text-center">
                          <span className="text-[12px] text-slate-300">No accounts</span>
                        </div>
                      )}
                      {stageAccounts.map(account => {
                        const conf      = stageConfidences.find(s => s.accountId === account.id && s.stage === account.stage)
                        const renewal   = daysUntil(account.renewalDate)
                        const isAtRisk  = account.progressionStatus === 'at_risk'
                        const highNBAs  = highNBAMap[account.id] ?? 0

                        return (
                          <button
                            key={account.id}
                            onClick={() => navigate(`/accounts/${account.id}`)}
                            className={cn(
                              'w-full text-left bg-white rounded-xl border transition-all group',
                              'hover:shadow-md hover:-translate-y-0.5 duration-150',
                              isAtRisk
                                ? 'border-red-200 hover:border-red-300'
                                : 'border-slate-200 hover:border-brand-200'
                            )}
                          >
                            {isAtRisk && <div className="h-0.5 bg-red-400 rounded-t-xl" />}
                            <div className="p-3.5">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <span className="text-[13px] font-semibold text-slate-900 group-hover:text-brand-700 leading-snug transition-colors">
                                  {account.name}
                                </span>
                                <ProgressionIcon status={account.progressionStatus} />
                              </div>

                              <div className="text-[11px] text-slate-400 mb-3">{account.industry}</div>

                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[12px] font-semibold text-slate-700">{formatCurrency(account.arr)}</span>
                                <span className={cn(
                                  'text-[10px] font-medium px-1.5 py-0.5 rounded-full ring-1',
                                  PROGRESSION[account.progressionStatus].badge
                                )}>
                                  {PROGRESSION[account.progressionStatus].label}
                                </span>
                              </div>

                              {conf && (
                                <div>
                                  <div className="flex justify-between mb-1">
                                    <span className="text-[10px] text-slate-400">Stage confidence</span>
                                    <span className="text-[10px] font-semibold text-slate-600">{conf.score}%</span>
                                  </div>
                                  <ConfidenceBar score={conf.score} />
                                </div>
                              )}

                              <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-slate-100">
                                <span className={cn(
                                  'text-[11px]',
                                  renewal < 60 ? 'text-red-500' : 'text-slate-400'
                                )}>
                                  Renews in <span className="font-semibold">{renewal}d</span>
                                </span>
                                {highNBAs > 0 && (
                                  <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded ring-1 ring-red-200">
                                    {highNBAs} action{highNBAs !== 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Stage connector */}
                  {stageIndex < STAGE_ORDER.length - 1 && (
                    <div className="flex items-start pt-[52px]">
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
                const run = playRuns.find(
                  r => r.accountId === nba.accountId &&
                       r.playTemplateId === nba.linkedPlayTemplateId &&
                       r.status === 'in_progress'
                )
                const acct = accounts.find(a => a.id === nba.accountId)
                return <NBAItem key={nba.id} nba={nba} playRunId={run?.id ?? null} accountName={acct?.name ?? nba.accountId} />
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
