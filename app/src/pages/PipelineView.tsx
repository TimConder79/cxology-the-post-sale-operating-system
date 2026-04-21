import { useNavigate } from 'react-router-dom'
import { AlertTriangle, TrendingUp, Minus, ArrowRight } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import {
  STAGE_ORDER, STAGE_LABELS, STAGE_DESCRIPTIONS,
  PROGRESSION, formatCurrency, daysUntil, cn,
} from '@/lib/utils'
import type { PipelineStageId, ProgressionStatus } from '@/types'

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

export function PipelineView() {
  const navigate = useNavigate()
  const { accounts, stageConfidences } = useApp()

  const byStage = STAGE_ORDER.reduce<Record<PipelineStageId, typeof accounts>>(
    (acc, s) => { acc[s] = accounts.filter(a => a.stage === s); return acc },
    {} as Record<PipelineStageId, typeof accounts>
  )

  const totalARR = accounts.reduce((s, a) => s + a.arr, 0)
  const atRiskARR = accounts.filter(a => a.progressionStatus === 'at_risk').reduce((s, a) => s + a.arr, 0)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-8 h-[60px] flex items-center justify-between border-b border-slate-100 bg-white">
        <div>
          <h1 className="text-[15px] font-semibold text-slate-900">Post-Sale Pipeline</h1>
          <p className="text-[12px] text-slate-400 mt-0.5">Progression over activity</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-[11px] text-slate-400">Total ARR</div>
            <div className="text-[13px] font-semibold text-slate-900">{formatCurrency(totalARR)}</div>
          </div>
          {atRiskARR > 0 && (
            <div className="text-right">
              <div className="text-[11px] text-red-400">At-Risk ARR</div>
              <div className="text-[13px] font-semibold text-red-600">{formatCurrency(atRiskARR)}</div>
            </div>
          )}
        </div>
      </div>

      {/* Pipeline columns */}
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
                      const conf = stageConfidences.find(s => s.accountId === account.id && s.stage === account.stage)
                      const renewal = daysUntil(account.renewalDate)
                      const isAtRisk = account.progressionStatus === 'at_risk'

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

                            <div className={cn(
                              'mt-2.5 pt-2.5 border-t border-slate-100 text-[11px]',
                              renewal < 60 ? 'text-red-500' : 'text-slate-400'
                            )}>
                              Renews in <span className="font-semibold">{renewal}d</span>
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
    </div>
  )
}
