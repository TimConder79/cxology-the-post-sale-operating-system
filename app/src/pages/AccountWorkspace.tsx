import { useParams, useNavigate, Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import {
  ChevronLeft, CheckCircle2, Circle, AlertCircle, Clock,
  ArrowRight, User, Zap, TrendingUp, AlertTriangle,
  Calendar, ChevronRight,
} from 'lucide-react'
import { useApp } from '@/context/AppContext'
import {
  STAGE_ORDER, STAGE_LABELS, PROGRESSION, IP_STATUS, INFLUENCE, COVERAGE,
  PLAY_RUN_STATUS, SIGNAL_STATUS,
  formatCurrency, formatDate, formatDateShort, daysUntil, daysSince, cn,
} from '@/lib/utils'
import type { InflectionPointStatus } from '@/types'

function IPIcon({ status }: { status: InflectionPointStatus }) {
  const size = 16
  if (status === 'achieved')    return <CheckCircle2 size={size} className="text-emerald-500 flex-shrink-0" />
  if (status === 'overdue')     return <AlertCircle  size={size} className="text-red-500 flex-shrink-0" />
  if (status === 'pending')     return <Clock        size={size} className="text-blue-500 flex-shrink-0" />
  return <Circle size={size} className="text-slate-200 flex-shrink-0" />
}

function Section({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('bg-white rounded-xl border border-slate-200', className)}>
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="text-[12px] font-semibold text-slate-500 uppercase tracking-widest">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

export function AccountWorkspace() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getAccountView, contacts } = useApp()

  const account = getAccountView(id!)
  if (!account) return <div className="p-8 text-slate-500">Account not found.</div>

  const stageIndex = STAGE_ORDER.indexOf(account.stage)
  const renewal    = daysUntil(account.renewalDate)
  const conf       = account.stageConfidence

  const activeRun  = account.playRuns.find(r => r.status === 'in_progress')
  const otherRuns  = account.playRuns.filter(r => r.id !== activeRun?.id)

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex-shrink-0 px-8 h-[60px] flex items-center justify-between border-b border-slate-100 bg-white">
        <button
          onClick={() => navigate('/pipeline')}
          className="flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-slate-700 transition-colors"
        >
          <ChevronLeft size={14} />
          Pipeline
        </button>
        <div className="flex items-center gap-3">
          <span className={cn(
            'inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full ring-1',
            PROGRESSION[account.progressionStatus].badge
          )}>
            <span className={cn('w-1.5 h-1.5 rounded-full', PROGRESSION[account.progressionStatus].dot)} />
            {PROGRESSION[account.progressionStatus].label}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-8 py-6">
          {/* Account header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{account.name}</h1>
            <div className="flex items-center gap-3 mt-1.5 text-[13px] text-slate-500">
              <span>{account.industry}</span>
              <span className="text-slate-200">·</span>
              <span className="font-semibold text-slate-700">{formatCurrency(account.arr)} ARR</span>
              <span className="text-slate-200">·</span>
              <span className={cn('font-medium', renewal < 60 ? 'text-red-500' : '')}>
                Renewal in {renewal}d
                {renewal < 60 && <AlertTriangle size={11} className="inline ml-1 mb-0.5" />}
              </span>
              <span className="text-slate-200">·</span>
              <span>{account.csm}</span>
            </div>
          </div>

          {/* Stage pipeline */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[12px] font-semibold text-slate-500 uppercase tracking-widest">Pipeline Stage</div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <Calendar size={11} />
                {account.daysInStage} days in current stage
              </div>
            </div>

            {/* Stage steps */}
            <div className="flex items-center gap-1.5 mb-4">
              {STAGE_ORDER.map((stage, i) => {
                const isActive = stage === account.stage
                const isPast   = i < stageIndex
                const isFuture = i > stageIndex
                return (
                  <div key={stage} className="flex items-center flex-1 min-w-0">
                    <div className={cn(
                      'flex-1 py-2 px-3 rounded-lg text-center text-[11px] font-semibold truncate transition-colors',
                      isActive  ? 'bg-brand-600 text-white shadow-sm'        :
                      isPast    ? 'bg-emerald-50 text-emerald-700'           :
                      isFuture  ? 'bg-slate-50 text-slate-300'              : ''
                    )}>
                      {STAGE_LABELS[stage]}
                    </div>
                    {i < STAGE_ORDER.length - 1 && (
                      <ArrowRight size={11} className={cn('mx-1 flex-shrink-0', isPast ? 'text-emerald-300' : 'text-slate-200')} />
                    )}
                  </div>
                )
              })}
            </div>

            {/* Confidence */}
            {conf && (
              <>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[11px] text-slate-400">
                    Stage confidence
                    {conf.trend === 'improving' && <TrendingUp size={10} className="inline ml-1 text-emerald-500" />}
                    {conf.trend === 'declining' && <AlertTriangle size={10} className="inline ml-1 text-red-400" />}
                  </span>
                  <span className="text-[12px] font-bold text-slate-700">{conf.score}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      conf.score >= 70 ? 'bg-emerald-400' : conf.score >= 40 ? 'bg-amber-400' : 'bg-red-400'
                    )}
                    style={{ width: `${conf.score}%` }}
                  />
                </div>

                {/* Signals */}
                <div className="space-y-2">
                  {conf.signals.map(sig => (
                    <div key={sig.id} className="flex items-start gap-2.5">
                      <span className={cn('text-[12px] font-bold mt-0.5 flex-shrink-0 w-3', SIGNAL_STATUS[sig.status].color)}>
                        {SIGNAL_STATUS[sig.status].icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="text-[12px] text-slate-700 font-medium">{sig.label}</span>
                        <span className="text-[11px] text-slate-400 ml-2">{sig.detail}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-[1fr_320px] gap-5">
            {/* Left column */}
            <div className="space-y-5">

              {/* Inflection Points */}
              <Section title="Inflection Points">
                <div className="space-y-3">
                  {account.inflectionPoints.map((ip, i) => (
                    <div key={ip.id} className="flex items-start gap-3">
                      <IPIcon status={ip.status} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[13px] font-medium text-slate-800">{ip.label}</span>
                          <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-md ring-1', IP_STATUS[ip.status].ring)}>
                            {IP_STATUS[ip.status].label}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {ip.achievedDate && `Achieved ${formatDateShort(ip.achievedDate)}`}
                          {!ip.achievedDate && ip.dueDate && ip.status === 'overdue' && (
                            <span className="text-red-500">Was due {formatDate(ip.dueDate)}</span>
                          )}
                          {!ip.achievedDate && ip.dueDate && ip.status !== 'overdue' && `Due ${formatDate(ip.dueDate)}`}
                          {!ip.achievedDate && !ip.dueDate && ip.status === 'not_started' && 'Not yet started'}
                        </div>
                      </div>
                      {/* Connector line */}
                      {i < account.inflectionPoints.length - 1 && (
                        <div className="absolute left-[26px] mt-5 w-px h-3 bg-slate-100" />
                      )}
                    </div>
                  ))}
                </div>
              </Section>

              {/* Plays */}
              <Section title="Plays">
                <div className="space-y-2">
                  {/* Active play — prominent */}
                  {activeRun && (
                    <div className="bg-brand-50 border border-brand-200 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[13px] font-semibold text-brand-900">{activeRun.label}</span>
                            <span className="text-[10px] font-semibold text-brand-600 bg-white px-1.5 py-0.5 rounded-md ring-1 ring-brand-200">
                              Active
                            </span>
                          </div>
                          {activeRun.scheduledDate && (
                            <div className="text-[11px] text-brand-500">
                              Scheduled {formatDate(activeRun.scheduledDate)}
                            </div>
                          )}
                          <div className="flex gap-1 mt-2">
                            {([1,2,3,4] as const).map(step => (
                              <div key={step} className={cn(
                                'h-1 flex-1 rounded-full',
                                step <= activeRun.currentStep ? 'bg-brand-500' : 'bg-brand-200'
                              )} />
                            ))}
                          </div>
                          <div className="text-[10px] text-brand-400 mt-1">Step {activeRun.currentStep} of 4</div>
                        </div>
                        <Link
                          to={`/accounts/${account.id}/plays/${activeRun.id}`}
                          className="flex items-center gap-1.5 text-[12px] font-semibold text-brand-700 bg-white px-3 py-1.5 rounded-lg ring-1 ring-brand-200 hover:bg-brand-600 hover:text-white hover:ring-brand-600 transition-all flex-shrink-0"
                        >
                          Continue
                          <ChevronRight size={13} />
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Other runs */}
                  {otherRuns.map(run => (
                    <div key={run.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-medium text-slate-700">{run.label}</span>
                          <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-md ring-1', PLAY_RUN_STATUS[run.status].color)}>
                            {PLAY_RUN_STATUS[run.status].label}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {run.completedAt && `Completed ${formatDateShort(run.completedAt)}`}
                          {!run.completedAt && run.scheduledDate && `Scheduled ${formatDate(run.scheduledDate)}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            </div>

            {/* Right column */}
            <div className="space-y-5">

              {/* Next Best Actions */}
              <div className="bg-white rounded-xl border border-slate-200">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                  <Zap size={13} className="text-brand-500 fill-brand-100" />
                  <h2 className="text-[12px] font-semibold text-slate-500 uppercase tracking-widest">Next Best Actions</h2>
                </div>
                <div className="p-4 space-y-3">
                  {account.nextBestActions.length === 0 && (
                    <p className="text-[12px] text-slate-400">No open actions.</p>
                  )}
                  {account.nextBestActions.map(nba => (
                    <div key={nba.id} className="relative pl-3">
                      <div className={cn(
                        'absolute left-0 top-0 bottom-0 w-0.5 rounded-full',
                        nba.priority === 'high' ? 'bg-red-400' : nba.priority === 'medium' ? 'bg-amber-400' : 'bg-slate-200'
                      )} />
                      <div className="text-[12px] font-semibold text-slate-800 mb-0.5">{nba.label}</div>
                      <div className="text-[11px] text-slate-400 leading-relaxed">{nba.reason}</div>
                      {nba.linkedPlayTemplateId && (
                        <div className="mt-1.5">
                          <span className="text-[10px] font-medium text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">
                            Start play →
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Stakeholder Map */}
              <Section title="Stakeholder Map">
                <div className="space-y-2.5">
                  {account.stakeholderMaps.map(sm => {
                    const contact = contacts.find(c => c.id === sm.contactId)
                    if (!contact) return null
                    const lastContact = sm.lastContactDate ? daysSince(sm.lastContactDate) : null
                    return (
                      <div key={sm.id} className={cn(
                        'rounded-lg p-3 border',
                        sm.coverageRisk ? 'border-amber-200 bg-amber-50' : 'border-slate-100 bg-white'
                      )}>
                        <div className="flex items-start gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <User size={12} className="text-slate-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[12px] font-semibold text-slate-800 leading-none">{contact.name}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{contact.title}</div>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded ring-1', INFLUENCE[sm.influence].color)}>
                                {INFLUENCE[sm.influence].label}
                              </span>
                              <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded ring-1', COVERAGE[sm.coverageStatus].color)}>
                                <span className={cn('w-1.5 h-1.5 rounded-full inline-block mr-1', COVERAGE[sm.coverageStatus].dot)} />
                                {COVERAGE[sm.coverageStatus].label}
                              </span>
                            </div>
                            {lastContact !== null && (
                              <div className={cn(
                                'text-[10px] mt-1',
                                lastContact > 45 ? 'text-amber-500' : 'text-slate-400'
                              )}>
                                Last contact {lastContact}d ago
                              </div>
                            )}
                            {sm.notes && sm.coverageRisk && (
                              <div className="text-[10px] text-amber-600 mt-1">{sm.notes}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Section>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
