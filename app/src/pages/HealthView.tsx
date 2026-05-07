import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Heart, TrendingUp, TrendingDown, Minus, ChevronRight, ChevronDown,
  AlertTriangle, CheckCircle2, AlertCircle, ArrowUpRight,
} from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { buildAccountWorkspacePath, getWorkspaceRecommendation } from '@/lib/accountRouting'
import { formatCurrency, daysUntil, cn } from '@/lib/utils'
import type { AccountHealth, HealthBand, HealthTrend, HealthDimensionId, HealthSignalStatus } from '@/types'

// ─── Config ───────────────────────────────────────────────────────────────────

const BAND: Record<HealthBand, {
  label: string; sub: string
  ring: string; bg: string; text: string; bar: string
  badge: string; headerBg: string
}> = {
  healthy:  {
    label: 'Healthy',  sub: 'On track',
    ring: 'ring-emerald-200', bg: 'bg-emerald-50',  text: 'text-emerald-700', bar: 'bg-emerald-400',
    badge: 'text-emerald-700 bg-emerald-50 ring-emerald-200',
    headerBg: 'bg-emerald-500',
  },
  at_risk:  {
    label: 'At Risk',  sub: 'Needs attention',
    ring: 'ring-amber-200',   bg: 'bg-amber-50',    text: 'text-amber-700',   bar: 'bg-amber-400',
    badge: 'text-amber-700 bg-amber-50 ring-amber-200',
    headerBg: 'bg-amber-400',
  },
  critical: {
    label: 'Critical', sub: 'Act immediately',
    ring: 'ring-red-200',     bg: 'bg-red-50',      text: 'text-red-700',     bar: 'bg-red-500',
    badge: 'text-red-700 bg-red-50 ring-red-200',
    headerBg: 'bg-red-500',
  },
}

const DIM_LABEL: Record<HealthDimensionId, string> = {
  usage:        'Usage',
  engagement:   'Engagement',
  outcomes:     'Outcomes',
  relationship: 'Relationship',
}

const DIM_WEIGHT: Record<HealthDimensionId, string> = {
  usage:        '30%',
  engagement:   '25%',
  outcomes:     '30%',
  relationship: '15%',
}

const SIGNAL_STATUS: Record<HealthSignalStatus, { icon: string; color: string }> = {
  met:     { icon: '✓', color: 'text-emerald-500' },
  partial: { icon: '~', color: 'text-amber-500' },
  unmet:   { icon: '✕', color: 'text-red-500' },
}

const TREND_ICON = {
  improving: <TrendingUp  size={12} className="text-emerald-500" />,
  stable:    <Minus       size={12} className="text-slate-400"   />,
  declining: <TrendingDown size={12} className="text-red-400"    />,
}

// ─── Score ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score, band }: { score: number; band: HealthBand }) {
  const r    = 30
  const circ = 2 * Math.PI * r
  const fill = (score / 100) * circ
  const color = band === 'healthy' ? '#10b981' : band === 'at_risk' ? '#f59e0b' : '#ef4444'
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" className="flex-shrink-0">
      <circle cx="40" cy="40" r={r} fill="none" stroke="#f1f5f9" strokeWidth="7" />
      <circle
        cx="40" cy="40" r={r} fill="none"
        stroke={color} strokeWidth="7"
        strokeDasharray={`${fill} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 40 40)"
      />
      <text x="40" y="44" textAnchor="middle" fontSize="18" fontWeight="700" fill={color}>
        {score}
      </text>
    </svg>
  )
}

// ─── Dimension bar ────────────────────────────────────────────────────────────

function DimBar({
  id, score, trend, isExpanded, onToggle,
}: {
  id: HealthDimensionId; score: number; trend: HealthTrend
  isExpanded: boolean; onToggle: () => void
}) {
  const dimBand: HealthBand = score >= 70 ? 'healthy' : score >= 40 ? 'at_risk' : 'critical'
  return (
    <button
      onClick={onToggle}
      className="w-full text-left group/dim hover:bg-slate-50 rounded px-1 -mx-1 transition-colors"
    >
      <div className="flex items-center gap-2 mb-0.5">
        <span className="text-[10px] font-medium text-slate-500 w-[74px] flex-shrink-0">{DIM_LABEL[id]}</span>
        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', BAND[dimBand].bar)}
            style={{ width: `${score}%` }}
          />
        </div>
        <span className={cn('text-[11px] font-semibold tabular-nums w-7 text-right', BAND[dimBand].text)}>
          {score}
        </span>
        <span className="flex-shrink-0">{TREND_ICON[trend]}</span>
        <ChevronDown
          size={11}
          className={cn('text-slate-300 transition-transform flex-shrink-0', isExpanded && 'rotate-180')}
        />
      </div>
    </button>
  )
}

// ─── Account health card ──────────────────────────────────────────────────────

function AccountHealthCard({
  health, accountName, accountArr, renewalDate, workspaceHref,
}: {
  health: AccountHealth
  accountName: string
  accountArr: number
  renewalDate: string
  workspaceHref: string
}) {
  const [expandedDim, setExpandedDim] = useState<HealthDimensionId | null>(null)
  const renewal = daysUntil(renewalDate)
  const cfg     = BAND[health.band]

  const toggleDim = (id: HealthDimensionId) =>
    setExpandedDim(prev => prev === id ? null : id)

  return (
    <div className={cn(
      'bg-white rounded-xl border border-slate-200 overflow-hidden',
      'hover:shadow-md transition-all duration-200',
    )}>
      {/* Band accent bar */}
      <div className={cn('h-1', cfg.headerBg)} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start gap-4 mb-4">
          {/* Score ring */}
          <ScoreRing score={health.compositeScore} band={health.band} />

          {/* Account info */}
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <h3 className="text-[14px] font-semibold text-slate-900 leading-snug">{accountName}</h3>
              <Link
                to={workspaceHref}
                className="flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-2 py-1 rounded-lg transition-colors flex-shrink-0"
              >
                Workspace <ArrowUpRight size={10} />
              </Link>
            </div>

            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={cn('inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ring-1', cfg.badge)}>
                {cfg.label}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                {TREND_ICON[health.trend]}
                <span className="capitalize">{health.trend}</span>
              </span>
              <span className="text-[10px] text-slate-300">·</span>
              <span className="text-[11px] text-slate-400">{formatCurrency(accountArr)} ARR</span>
              <span className="text-[10px] text-slate-300">·</span>
              <span className={cn('text-[11px] font-medium', renewal < 60 ? 'text-red-500' : 'text-slate-400')}>
                {renewal < 0 ? 'Renewal overdue' : `Renewal in ${renewal}d`}
                {renewal < 60 && renewal >= 0 && <AlertTriangle size={10} className="inline ml-1 mb-0.5" />}
              </span>
            </div>

            {/* Dimension bars */}
            <div className="space-y-1.5">
              {health.dimensions.map(dim => (
                <div key={dim.id}>
                  <DimBar
                    id={dim.id}
                    score={dim.score}
                    trend={dim.trend}
                    isExpanded={expandedDim === dim.id}
                    onToggle={() => toggleDim(dim.id)}
                  />

                  {/* Expanded signal detail */}
                  {expandedDim === dim.id && (
                    <div className="mt-2 mb-1 bg-slate-50 rounded-lg border border-slate-100 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                          {DIM_LABEL[dim.id]} · {DIM_WEIGHT[dim.id]} of composite score
                        </span>
                      </div>
                      <div className="space-y-2.5">
                        {dim.signals.map(sig => {
                          const sc = SIGNAL_STATUS[sig.status]
                          return (
                            <div key={sig.id} className="flex items-start gap-2">
                              <span className={cn('text-[13px] font-bold mt-0.5 flex-shrink-0 w-3', sc.color)}>
                                {sc.icon}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-[12px] font-semibold text-slate-800">{sig.label}</span>
                                  <span className={cn('text-[10px] font-bold tabular-nums', sc.color)}>{sig.score}</span>
                                </div>
                                <p className="text-[11px] text-slate-500 leading-relaxed">{sig.detail}</p>
                                {sig.action && sig.status !== 'met' && (
                                  <div className="mt-1.5 bg-white rounded border border-slate-200 px-2 py-1.5">
                                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide block mb-0.5">
                                      Recommended action
                                    </span>
                                    <p className="text-[11px] font-medium text-slate-700 leading-snug">{sig.action}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Summary stat ─────────────────────────────────────────────────────────────

function Stat({ label, value, sub, valueClass }: {
  label: string; value: string | number; sub?: string; valueClass?: string
}) {
  return (
    <div className="text-right">
      <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">{label}</div>
      <div className={cn('text-[18px] font-bold leading-none mt-0.5', valueClass ?? 'text-slate-700')}>
        {value}
      </div>
      {sub && <div className="text-[10px] text-slate-400 mt-0.5">{sub}</div>}
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function BandFilter({
  value, onChange,
}: {
  value: HealthBand | 'all'; onChange: (v: HealthBand | 'all') => void
}) {
  const options: Array<{ value: HealthBand | 'all'; label: string }> = [
    { value: 'all',      label: 'All accounts' },
    { value: 'critical', label: 'Critical' },
    { value: 'at_risk',  label: 'At Risk' },
    { value: 'healthy',  label: 'Healthy' },
  ]
  return (
    <div className="flex items-center gap-1">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors',
            value === opt.value
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN VIEW
// ═══════════════════════════════════════════════════════════════

export function HealthView() {
  const { accounts, accountHealth, opportunities, getAccountView } = useApp()
  const [bandFilter, setBandFilter] = useState<HealthBand | 'all'>('all')

  // Build workspace hrefs
  const workspaceHrefByAccountId = accounts.reduce<Record<string, string>>((acc, account) => {
    const view = getAccountView(account.id)
    if (view) {
      const rec = getWorkspaceRecommendation(view, 'pipeline')
      acc[account.id] = buildAccountWorkspacePath(account.id, rec)
    } else {
      acc[account.id] = `/accounts/${account.id}`
    }
    return acc
  }, {})

  // Summary stats
  const critical  = accountHealth.filter(h => h.band === 'critical')
  const atRisk    = accountHealth.filter(h => h.band === 'at_risk')
  const healthy   = accountHealth.filter(h => h.band === 'healthy')
  const improving = accountHealth.filter(h => h.trend === 'improving')

  const criticalArr = opportunities
    .filter(o => critical.some(h => h.accountId === o.accountId))
    .reduce((s, o) => s + o.estimatedValue, 0)

  const avgScore = accountHealth.length
    ? Math.round(accountHealth.reduce((s, h) => s + h.compositeScore, 0) / accountHealth.length)
    : 0

  // Filter + sort (worst first by default)
  const filtered = accountHealth
    .filter(h => bandFilter === 'all' || h.band === bandFilter)
    .sort((a, b) => a.compositeScore - b.compositeScore)

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="flex-shrink-0 px-8 h-[60px] flex items-center justify-between border-b border-slate-100 bg-white">
        <div>
          <h1 className="text-[15px] font-semibold text-slate-900">Health Scoring</h1>
          <p className="text-[12px] text-slate-400 mt-0.5">
            Four-dimension early-warning system — Usage, Engagement, Outcomes, Relationship
          </p>
        </div>

        <div className="flex items-center gap-5">
          {critical.length > 0 && (
            <Stat
              label="Critical"
              value={critical.length}
              sub={formatCurrency(criticalArr) + ' ARR'}
              valueClass="text-red-600"
            />
          )}
          {atRisk.length > 0 && (
            <Stat
              label="At Risk"
              value={atRisk.length}
              valueClass="text-amber-600"
            />
          )}
          {healthy.length > 0 && (
            <Stat
              label="Healthy"
              value={healthy.length}
              valueClass="text-emerald-600"
            />
          )}
          <div className="border-l border-slate-100 pl-5">
            <Stat
              label="Portfolio Avg"
              value={avgScore}
              sub={`${improving.length} improving`}
            />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex-shrink-0 border-b border-slate-100 bg-white px-8 h-[48px] flex items-center justify-between">
        <BandFilter value={bandFilter} onChange={setBandFilter} />
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <Heart size={11} />
          <span>Sorted worst-first · Click any dimension bar to expand signals</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex-shrink-0 bg-slate-50 border-b border-slate-100 px-8 py-2 flex items-center gap-6">
        {(
          [
            { icon: <CheckCircle2 size={11} className="text-emerald-500" />, label: 'Met — signal is healthy' },
            { icon: <AlertCircle  size={11} className="text-amber-500"   />, label: 'Partial — attention needed' },
            { icon: <AlertTriangle size={11} className="text-red-500"    />, label: 'Unmet — action required' },
          ] as const
        ).map(({ icon, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            {icon}
            <span className="text-[10px] text-slate-500">{label}</span>
          </div>
        ))}
        <div className="flex-1" />
        <div className="flex items-center gap-4 text-[10px] text-slate-400">
          <span className="flex items-center gap-1">{TREND_ICON.improving} Improving</span>
          <span className="flex items-center gap-1">{TREND_ICON.stable}    Stable</span>
          <span className="flex items-center gap-1">{TREND_ICON.declining} Declining</span>
        </div>
      </div>

      {/* Score cards */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-8 py-6 space-y-4">

          {/* Critical banner if any critical accounts */}
          {bandFilter === 'all' && critical.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3 flex items-center gap-3">
              <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />
              <p className="text-[12px] font-semibold text-red-700">
                {critical.length} account{critical.length !== 1 ? 's' : ''} in critical health —
                {' '}{formatCurrency(criticalArr)} ARR at risk. These accounts require immediate intervention.
              </p>
              <button
                onClick={() => setBandFilter('critical')}
                className="ml-auto flex items-center gap-1 text-[11px] font-semibold text-red-600 hover:text-red-800 bg-white hover:bg-red-50 px-2.5 py-1.5 rounded-lg ring-1 ring-red-200 transition-colors flex-shrink-0"
              >
                Show only critical <ChevronRight size={11} />
              </button>
            </div>
          )}

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Heart size={24} className="text-slate-200 mb-3" />
              <p className="text-[13px] font-semibold text-slate-500">No accounts match this filter</p>
            </div>
          )}

          {filtered.map(health => {
            const account = accounts.find(a => a.id === health.accountId)
            if (!account) return null
            return (
              <AccountHealthCard
                key={health.id}
                health={health}
                accountName={account.name}
                accountArr={account.arr}
                renewalDate={account.renewalDate}
                workspaceHref={workspaceHrefByAccountId[account.id] ?? `/accounts/${account.id}`}
              />
            )
          })}

          {/* Dimension weight explainer */}
          <div className="bg-white rounded-xl border border-slate-100 px-5 py-4 mt-6">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Composite Score — How it's calculated
            </p>
            <div className="grid grid-cols-4 gap-4">
              {(
                [
                  { id: 'usage',        label: 'Usage',        weight: 30, desc: 'Active rate, feature depth, session frequency, department coverage' },
                  { id: 'engagement',   label: 'Engagement',   weight: 25, desc: 'Meeting cadence, champion responsiveness, executive participation' },
                  { id: 'outcomes',     label: 'Outcomes',     weight: 30, desc: 'First value, goal progress, ROI articulation, outcome evidence' },
                  { id: 'relationship', label: 'Relationship', weight: 15, desc: 'Executive sponsor, decision maker access, champion stability, multi-threading' },
                ] as const
              ).map(dim => (
                <div key={dim.id} className="text-center">
                  <div className="text-[18px] font-bold text-slate-700 leading-none">{dim.weight}%</div>
                  <div className="text-[11px] font-semibold text-slate-600 mt-0.5">{dim.label}</div>
                  <div className="text-[10px] text-slate-400 mt-1 leading-relaxed">{dim.desc}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
