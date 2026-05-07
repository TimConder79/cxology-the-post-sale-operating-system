import { useState } from 'react'
import { CheckCircle2, Clock, AlertCircle, Circle, ChevronRight, RotateCw, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { AccountView, JourneyCycle, CyclePhase } from '@/types'
import { cn, formatDateShort } from '@/lib/utils'

// ─── Spine milestone node ─────────────────────────────────────────────────────

interface SpineMilestone {
  id: string
  label: string
  status: 'achieved' | 'overdue' | 'pending' | 'not_started'
  achievedDate: string | null
  dueDate: string | null
}

function MilestoneNode({ m }: { m: SpineMilestone }) {
  const achieved = m.status === 'achieved'
  const overdue  = m.status === 'overdue'
  const pending  = m.status === 'pending'

  return (
    <div className="flex flex-col items-center gap-1.5 w-[84px] flex-shrink-0">
      <div className={cn(
        'w-7 h-7 rounded-full border-2 flex items-center justify-center',
        achieved ? 'border-emerald-500 bg-emerald-500' :
        overdue  ? 'border-red-400 bg-red-50'          :
        pending  ? 'border-blue-400 bg-blue-50'        :
                   'border-slate-200 bg-white'
      )}>
        {achieved && <CheckCircle2 size={13} className="text-white" />}
        {overdue  && <AlertCircle  size={13} className="text-red-400" />}
        {pending  && <Clock        size={13} className="text-blue-400" />}
        {!achieved && !overdue && !pending && <Circle size={13} className="text-slate-200" />}
      </div>
      <div className="text-center">
        <div className={cn(
          'text-[11px] font-medium leading-tight',
          achieved ? 'text-slate-700' :
          overdue  ? 'text-red-500'   :
          pending  ? 'text-blue-600'  :
                     'text-slate-400'
        )}>
          {m.label}
        </div>
        {m.achievedDate && (
          <div className="text-[10px] text-slate-400 mt-0.5 leading-none">
            {formatDateShort(m.achievedDate)}
          </div>
        )}
        {!m.achievedDate && m.dueDate && overdue && (
          <div className="text-[10px] text-red-400 mt-0.5 leading-none">overdue</div>
        )}
      </div>
    </div>
  )
}

// ─── Spine connector ──────────────────────────────────────────────────────────

function Connector({ achieved }: { achieved: boolean }) {
  return (
    <div className="flex-1 self-start pt-[13px] min-w-[12px]">
      <div className={cn('w-full border-t-2', achieved ? 'border-emerald-200' : 'border-slate-100')} />
    </div>
  )
}

// ─── Cycle badge ──────────────────────────────────────────────────────────────

function CycleBadge({
  cycle, isSelected, onClick,
}: {
  cycle: JourneyCycle; isSelected: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-7 h-7 rounded-full border-2 flex items-center justify-center text-[11px] font-bold transition-all flex-shrink-0',
        cycle.status === 'completed'
          ? isSelected
            ? 'border-emerald-600 bg-emerald-500 text-white shadow-sm'
            : 'border-emerald-400 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          : cycle.status === 'in_progress'
          ? isSelected
            ? 'border-brand-600 bg-brand-500 text-white shadow-sm'
            : 'border-brand-400 bg-brand-50 text-brand-700 hover:bg-brand-100'
          : 'border-slate-200 bg-white text-slate-400 cursor-default'
      )}
      title={`Cycle ${cycle.cycleNumber} — ${cycle.status.replace('_', ' ')}`}
    >
      {cycle.cycleNumber}
    </button>
  )
}

// ─── Loop orbit ───────────────────────────────────────────────────────────────

function LoopOrbit({
  cycles, selectedCycleId, onSelectCycle,
}: {
  cycles: JourneyCycle[]; selectedCycleId: string | null; onSelectCycle: (id: string | null) => void
}) {
  const hasCompleted  = cycles.some(c => c.status === 'completed')
  const hasInProgress = cycles.some(c => c.status === 'in_progress')
  const hasCycles     = cycles.length > 0

  const borderColor = hasCompleted ? 'border-emerald-200' : hasInProgress ? 'border-brand-200' : 'border-slate-200'
  const bgColor     = hasCompleted ? 'bg-emerald-50/50'   : hasInProgress ? 'bg-brand-50/50'   : 'bg-slate-50/50'
  const iconColor   = hasCompleted ? 'text-emerald-500'   : hasInProgress ? 'text-brand-500'   : 'text-slate-300'
  const labelColor  = hasCompleted ? 'text-emerald-700'   : hasInProgress ? 'text-brand-700'   : 'text-slate-400'

  return (
    <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
      <div className={cn('border-2 rounded-xl px-4 py-3 min-w-[240px]', borderColor, bgColor)}>
        {/* Phase flow labels */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <RotateCw size={11} className={iconColor} />
          {(['Goals', 'Habit Tx', 'Align'] as const).map((label, i) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className={cn('text-[11px] font-semibold', labelColor)}>{label}</span>
              {i < 2 && <ChevronRight size={10} className="text-slate-300" />}
            </div>
          ))}
        </div>

        {/* Cycle badges */}
        <div className="flex items-center justify-center gap-1.5 flex-wrap min-h-[28px]">
          {hasCycles ? (
            cycles.map(cycle => (
              <CycleBadge
                key={cycle.id}
                cycle={cycle}
                isSelected={selectedCycleId === cycle.id}
                onClick={() => onSelectCycle(selectedCycleId === cycle.id ? null : cycle.id)}
              />
            ))
          ) : (
            <span className="text-[10px] text-slate-400">No cycles yet</span>
          )}
        </div>
      </div>
      <div className="text-[10px] text-slate-400">Repeating Loop</div>
    </div>
  )
}

// ─── Phase row inside cycle inspector ────────────────────────────────────────

function PhaseRow({ phase, accountId }: { phase: CyclePhase; accountId: string }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
      <div className={cn(
        'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
        phase.status === 'completed'   ? 'border-emerald-500 bg-emerald-500' :
        phase.status === 'in_progress' ? 'border-brand-400 bg-brand-50'     :
                                         'border-slate-200 bg-white'
      )}>
        {phase.status === 'completed'   && <CheckCircle2 size={10} className="text-white" />}
        {phase.status === 'in_progress' && <Clock        size={10} className="text-brand-500" />}
      </div>

      <div className="flex-1 min-w-0">
        <span className={cn(
          'text-[12px] font-medium',
          phase.status === 'completed'   ? 'text-slate-700' :
          phase.status === 'in_progress' ? 'text-brand-700' :
                                           'text-slate-400'
        )}>
          {phase.label}
        </span>
        {phase.completedDate && (
          <span className="text-[11px] text-slate-400 ml-2">{formatDateShort(phase.completedDate)}</span>
        )}
        {phase.status === 'in_progress' && (
          <span className="text-[11px] text-brand-500 ml-2">In progress</span>
        )}
      </div>

      {phase.playRunId && phase.status !== 'not_started' && (
        <Link
          to={`/accounts/${accountId}/plays/${phase.playRunId}`}
          className="flex items-center gap-1 text-[11px] font-medium text-brand-600 hover:text-brand-800 flex-shrink-0 transition-colors"
        >
          View Play
          <ChevronRight size={11} />
        </Link>
      )}
    </div>
  )
}

// ─── Cycle inspector ──────────────────────────────────────────────────────────

function CycleInspector({
  cycle, accountId, onClose,
}: {
  cycle: JourneyCycle; accountId: string; onClose: () => void
}) {
  const statusLabel =
    cycle.status === 'completed'   ? 'Completed'  :
    cycle.status === 'in_progress' ? 'In Progress' :
                                     'Not Started'

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-slate-800">Cycle {cycle.cycleNumber}</span>
          <span className={cn(
            'text-[10px] font-medium px-1.5 py-0.5 rounded-md ring-1',
            cycle.status === 'completed'
              ? 'text-emerald-700 bg-emerald-50 ring-emerald-200'
              : cycle.status === 'in_progress'
              ? 'text-brand-700 bg-brand-50 ring-brand-200'
              : 'text-slate-500 bg-white ring-slate-200'
          )}>
            {statusLabel}
          </span>
          {cycle.completedAt && (
            <span className="text-[11px] text-slate-400">{formatDateShort(cycle.completedAt)}</span>
          )}
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
          <X size={14} />
        </button>
      </div>

      <div>
        {cycle.phases.map(phase => (
          <PhaseRow key={phase.type} phase={phase} accountId={accountId} />
        ))}
      </div>
    </div>
  )
}

// ─── Main timeline ────────────────────────────────────────────────────────────

export function JourneyTimeline({ account }: { account: AccountView }) {
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null)

  const ipByType = Object.fromEntries(account.inflectionPoints.map(ip => [ip.type, ip]))

  const spineLeft: SpineMilestone[] = [
    {
      id: 'purchase',
      label: 'Purchase',
      status: 'achieved',
      achievedDate: account.createdAt,
      dueDate: null,
    },
    {
      id: 'first_meeting',
      label: 'First Meeting',
      status: account.stage === 'identify' ? 'pending' : 'achieved',
      achievedDate: account.stage !== 'identify' ? account.createdAt : null,
      dueDate: null,
    },
    {
      id: 'onboarding',
      label: 'Onboarding',
      status: ['align', 'advocate', 'intent', 'nrr_close'].includes(account.stage) ? 'achieved' : 'pending',
      achievedDate: ['align', 'advocate', 'intent', 'nrr_close'].includes(account.stage) ? account.createdAt : null,
      dueDate: null,
    },
    (() => {
      const ip = ipByType['first_value']
      return {
        id: 'first_value',
        label: 'First Value',
        status: ip?.status ?? 'not_started',
        achievedDate: ip?.achievedDate ?? null,
        dueDate: ip?.dueDate ?? null,
      } as SpineMilestone
    })(),
  ]

  const renewalMilestone: SpineMilestone = {
    id: 'renewal',
    label: 'Renewal',
    status: ['intent', 'nrr_close'].includes(account.stage) ? 'pending' : 'not_started',
    achievedDate: null,
    dueDate: account.renewalDate,
  }

  const year1Cycles = account.cycles.filter(c => c.year === 1)
  const selectedCycle = year1Cycles.find(c => c.id === selectedCycleId) ?? null
  const lastSpineAchieved = spineLeft[spineLeft.length - 1]?.status === 'achieved'

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5">
      <div className="text-[12px] font-semibold text-slate-500 uppercase tracking-widest mb-6">
        Customer Journey
      </div>

      {/* Horizontal spine */}
      <div className="flex items-start overflow-x-auto pb-1">
        {spineLeft.map((m, i) => (
          <div key={m.id} className="flex items-start">
            <MilestoneNode m={m} />
            <Connector achieved={i < spineLeft.length - 1 ? spineLeft[i].status === 'achieved' : lastSpineAchieved} />
          </div>
        ))}

        <LoopOrbit
          cycles={year1Cycles}
          selectedCycleId={selectedCycleId}
          onSelectCycle={setSelectedCycleId}
        />

        <div className="flex items-start">
          <Connector achieved={lastSpineAchieved && year1Cycles.some(c => c.status === 'completed')} />
          <MilestoneNode m={renewalMilestone} />
        </div>
      </div>

      {/* Cycle inspector */}
      {selectedCycle && (
        <CycleInspector
          cycle={selectedCycle}
          accountId={account.id}
          onClose={() => setSelectedCycleId(null)}
        />
      )}
    </div>
  )
}
