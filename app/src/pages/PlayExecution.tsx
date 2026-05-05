import { useState, useEffect, type ReactNode } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, Sparkles, AlertTriangle,
  TrendingUp, CheckCircle2, Circle, Check, RefreshCw,
  MessageSquare, Lightbulb, Layers, ArrowRight,
} from 'lucide-react'
import { useApp } from '@/context/AppContext'
import type { ValueBlockData } from '@/context/AppContext'
import { useAiGeneration } from '@/hooks/useAiGeneration'
import {
  BRIEF_GEN_STEPS, VALUE_BLOCKS_BRIEF_GEN_STEPS, SUMMARY_GEN_STEPS,
  deriveCoachingTips, deriveValueBlocksCoachingTips,
  draftMeetingOutputs, draftValueBlocksOutputs,
  getBriefPrompt, getValueBlocksBriefPrompt, getSummaryPrompt,
} from '@/lib/aiService'
import { formatDate, cn } from '@/lib/utils'
import type { ActionPriority, MeetingBrief, CustomerNeedType, BlockStatus } from '@/types'

// ─── Five Questions types ─────────────────────────────────────────────────────

interface FiveQAnswers {
  q1: string
  q2: string
  q3: string
  q4: string
  q5: string
}

// ─── Value Blocks types & config ──────────────────────────────────────────────

interface ValueBlockState {
  blockName: string
  customerNeedType: CustomerNeedType | ''
  completionEvidence: string
  insightSharedWithCustomer: string
  blockerNotes: string
  nextBlockRecommendation: string
  insightForCompany: string
}

const EMPTY_VALUE_BLOCK: ValueBlockState = {
  blockName: '',
  customerNeedType: '',
  completionEvidence: '',
  insightSharedWithCustomer: '',
  blockerNotes: '',
  nextBlockRecommendation: '',
  insightForCompany: '',
}

const CUSTOMER_NEEDS: { type: CustomerNeedType; label: string; description: string; color: string }[] = [
  { type: 'skillset',  label: 'Skillset',   description: 'Tactical ability to perform the work',          color: 'text-violet-700 bg-violet-50 ring-violet-200' },
  { type: 'knowledge', label: 'Knowledge',  description: 'Information or judgment to make better decisions', color: 'text-blue-700 bg-blue-50 ring-blue-200' },
  { type: 'cost',      label: 'Cost',       description: 'Effort, time, or resources required to proceed',  color: 'text-amber-700 bg-amber-50 ring-amber-200' },
  { type: 'demands',   label: 'Demands',    description: 'Competing priorities preventing action',          color: 'text-orange-700 bg-orange-50 ring-orange-200' },
  { type: 'change',    label: 'Change',     description: 'Ability to create movement inside their org',     color: 'text-emerald-700 bg-emerald-50 ring-emerald-200' },
]

const BLOCK_STATUSES: { status: BlockStatus; label: string; sub: string; selected: string; icon: ReactNode }[] = [
  {
    status: 'completed',
    label: 'Completed',
    sub: 'Block finished — progress made',
    selected: 'border-emerald-500 bg-emerald-50 text-emerald-800',
    icon: <CheckCircle2 size={18} />,
  },
  {
    status: 'in_progress',
    label: 'In Progress',
    sub: 'Work started, not yet done',
    selected: 'border-blue-400 bg-blue-50 text-blue-800',
    icon: <Circle size={18} />,
  },
  {
    status: 'stalled',
    label: 'Stalled',
    sub: 'Progress has stopped — investigate',
    selected: 'border-amber-400 bg-amber-50 text-amber-800',
    icon: <AlertTriangle size={18} />,
  },
  {
    status: 'at_risk',
    label: 'At Risk',
    sub: 'Block in danger of failing entirely',
    selected: 'border-red-400 bg-red-50 text-red-800',
    icon: <AlertTriangle size={18} />,
  },
]

// ─── Step bar ─────────────────────────────────────────────────────────────────

const STEPS = [
  { n: 1, label: 'Preparation',       sub: 'AI-generated brief'   },
  { n: 2, label: 'Interaction Guide', sub: 'Structured agenda'     },
  { n: 3, label: 'Output Capture',    sub: 'Structured outputs'    },
  { n: 4, label: 'Progression',       sub: 'Advance the pipeline'  },
] as const

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-start">
      {STEPS.map((step, i) => {
        const done   = step.n < current
        const active = step.n === current
        return (
          <div key={step.n} className="flex items-start flex-1">
            <div className="flex-1">
              <div className={cn('flex items-center gap-2 px-3 py-2 rounded-lg', active && 'bg-brand-50')}>
                <div className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold transition-colors',
                  done   ? 'bg-emerald-500 text-white' :
                  active ? 'bg-brand-600 text-white ring-4 ring-brand-100' :
                           'bg-slate-200 text-slate-400'
                )}>
                  {done ? <Check size={10} strokeWidth={3} /> : step.n}
                </div>
                <div>
                  <div className={cn(
                    'text-[12px] font-semibold leading-none',
                    active ? 'text-brand-800' : done ? 'text-emerald-700' : 'text-slate-400'
                  )}>
                    {step.label}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{step.sub}</div>
                </div>
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn('h-px w-6 mt-4 flex-shrink-0', done ? 'bg-emerald-300' : 'bg-slate-200')} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Primitives ───────────────────────────────────────────────────────────────

function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('bg-white rounded-xl border border-slate-200', className)}>{children}</div>
}

function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <div className="flex items-center gap-1 mb-3">
      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{children}</span>
      {required && <span className="text-red-400 text-[11px] font-bold">*</span>}
    </div>
  )
}

function AiBadge({ label = 'AI generated' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded-md">
      <Sparkles size={9} />
      {label}
    </span>
  )
}

function PriorityDot({ priority }: { priority: ActionPriority }) {
  return (
    <span className={cn(
      'w-1.5 h-1.5 rounded-full flex-shrink-0 mt-[5px]',
      priority === 'high' ? 'bg-red-500' : priority === 'medium' ? 'bg-amber-400' : 'bg-slate-300'
    )} />
  )
}

// ─── AI generation loading panel ─────────────────────────────────────────────

function GeneratingPanel({ stepLabel, stepIndex, totalSteps, genSteps, title = 'Generating meeting brief' }: {
  stepLabel: string
  stepIndex: number
  totalSteps: number
  genSteps: { label: string; ms: number }[]
  title?: string
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
          <Sparkles size={14} className="text-brand-600 animate-pulse" />
        </div>
        <div>
          <div className="text-[13px] font-semibold text-slate-800">{title}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{stepLabel}…</div>
        </div>
      </div>

      {/* Step indicators */}
      <div className="space-y-2.5">
        {genSteps.map((step, i) => {
          const done    = i < stepIndex
          const current = i === stepIndex
          return (
            <div key={i} className="flex items-center gap-2.5">
              <div className={cn(
                'w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all',
                done    ? 'bg-emerald-500 text-white' :
                current ? 'bg-brand-100 ring-2 ring-brand-400 ring-offset-1' :
                          'bg-slate-100'
              )}>
                {done && <Check size={8} strokeWidth={3} className="text-white" />}
                {current && <div className="w-1.5 h-1.5 rounded-full bg-brand-600 animate-pulse" />}
              </div>
              <span className={cn(
                'text-[12px] transition-colors',
                done    ? 'text-emerald-700 line-through decoration-emerald-300' :
                current ? 'text-brand-700 font-medium' :
                          'text-slate-300'
              )}>
                {step.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Progress bar */}
      <div className="mt-5 h-1 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-400 rounded-full transition-all duration-700"
          style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
        />
      </div>
    </Card>
  )
}

// ─── Step 1: Preparation brief ────────────────────────────────────────────────

function StepPreparation({
  brief, accountName, arr, stage, genState, genStepIndex, genStepLabel,
  genSteps, isValueBlocks, onGenerate, onRegenerate,
}: {
  brief: MeetingBrief | null
  accountName: string
  arr: number
  stage: string
  genState: 'idle' | 'generating' | 'done'
  genStepIndex: number
  genStepLabel: string
  genSteps: { label: string; ms: number }[]
  isValueBlocks: boolean
  onGenerate: () => void
  onRegenerate: () => void
}) {
  // Track which sections have faded in after generation completes
  const [revealed, setRevealed] = useState(0)

  useEffect(() => {
    if (genState !== 'done' || !brief) { setRevealed(0); return }
    const sections = 5
    for (let i = 0; i < sections; i++) {
      setTimeout(() => setRevealed(r => Math.max(r, i + 1)), i * 120)
    }
  }, [genState, brief])

  // Idle: show context summary + generate button
  if (genState === 'idle') {
    return (
      <div className="space-y-4">
        {/* Account context preview — what the AI will use */}
        <Card className="p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="text-[13px] font-semibold text-slate-800">{accountName}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{stage} stage · {arr.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} ARR</div>
            </div>
            <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-md ring-1 ring-slate-200 flex-shrink-0">
              Context loaded
            </span>
          </div>
          <div className="text-[11px] text-slate-400 bg-slate-50 rounded-lg p-3 font-mono leading-relaxed">
            <div className="text-slate-300 mb-1">// Prompt context</div>
            <div className="text-slate-500 whitespace-pre-wrap">
              {isValueBlocks
                ? getValueBlocksBriefPrompt(accountName, stage, arr)
                : getBriefPrompt(accountName, stage, arr)
              }
            </div>
          </div>
        </Card>

        <button
          onClick={onGenerate}
          className="w-full flex items-center justify-center gap-2.5 bg-brand-600 hover:bg-brand-700 text-white text-[13px] font-semibold py-3.5 rounded-xl transition-colors shadow-sm"
        >
          <Sparkles size={15} />
          {isValueBlocks ? 'Generate Block Recommendation Brief' : 'Generate Meeting Brief'}
        </button>

        <p className="text-center text-[11px] text-slate-400">
          {isValueBlocks
            ? 'Uses Five Questions, First Value, goal progress, and block history'
            : 'Uses account context, goal progress, risks, and expansion signals'
          }
        </p>
      </div>
    )
  }

  // Generating
  if (genState === 'generating') {
    return (
      <GeneratingPanel
        stepLabel={genStepLabel}
        stepIndex={genStepIndex}
        totalSteps={genSteps.length}
        genSteps={genSteps}
        title={isValueBlocks ? 'Generating block recommendation brief' : 'Generating meeting brief'}
      />
    )
  }

  // Done — reveal content
  if (!brief) return null

  const sectionClass = (n: number) => cn(
    'transition-all duration-500',
    revealed >= n ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
  )

  return (
    <div className="space-y-4">
      {/* Header with regenerate */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AiBadge label="Generated · just now" />
        </div>
        <button
          onClick={onRegenerate}
          className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-700 transition-colors"
        >
          <RefreshCw size={11} />
          Regenerate
        </button>
      </div>

      <div className={sectionClass(1)}>
        <Card className="p-5">
          <FieldLabel>Customer Summary</FieldLabel>
          <p className="text-[13px] text-slate-700 leading-relaxed">{brief.customerSummary}</p>
        </Card>
      </div>

      <div className={sectionClass(2)}>
        <Card className="p-5">
          <FieldLabel>Goal & Value Progress</FieldLabel>
          <p className="text-[13px] text-slate-700 leading-relaxed">{brief.goalProgress}</p>
        </Card>
      </div>

      <div className={sectionClass(3)}>
        <Card className="bg-red-50 border-red-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={13} className="text-red-500 flex-shrink-0" />
            <FieldLabel>Risks to Address</FieldLabel>
          </div>
          <ul className="space-y-3">
            {brief.risks.map(r => (
              <li key={r.id} className="flex items-start gap-2">
                <PriorityDot priority={r.priority} />
                <span className="text-[13px] text-red-900 leading-snug">{r.text}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className={sectionClass(4)}>
        <Card className="bg-emerald-50 border-emerald-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={13} className="text-emerald-600 flex-shrink-0" />
            <FieldLabel>Expansion Signals</FieldLabel>
          </div>
          <ul className="space-y-3">
            {brief.expansionSignals.map(s => (
              <li key={s.id} className="flex items-start gap-2">
                <PriorityDot priority={s.priority} />
                <span className="text-[13px] text-emerald-900 leading-snug">{s.text}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className={sectionClass(5)}>
        <Card className="bg-brand-50 border-brand-100 p-5">
          <FieldLabel>Recommended Focus for This Meeting</FieldLabel>
          <ul className="space-y-3">
            {brief.recommendedFocus.map((f, i) => (
              <li key={f.id} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-brand-600 text-white text-[9px] font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span className="text-[13px] text-brand-900 leading-snug">{f.text}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}

// ─── Step 2: Interaction Guide (with AI coaching) ─────────────────────────────

function StepInteraction({
  guide,
  brief,
  accountName,
  isValueBlocks,
}: {
  guide: ReturnType<typeof useApp>['playTemplates'][number]['interactionGuide']
  brief: MeetingBrief | null
  accountName: string
  isValueBlocks: boolean
}) {
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const toggle = (i: number) =>
    setChecked(s => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n })

  const [tipsVisible, setTipsVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setTipsVisible(true), 200); return () => clearTimeout(t) }, [])

  const tips = brief
    ? (isValueBlocks ? deriveValueBlocksCoachingTips(brief, accountName) : deriveCoachingTips(brief, accountName))
    : []

  return (
    <div className="space-y-4">
      {/* AI Coaching panel — account-specific tips derived from the brief */}
      {tips.length > 0 && (
        <div className={cn(
          'rounded-xl border border-brand-200 bg-brand-50 p-5 transition-all duration-500',
          tipsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        )}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-md bg-white ring-1 ring-brand-200 flex items-center justify-center flex-shrink-0">
              <Lightbulb size={12} className="text-brand-600" />
            </div>
            <span className="text-[12px] font-semibold text-brand-800">AI coaching — for this meeting</span>
            <AiBadge label="Derived from brief" />
          </div>
          <div className="space-y-3">
            {tips.map((tip, i) => (
              <div key={tip.id} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-brand-200 text-brand-700 text-[9px] font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <p className="text-[12px] text-brand-900 leading-relaxed">{tip.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agenda */}
      <Card className="p-5">
        <FieldLabel>Meeting Agenda</FieldLabel>
        <ol className="space-y-2.5">
          {guide.agenda.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-[13px] text-slate-700">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-50 ring-1 ring-brand-200 text-brand-700 text-[10px] font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              {item}
            </li>
          ))}
        </ol>
      </Card>

      {/* Required components checklist */}
      <Card className="p-5">
        <FieldLabel>Required Components</FieldLabel>
        <div className="space-y-1">
          {guide.requiredComponents.map((item, i) => (
            <button
              key={i}
              onClick={() => toggle(i)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left"
            >
              <div className={cn(
                'w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ring-1 transition-all',
                checked.has(i) ? 'bg-emerald-500 ring-emerald-500' : 'ring-slate-300 bg-white'
              )}>
                {checked.has(i) && <Check size={10} strokeWidth={3} className="text-white" />}
              </div>
              <span className={cn(
                'text-[13px] transition-colors',
                checked.has(i) ? 'text-slate-400 line-through' : 'text-slate-700'
              )}>
                {item}
              </span>
            </button>
          ))}
        </div>
      </Card>

      {/* Key questions — with AI context callouts */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <FieldLabel>Key Questions</FieldLabel>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 -mt-3">
            <MessageSquare size={10} />
            Ask all five
          </div>
        </div>
        <ul className="space-y-3">
          {guide.keyQuestions.map((q, i) => (
            <li key={i} className="group">
              <div className="flex items-start gap-2.5 text-[13px] text-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 flex-shrink-0 mt-[5px]" />
                {q}
              </div>
              {/* Account-specific context note on specific questions */}
              {i === 0 && brief && (
                <div className="ml-4 mt-1.5 pl-3 border-l-2 border-brand-200">
                  <p className="text-[11px] text-brand-600 leading-relaxed">
                    <span className="font-semibold">Context:</span> Ask about the cross-department visibility workstream specifically — this is the goal that currently has no owner.
                  </p>
                </div>
              )}
              {i === 3 && brief && (
                <div className="ml-4 mt-1.5 pl-3 border-l-2 border-amber-200">
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    <span className="font-semibold">Prompt:</span> "Have you introduced David Ko to our work together yet?" — this opens the door to the CFO intro without you having to ask directly.
                  </p>
                </div>
              )}
            </li>
          ))}
        </ul>
      </Card>

      {guide.stakeholderTalkingPoints.length > 0 && (
        <Card className="p-5">
          <FieldLabel>Stakeholder Talking Points</FieldLabel>
          <ul className="space-y-2">
            {guide.stakeholderTalkingPoints.map((tp, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[13px] text-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0 mt-[5px]" />
                {tp}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}

// ─── Step 3: Output Capture (with AI draft) ───────────────────────────────────

interface OutputState {
  meetingSummary: string
  goalUpdates: string
  stakeholderNotes: string
  risksOpportunities: string
  progressionNotes: string
}

function StepOutputs({
  outputs,
  onChange,
  brief,
  accountName,
  draftState,
  onDraft,
  aiDraftedFields,
}: {
  outputs: OutputState
  onChange: (key: keyof OutputState, value: string) => void
  brief: MeetingBrief | null
  accountName: string
  draftState: 'idle' | 'generating' | 'done'
  onDraft: () => void
  aiDraftedFields: Set<keyof OutputState>
}) {
  const hasSummary  = outputs.meetingSummary.trim().length >= 10
  const canDraft    = hasSummary && draftState === 'idle' && brief !== null
  const isDrafting  = draftState === 'generating'

  const fields: { key: keyof OutputState; label: string; placeholder: string; required: boolean; rows: number }[] = [
    { key: 'meetingSummary',      label: 'Meeting Summary',                  placeholder: 'What was discussed and agreed?',                            required: true,  rows: 4 },
    { key: 'goalUpdates',         label: 'Goal & Value Progress',            placeholder: 'What changed? Evidence of progress or regression?',        required: true,  rows: 4 },
    { key: 'stakeholderNotes',    label: 'Stakeholder Notes',                placeholder: 'Changes in contacts, influence, or engagement',            required: false, rows: 3 },
    { key: 'risksOpportunities',  label: 'Risks & Opportunities Identified', placeholder: 'New risks surfaced or expansion signals identified',       required: false, rows: 3 },
    { key: 'progressionNotes',    label: 'Next Steps & Commitments',         placeholder: 'What was committed to? Who owns what by when?',            required: true,  rows: 4 },
  ]

  return (
    <div className="space-y-4">
      {/* Meeting summary — user fills this first */}
      <Card className="p-5">
        <FieldLabel required>Meeting Summary</FieldLabel>
        <textarea
          rows={4}
          value={outputs.meetingSummary}
          onChange={e => onChange('meetingSummary', e.target.value)}
          placeholder="What was discussed and agreed? Write rough notes — AI will help structure the rest."
          className="w-full text-[13px] text-slate-700 placeholder-slate-300 resize-none focus:outline-none leading-relaxed"
        />
        {!hasSummary && (
          <p className="text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-100">
            Enter meeting notes above — AI will draft the remaining fields once you start.
          </p>
        )}
      </Card>

      {/* AI draft trigger — appears once summary has content */}
      {hasSummary && (
        <div className={cn(
          'transition-all duration-300',
          hasSummary ? 'opacity-100' : 'opacity-0'
        )}>
          {draftState === 'idle' && (
            <button
              onClick={onDraft}
              disabled={!canDraft}
              className="w-full flex items-center justify-center gap-2 bg-brand-50 hover:bg-brand-100 border border-brand-200 hover:border-brand-300 text-brand-700 text-[13px] font-semibold py-3 rounded-xl transition-all"
            >
              <Sparkles size={14} />
              Draft remaining outputs with AI
            </button>
          )}

          {draftState === 'generating' && (
            <div className="bg-brand-50 border border-brand-200 rounded-xl p-4">
              <div className="flex items-center gap-2.5 mb-3">
                <Sparkles size={13} className="text-brand-600 animate-pulse" />
                <span className="text-[12px] font-semibold text-brand-700">Drafting outputs…</span>
              </div>
              <div className="space-y-2">
                {SUMMARY_GEN_STEPS.map((step, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px] text-brand-500">
                    <div className="w-1 h-1 rounded-full bg-brand-400 animate-pulse" />
                    {step.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {draftState === 'done' && (
            <div className="flex items-center justify-between px-1">
              <AiBadge label="Outputs drafted — review and edit before completing" />
              <button
                onClick={onDraft}
                className="text-[11px] text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
              >
                <RefreshCw size={10} />
                Re-draft
              </button>
            </div>
          )}
        </div>
      )}

      {/* Prompt preview — collapsed by default */}
      {hasSummary && brief && (
        <details className="group">
          <summary className="text-[11px] text-slate-400 cursor-pointer hover:text-slate-600 flex items-center gap-1.5 transition-colors list-none">
            <span className="group-open:hidden">▶</span>
            <span className="hidden group-open:inline">▼</span>
            View AI prompt
          </summary>
          <div className="mt-2 text-[11px] text-slate-500 bg-slate-50 rounded-lg p-3 font-mono leading-relaxed border border-slate-200">
            <div className="text-slate-300 mb-1">// Draft prompt</div>
            <div className="whitespace-pre-wrap">{getSummaryPrompt(accountName, outputs.meetingSummary)}</div>
          </div>
        </details>
      )}

      {/* Remaining output fields */}
      {fields.slice(1).map(f => (
        <Card key={f.key} className={cn('p-5 transition-all duration-300', aiDraftedFields.has(f.key) ? 'ring-1 ring-brand-200' : '')}>
          <div className="flex items-center justify-between mb-3">
            <FieldLabel required={f.required}>{f.label}</FieldLabel>
            {aiDraftedFields.has(f.key) && !isDrafting && (
              <AiBadge label="AI draft · editable" />
            )}
          </div>
          <textarea
            rows={f.rows}
            value={outputs[f.key]}
            onChange={e => onChange(f.key, e.target.value)}
            placeholder={isDrafting ? 'Drafting…' : f.placeholder}
            disabled={isDrafting}
            className={cn(
              'w-full text-[13px] resize-none focus:outline-none leading-relaxed transition-colors',
              isDrafting ? 'text-slate-300 placeholder-slate-200' : 'text-slate-700 placeholder-slate-300'
            )}
          />
        </Card>
      ))}
    </div>
  )
}

// ─── Value Block Capture ──────────────────────────────────────────────────────

function ValueBlockSection({
  state,
  onChange,
}: {
  state: ValueBlockState
  onChange: (key: keyof ValueBlockState, value: string) => void
}) {
  const hasInsight = state.insightSharedWithCustomer.trim().length > 0

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-2.5 pt-2">
        <div className="w-6 h-6 rounded-md bg-brand-600 flex items-center justify-center flex-shrink-0">
          <Layers size={12} className="text-white" />
        </div>
        <div>
          <div className="text-[13px] font-semibold text-slate-900">Value Block</div>
          <div className="text-[11px] text-slate-400">
            Capture the block, need type, progress, and insight — these power the next recommendation.
          </div>
        </div>
      </div>

      {/* Block name */}
      <Card className="p-5">
        <FieldLabel required>Value Block Selected</FieldLabel>
        <textarea
          rows={2}
          value={state.blockName}
          onChange={e => onChange('blockName', e.target.value)}
          placeholder="Name the specific block worked — be concrete. Not 'adoption work' but 'configured the weekly team dashboard with the ops lead'"
          className="w-full text-[13px] text-slate-700 placeholder-slate-300 resize-none focus:outline-none leading-relaxed"
        />
      </Card>

      {/* Customer need type */}
      <Card className="p-5">
        <FieldLabel required>Need Being Addressed</FieldLabel>
        <p className="text-[11px] text-slate-400 mb-3 -mt-1">
          What type of gap is this block solving? This diagnosis shapes whether training, enablement, stakeholder coaching, or scope reduction is the right response.
        </p>
        <div className="grid grid-cols-1 gap-2">
          {CUSTOMER_NEEDS.map(need => (
            <button
              key={need.type}
              onClick={() => onChange('customerNeedType', need.type)}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-lg border text-left transition-all',
                state.customerNeedType === need.type
                  ? 'border-brand-400 bg-brand-50'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              )}
            >
              <div className={cn(
                'w-4 h-4 rounded-full ring-2 flex-shrink-0 transition-all',
                state.customerNeedType === need.type ? 'bg-brand-600 ring-brand-600' : 'bg-white ring-slate-300'
              )} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'text-[11px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ring-1',
                    state.customerNeedType === need.type ? need.color : 'text-slate-500 bg-slate-50 ring-slate-200'
                  )}>
                    {need.label}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">{need.description}</div>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Completion evidence */}
      <Card className="p-5">
        <FieldLabel required>Evidence of Progress</FieldLabel>
        <textarea
          rows={4}
          value={state.completionEvidence}
          onChange={e => onChange('completionEvidence', e.target.value)}
          placeholder="What was accomplished? Or what specifically remains — name the open items and who owns each one."
          className="w-full text-[13px] text-slate-700 placeholder-slate-300 resize-none focus:outline-none leading-relaxed"
        />
      </Card>

      {/* Insight shared with customer — fires insight_delivery IP */}
      <Card className={cn('p-5 transition-all duration-300', hasInsight ? 'ring-1 ring-emerald-300 border-emerald-200' : '')}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <FieldLabel>Insight Shared with Customer</FieldLabel>
          {hasInsight && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md ring-1 ring-emerald-200 flex-shrink-0 -mt-0.5">
              <CheckCircle2 size={9} />
              Marks Insight Delivery
            </span>
          )}
        </div>
        {!hasInsight && (
          <p className="text-[11px] text-slate-400 mb-3 -mt-1 flex items-center gap-1">
            <ArrowRight size={10} />
            Filling this marks the Insight Delivery inflection point as achieved.
          </p>
        )}
        <textarea
          rows={3}
          value={state.insightSharedWithCustomer}
          onChange={e => onChange('insightSharedWithCustomer', e.target.value)}
          placeholder="What pattern, finding, benchmark, or risk did you surface for the customer during this session?"
          className="w-full text-[13px] text-slate-700 placeholder-slate-300 resize-none focus:outline-none leading-relaxed"
        />
      </Card>

      {/* Blockers (always visible, optional) */}
      <Card className="p-5">
        <FieldLabel>Blockers or Friction</FieldLabel>
        <p className="text-[11px] text-slate-400 mb-3 -mt-1">
          Anything that slowed or blocked this block — even partially. Patterns here feed the block library and help the next CSM.
        </p>
        <textarea
          rows={2}
          value={state.blockerNotes}
          onChange={e => onChange('blockerNotes', e.target.value)}
          placeholder="e.g. Champion couldn't secure the right stakeholder in time. Configuration step required IT approval we didn't anticipate."
          className="w-full text-[13px] text-slate-700 placeholder-slate-300 resize-none focus:outline-none leading-relaxed"
        />
      </Card>

      {/* Next block recommendation */}
      <Card className="p-5 ring-1 ring-brand-100">
        <div className="flex items-center gap-2 mb-1">
          <ArrowRight size={13} className="text-brand-500" />
          <FieldLabel required>Next Block</FieldLabel>
        </div>
        <p className="text-[11px] text-slate-400 mb-3 ml-[21px]">
          Name it specifically — the customer should leave knowing exactly what comes next. Not "more work on goal X" but the actual block.
        </p>
        <textarea
          rows={2}
          value={state.nextBlockRecommendation}
          onChange={e => onChange('nextBlockRecommendation', e.target.value)}
          placeholder="e.g. Finance Ops pre-engagement session — 45 minutes with Aisha Torres to walk through the reporting automation outcome and map it to her team's pain."
          className="w-full text-[13px] text-slate-700 placeholder-slate-300 resize-none focus:outline-none leading-relaxed"
        />
      </Card>

      {/* Internal learning */}
      <Card className="p-5">
        <FieldLabel>Internal Learning</FieldLabel>
        <p className="text-[11px] text-slate-400 mb-3 -mt-1">
          Product gap, training gap, stakeholder pattern, common blocker — what should the team know from this session?
        </p>
        <textarea
          rows={2}
          value={state.insightForCompany}
          onChange={e => onChange('insightForCompany', e.target.value)}
          placeholder="e.g. The cross-dept visibility goal consistently stalls at the internal change step — customers need a stakeholder coaching asset to move this forward."
          className="w-full text-[13px] text-slate-700 placeholder-slate-300 resize-none focus:outline-none leading-relaxed"
        />
      </Card>
    </div>
  )
}

// ─── Value Block Progression (Step 4 for value_blocks) ────────────────────────

function StepValueBlockProgression({
  blockStatus,
  onBlockStatus,
  delta,
  onDelta,
}: {
  blockStatus: BlockStatus | null
  onBlockStatus: (s: BlockStatus) => void
  delta: number
  onDelta: (n: number) => void
}) {
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <FieldLabel>Block Status</FieldLabel>
        <p className="text-[11px] text-slate-400 mb-4 -mt-1">
          Every block should have a clear status. This is how the operating system knows where the customer is making progress and where it needs to respond.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {BLOCK_STATUSES.map(({ status, label, sub, selected, icon }) => (
            <button
              key={status}
              onClick={() => {
                onBlockStatus(status)
                // Auto-suggest a confidence delta based on status
                if (status === 'completed')   onDelta(12)
                if (status === 'in_progress') onDelta(4)
                if (status === 'stalled')     onDelta(-5)
                if (status === 'at_risk')     onDelta(-10)
              }}
              className={cn(
                'py-4 px-3 rounded-xl border-2 text-left transition-all',
                blockStatus === status
                  ? selected + ' shadow-sm'
                  : 'border-slate-200 text-slate-400 hover:border-slate-300 hover:bg-slate-50'
              )}
            >
              <div className={cn(
                'mb-1.5',
                blockStatus === status ? '' : 'text-slate-300'
              )}>
                {icon}
              </div>
              <div className="text-[13px] font-semibold leading-none mb-1">{label}</div>
              <div className="text-[10px] leading-snug opacity-70">{sub}</div>
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <FieldLabel>Stage confidence adjustment</FieldLabel>
        <div className="flex items-center gap-4 mt-1">
          <input
            type="range" min="-20" max="20" step="2"
            value={delta}
            onChange={e => onDelta(Number(e.target.value))}
            className="flex-1 accent-brand-600 cursor-pointer"
          />
          <div className={cn(
            'text-[16px] font-bold tabular-nums w-14 text-right',
            delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-red-500' : 'text-slate-400'
          )}>
            {delta > 0 ? `+${delta}` : delta === 0 ? '±0' : delta}
          </div>
        </div>
        <p className="text-[11px] text-slate-400 mt-2">
          Auto-suggested based on block status — adjust if the session warrants it.
        </p>
      </Card>
    </div>
  )
}

// ─── Five Questions Capture (kickoff plays) ───────────────────────────────────

const FIVE_Q_DEFS = [
  {
    key: 'q1' as const,
    label: 'What is the one thing we must get right to make this worth undertaking?',
    placeholder: 'The single most critical outcome — the thing that, if it doesn\'t happen, the whole effort fails…',
  },
  {
    key: 'q2' as const,
    label: 'How does your organization define success?',
    placeholder: 'In their own language — what does success mean to this customer, to their team, to their leadership?',
  },
  {
    key: 'q3' as const,
    label: 'What is our role in achieving that success?',
    placeholder: 'What are we specifically responsible for? Where does the customer\'s ownership begin?',
  },
  {
    key: 'q4' as const,
    label: 'What aspects of the internal culture or external environment could put this effort at risk to fail?',
    placeholder: 'Internal politics, competing priorities, past failed initiatives, market pressures, resource constraints…',
  },
  {
    key: 'q5' as const,
    label: 'Assuming we mitigate that risk, what would exceed your wildest dreams?',
    placeholder: 'If everything goes better than expected — what does that look like? What would they brag about?',
  },
]

function FiveQuestionsSection({
  answers,
  onChange,
  firstValue,
  onFirstValue,
}: {
  answers: FiveQAnswers
  onChange: (key: keyof FiveQAnswers, value: string) => void
  firstValue: string
  onFirstValue: (v: string) => void
}) {
  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-2.5 pt-2">
        <div className="w-6 h-6 rounded-md bg-brand-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-[10px] font-bold">5Q</span>
        </div>
        <div>
          <div className="text-[13px] font-semibold text-slate-900">Five Questions</div>
          <div className="text-[11px] text-slate-400">
            Capture the customer's goals in their own language — these travel through the entire relationship.
          </div>
        </div>
      </div>

      {/* Q1–Q5 */}
      {FIVE_Q_DEFS.map((q, i) => (
        <Card key={q.key} className="p-5">
          <div className="flex items-start gap-2.5 mb-3">
            <div className="w-5 h-5 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-brand-600 text-[10px] font-bold">{i + 1}</span>
            </div>
            <FieldLabel>{q.label}</FieldLabel>
          </div>
          <textarea
            rows={3}
            value={answers[q.key]}
            onChange={e => onChange(q.key, e.target.value)}
            placeholder={q.placeholder}
            className="w-full text-[13px] text-slate-700 placeholder-slate-300 resize-none focus:outline-none leading-relaxed"
          />
        </Card>
      ))}

      {/* First Value Statement */}
      <Card className="p-5 ring-1 ring-brand-100">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp size={13} className="text-brand-500" />
          <FieldLabel required>First Value Statement</FieldLabel>
        </div>
        <p className="text-[11px] text-slate-400 mb-3 ml-[21px]">
          A single customer-language sentence — what does this customer need to achieve first, and by when? This surfaces on the account workspace and anchors the first_value inflection point.
        </p>
        <textarea
          rows={3}
          value={firstValue}
          onChange={e => onFirstValue(e.target.value)}
          placeholder="e.g. Reduce patient intake processing time by 40% within 90 days of go-live, measured by the IT team's weekly throughput report."
          className="w-full text-[13px] text-slate-700 placeholder-slate-300 resize-none focus:outline-none leading-relaxed"
        />
      </Card>
    </div>
  )
}

// ─── Step 4: Progression ──────────────────────────────────────────────────────

function StepProgression({
  advanced, onAdvanced, delta, onDelta,
}: {
  advanced: boolean | null
  onAdvanced: (v: boolean) => void
  delta: number
  onDelta: (n: number) => void
}) {
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <FieldLabel>Did the customer advance toward the next stage?</FieldLabel>
        <div className="grid grid-cols-2 gap-3 mt-1">
          <button
            onClick={() => onAdvanced(true)}
            className={cn(
              'py-5 rounded-xl border-2 text-[13px] font-semibold transition-all',
              advanced === true
                ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm'
                : 'border-slate-200 text-slate-400 hover:border-emerald-300 hover:text-emerald-700'
            )}
          >
            <CheckCircle2 size={20} className={cn('mx-auto mb-2', advanced === true ? 'text-emerald-500' : 'text-slate-200')} />
            Yes — advanced
          </button>
          <button
            onClick={() => onAdvanced(false)}
            className={cn(
              'py-5 rounded-xl border-2 text-[13px] font-semibold transition-all',
              advanced === false
                ? 'border-amber-400 bg-amber-50 text-amber-800 shadow-sm'
                : 'border-slate-200 text-slate-400 hover:border-amber-300 hover:text-amber-700'
            )}
          >
            <Circle size={20} className={cn('mx-auto mb-2', advanced === false ? 'text-amber-400' : 'text-slate-200')} />
            No — still progressing
          </button>
        </div>
      </Card>

      <Card className="p-5">
        <FieldLabel>Stage confidence adjustment</FieldLabel>
        <div className="flex items-center gap-4 mt-1">
          <input
            type="range" min="-20" max="20" step="2"
            value={delta}
            onChange={e => onDelta(Number(e.target.value))}
            className="flex-1 accent-brand-600 cursor-pointer"
          />
          <div className={cn(
            'text-[16px] font-bold tabular-nums w-14 text-right',
            delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-red-500' : 'text-slate-400'
          )}>
            {delta > 0 ? `+${delta}` : delta === 0 ? '±0' : delta}
          </div>
        </div>
        <p className="text-[11px] text-slate-400 mt-2">
          Positive = customer is tracking toward advancement. Will be applied to stage confidence score.
        </p>
      </Card>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PlayExecution() {
  const { id, runId } = useParams()
  const navigate = useNavigate()
  const { getPlayRun, getMeetingBrief, getPlayTemplate, getAccountView, advancePlayStep, completePlay, captureFiveQuestions, setFirstValueStatement } = useApp()

  // Derive run type early so hooks receive the right steps
  const run        = getPlayRun(runId!)
  const isValueBlocks = run?.type === 'value_blocks'
  const brief      = getMeetingBrief(runId!)
  const template   = run ? getPlayTemplate(run.playTemplateId) : null
  const accountView = id ? getAccountView(id) : null

  // ── AI: Brief generation (Step 1) — steps vary by play type ──
  const briefGenSteps = isValueBlocks ? VALUE_BLOCKS_BRIEF_GEN_STEPS : BRIEF_GEN_STEPS
  const briefGen = useAiGeneration(briefGenSteps, { autoTrigger: false })

  // ── AI: Summary draft (Step 3) ──
  const summaryGen = useAiGeneration(SUMMARY_GEN_STEPS)
  const [aiDraftedFields, setAiDraftedFields] = useState<Set<keyof OutputState>>(new Set())

  // ── Standard form state ──
  const [currentStep, setCurrentStep] = useState<1|2|3|4>((run?.currentStep ?? 1) as 1|2|3|4)
  const [outputs, setOutputs] = useState<OutputState>({
    meetingSummary: '',
    goalUpdates: '',
    stakeholderNotes: '',
    risksOpportunities: '',
    progressionNotes: '',
  })
  const [advanced, setAdvanced] = useState<boolean | null>(null)
  const [delta, setDelta] = useState(8)

  // ── Five Questions state (kickoff plays only) ──
  const [fiveQAnswers, setFiveQAnswers] = useState<FiveQAnswers>({ q1: '', q2: '', q3: '', q4: '', q5: '' })
  const [firstValueText, setFirstValueText] = useState('')

  // ── Value Blocks state ──
  const [valueBlockState, setValueBlockState] = useState<ValueBlockState>(EMPTY_VALUE_BLOCK)
  const [blockStatus, setBlockStatus] = useState<BlockStatus | null>(null)

  if (!run || !template || !accountView) return <div className="p-8 text-slate-500">Play not found.</div>

  const goToStep = (step: 1|2|3|4) => {
    setCurrentStep(step)
    advancePlayStep(run.id, step)
  }

  const handleDraftOutputs = () => {
    if (!brief) return
    summaryGen.trigger()
    const totalMs = SUMMARY_GEN_STEPS.reduce((s, step) => s + step.ms, 0)
    setTimeout(() => {
      if (!brief) return
      const drafted = isValueBlocks
        ? draftValueBlocksOutputs(brief, accountView.name, outputs.meetingSummary, valueBlockState.blockName)
        : draftMeetingOutputs(brief, accountView.name, outputs.meetingSummary)
      setOutputs(prev => ({
        ...prev,
        goalUpdates:        prev.goalUpdates        || drafted.goalUpdates,
        stakeholderNotes:   prev.stakeholderNotes   || drafted.stakeholderNotes,
        progressionNotes:   prev.progressionNotes   || drafted.progressionNotes,
      }))
      setAiDraftedFields(new Set(['goalUpdates', 'stakeholderNotes', 'progressionNotes']))
    }, totalMs + 100)
  }

  const handleComplete = () => {
    // For kickoff plays: persist Five Questions and First Value Statement
    if (run.type === 'kickoff') {
      if (advanced === null) return
      const hasAnyAnswer = Object.values(fiveQAnswers).some(v => v.trim().length > 0)
      if (hasAnyAnswer) captureFiveQuestions(run.id, fiveQAnswers)
      if (firstValueText.trim()) setFirstValueStatement(run.accountId, firstValueText.trim())
    }

    // For first_value plays: update the First Value Statement if filled
    if (run.type === 'first_value' && firstValueText.trim()) {
      setFirstValueStatement(run.accountId, firstValueText.trim())
    }

    // For value_blocks: use blockStatus-aware completion
    if (run.type === 'value_blocks') {
      if (blockStatus === null) return
      const isComplete = blockStatus === 'completed'
      const vbData: ValueBlockData = {
        blockStatus,
        hasInsightShared: valueBlockState.insightSharedWithCustomer.trim().length > 0,
      }
      completePlay(run.id, {
        meetingSummary:       outputs.meetingSummary || `${valueBlockState.blockName} — ${blockStatus.replace('_', ' ')}`,
        goalUpdates:          valueBlockState.completionEvidence || outputs.goalUpdates,
        stakeholderNotes:     outputs.stakeholderNotes,
        risksOpportunities:   [valueBlockState.blockerNotes, valueBlockState.insightSharedWithCustomer]
                                .filter(Boolean).join('\n\n') || outputs.risksOpportunities,
        customerAdvanced:     isComplete,
        stageConfidenceDelta: delta,
        progressionNotes:     valueBlockState.nextBlockRecommendation || outputs.progressionNotes,
      }, vbData)
      navigate(`/accounts/${id}`)
      return
    }

    if (advanced === null) return

    completePlay(run.id, {
      meetingSummary:       outputs.meetingSummary,
      goalUpdates:          outputs.goalUpdates,
      stakeholderNotes:     outputs.stakeholderNotes,
      risksOpportunities:   outputs.risksOpportunities,
      customerAdvanced:     advanced,
      stageConfidenceDelta: advanced ? delta : Math.min(0, delta),
      progressionNotes:     outputs.progressionNotes,
    })
    navigate(`/accounts/${id}`)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex-shrink-0 px-8 h-[60px] flex items-center border-b border-slate-100 bg-white">
        <button
          onClick={() => navigate(`/accounts/${id}`)}
          className="flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-slate-700 transition-colors"
        >
          <ChevronLeft size={14} />
          Back to account
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto px-8 py-6">

          {/* Play header */}
          <div className="mb-6">
            <div className="flex items-center gap-2.5 mb-0.5">
              <div className="w-7 h-7 rounded-lg bg-brand-100 ring-1 ring-brand-200 flex items-center justify-center flex-shrink-0">
                <Sparkles size={13} className="text-brand-600" />
              </div>
              <h1 className="text-[20px] font-bold text-slate-900 tracking-tight">{run.label}</h1>
            </div>
            <div className="flex items-center gap-2 ml-9">
              <span className="text-[12px] text-slate-400">{accountView.name}</span>
              {run.scheduledDate && (
                <>
                  <span className="text-slate-200">·</span>
                  <span className="text-[12px] text-slate-400">Scheduled {formatDate(run.scheduledDate)}</span>
                </>
              )}
            </div>
          </div>

          {/* Step bar */}
          <div className="mb-8">
            <StepBar current={currentStep} />
          </div>

          {/* Step content */}
          <div className="mb-8">
            {currentStep === 1 && (
              <StepPreparation
                brief={brief}
                accountName={accountView.name}
                arr={accountView.arr}
                stage={accountView.stage}
                genState={briefGen.state}
                genStepIndex={briefGen.stepIndex}
                genStepLabel={briefGen.stepLabel}
                genSteps={briefGenSteps}
                isValueBlocks={isValueBlocks}
                onGenerate={briefGen.trigger}
                onRegenerate={() => { briefGen.reset(); setTimeout(briefGen.trigger, 50) }}
              />
            )}
            {currentStep === 2 && (
              <StepInteraction
                guide={template.interactionGuide}
                brief={brief}
                accountName={accountView.name}
                isValueBlocks={isValueBlocks}
              />
            )}
            {currentStep === 3 && (
              <div className="space-y-6">
                {/* Value Blocks capture — value_blocks plays */}
                {run.type === 'value_blocks' && (
                  <ValueBlockSection
                    state={valueBlockState}
                    onChange={(k, v) => setValueBlockState(p => ({ ...p, [k]: v }))}
                  />
                )}

                {/* Five Questions — kickoff plays only */}
                {run.type === 'kickoff' && (
                  <FiveQuestionsSection
                    answers={fiveQAnswers}
                    onChange={(k, v) => setFiveQAnswers(p => ({ ...p, [k]: v }))}
                    firstValue={firstValueText}
                    onFirstValue={setFirstValueText}
                  />
                )}

                {/* First Value Statement only — for first_value plays */}
                {run.type === 'first_value' && (
                  <Card className="p-5 ring-1 ring-brand-100">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp size={13} className="text-brand-500" />
                      <FieldLabel required>First Value Statement</FieldLabel>
                    </div>
                    <p className="text-[11px] text-slate-400 mb-3 ml-[21px]">
                      Confirm or update the customer's first value statement now that first value has been achieved.
                    </p>
                    <textarea
                      rows={3}
                      value={firstValueText}
                      onChange={e => setFirstValueText(e.target.value)}
                      placeholder="e.g. Reduced patient intake processing time by 40% within 90 days — confirmed by the IT team's weekly throughput report."
                      className="w-full text-[13px] text-slate-700 placeholder-slate-300 resize-none focus:outline-none leading-relaxed"
                    />
                  </Card>
                )}

                {/* Divider before standard meeting outputs */}
                {(run.type === 'kickoff' || run.type === 'first_value' || run.type === 'value_blocks') && (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-slate-100" />
                    <span className="text-[10px] text-slate-300 uppercase tracking-widest">Meeting Notes</span>
                    <div className="flex-1 h-px bg-slate-100" />
                  </div>
                )}

                <StepOutputs
                  outputs={outputs}
                  onChange={(k, v) => setOutputs(p => ({ ...p, [k]: v }))}
                  brief={brief}
                  accountName={accountView.name}
                  draftState={summaryGen.state}
                  onDraft={handleDraftOutputs}
                  aiDraftedFields={aiDraftedFields}
                />
              </div>
            )}
            {currentStep === 4 && run.type === 'value_blocks' && (
              <StepValueBlockProgression
                blockStatus={blockStatus}
                onBlockStatus={s => { setBlockStatus(s) }}
                delta={delta}
                onDelta={setDelta}
              />
            )}
            {currentStep === 4 && run.type !== 'value_blocks' && (
              <StepProgression
                advanced={advanced}
                onAdvanced={setAdvanced}
                delta={delta}
                onDelta={setDelta}
              />
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button
              onClick={() =>
                currentStep > 1
                  ? goToStep((currentStep - 1) as 1|2|3|4)
                  : navigate(`/accounts/${id}`)
              }
              className="flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-slate-700 transition-colors px-3 py-2 rounded-lg hover:bg-slate-50"
            >
              <ChevronLeft size={14} />
              {currentStep === 1 ? 'Back to account' : `Back to ${STEPS[currentStep - 2].label}`}
            </button>

            {currentStep < 4 ? (
              <button
                onClick={() => goToStep((currentStep + 1) as 1|2|3|4)}
                className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-[13px] font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm"
              >
                {STEPS[currentStep as 1|2|3]?.label}
                <ChevronRight size={14} />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={run.type === 'value_blocks' ? blockStatus === null : advanced === null}
                className={cn(
                  'flex items-center gap-2 text-[13px] font-semibold px-5 py-2.5 rounded-xl transition-all shadow-sm',
                  (run.type === 'value_blocks' ? blockStatus !== null : advanced !== null)
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                )}
              >
                <CheckCircle2 size={15} />
                Complete Play
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
