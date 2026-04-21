import type {
  Account, InflectionPoint, StakeholderMap, Contact, PlayRun, PipelineStageId,
} from '@/types'
import { daysUntil, daysSince, formatCurrency, STAGE_LABELS } from '@/lib/utils'

export type GapType =
  | 'first_value_overdue'
  | 'alignment_meeting_overdue'
  | 'alignment_meeting_approaching'
  | 'goal_progress_stalled'
  | 'stakeholder_gap'
  | 'renewal_risk'

// High   = blocking progression  (must act now)
// Medium = slowing progression   (act this week)
// Low    = optimization          (act this cycle)
export type GapSeverity = 'high' | 'medium' | 'low'

export interface ExecutionGap {
  id: string
  accountId: string
  accountName: string
  stage: PipelineStageId
  arr: number
  gapType: GapType
  actionLabel: string   // verb-first: "Re-engage David Ko at Meridian"
  context: string       // "Advocate · $180K · CFO · Last contact 79d ago · Renewal in 147d"
  severity: GapSeverity
  ageDays: number
  daysToRenewal: number
  linkedInflectionPointId: string | null
  linkedPlayRunId: string | null
  linkedPlayTemplateId: string | null
  linkedStakeholderMapId: string | null
}

export const SEVERITY_ORDER: Record<GapSeverity, number> = { high: 0, medium: 1, low: 2 }

function pipe(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' · ')
}

export function deriveExecutionGaps(
  accounts: Account[],
  inflectionPoints: InflectionPoint[],
  stakeholderMaps: StakeholderMap[],
  contacts: Contact[],
  playRuns: PlayRun[],
): ExecutionGap[] {
  const gaps: ExecutionGap[] = []
  let idx = 0

  for (const account of accounts) {
    const ips     = inflectionPoints.filter(ip => ip.accountId === account.id)
    const maps    = stakeholderMaps.filter(sm => sm.accountId === account.id)
    const runs    = playRuns.filter(r  => r.accountId  === account.id)
    const renewal = daysUntil(account.renewalDate)
    const stage   = STAGE_LABELS[account.stage]
    const arr     = formatCurrency(account.arr)

    // ── Rule 1: First Value overdue ───────────────────────────────────────────
    const fvIP = ips.find(ip => ip.type === 'first_value' && ip.status === 'overdue')
    if (fvIP) {
      const age = fvIP.dueDate ? daysSince(fvIP.dueDate) : account.daysInStage
      gaps.push({
        id: `gap-${++idx}`,
        accountId: account.id, accountName: account.name,
        stage: account.stage, arr: account.arr,
        gapType: 'first_value_overdue',
        actionLabel: `Unblock First Value delivery for ${account.name}`,
        context: pipe(stage, arr, `${age}d overdue`, renewal < 90 ? `Renewal in ${renewal}d` : null),
        severity: 'high',
        ageDays: age, daysToRenewal: renewal,
        linkedInflectionPointId: fvIP.id,
        linkedPlayRunId: null,
        linkedPlayTemplateId: 'tmpl-kickoff',
        linkedStakeholderMapId: null,
      })
    }

    // ── Rule 2: Alignment Meeting overdue or approaching ──────────────────────
    if (['align', 'advocate', 'intent'].includes(account.stage)) {
      const amIP     = ips.find(ip => ip.type === 'alignment_meeting' && ip.status !== 'achieved')
      const activeRun = runs.find(r => r.type === 'alignment_meeting' && r.status === 'in_progress')
      if (amIP?.dueDate) {
        const daysLeft = daysUntil(amIP.dueDate)
        if (daysLeft < 0 || amIP.status === 'overdue') {
          const age = Math.abs(daysLeft)
          gaps.push({
            id: `gap-${++idx}`,
            accountId: account.id, accountName: account.name,
            stage: account.stage, arr: account.arr,
            gapType: 'alignment_meeting_overdue',
            actionLabel: `Run the overdue Alignment Meeting for ${account.name}`,
            context: pipe(stage, arr, `${age}d past due`),
            severity: 'medium',
            ageDays: age, daysToRenewal: renewal,
            linkedInflectionPointId: amIP.id,
            linkedPlayRunId: activeRun?.id ?? null,
            linkedPlayTemplateId: 'tmpl-alignment-meeting',
            linkedStakeholderMapId: null,
          })
        } else if (daysLeft <= 14) {
          gaps.push({
            id: `gap-${++idx}`,
            accountId: account.id, accountName: account.name,
            stage: account.stage, arr: account.arr,
            gapType: 'alignment_meeting_approaching',
            actionLabel: `Generate brief and prepare for Alignment Meeting — ${account.name}`,
            context: pipe(stage, arr, `Due in ${daysLeft}d`, 'AI brief generation recommended'),
            severity: 'low',
            ageDays: 0, daysToRenewal: renewal,
            linkedInflectionPointId: amIP.id,
            linkedPlayRunId: activeRun?.id ?? null,
            linkedPlayTemplateId: 'tmpl-alignment-meeting',
            linkedStakeholderMapId: null,
          })
        }
      }
    }

    // ── Rule 3: Goal progression stalled ─────────────────────────────────────
    if (account.daysInStage > 30) {
      const gpIP = ips.find(ip =>
        ip.type === 'goal_progress' &&
        (ip.status === 'not_started' || ip.status === 'pending')
      )
      if (gpIP) {
        gaps.push({
          id: `gap-${++idx}`,
          accountId: account.id, accountName: account.name,
          stage: account.stage, arr: account.arr,
          gapType: 'goal_progress_stalled',
          actionLabel: `Document and advance goal progress for ${account.name}`,
          context: pipe(stage, arr, `${account.daysInStage}d in stage without recorded progress`, renewal < 90 ? `Renewal in ${renewal}d` : null),
          severity: renewal < 90 ? 'medium' : 'low',
          ageDays: account.daysInStage, daysToRenewal: renewal,
          linkedInflectionPointId: gpIP.id,
          linkedPlayRunId: null,
          linkedPlayTemplateId: 'tmpl-alignment-meeting',
          linkedStakeholderMapId: null,
        })
      }
    }

    // ── Rule 4: Decision maker not engaged ────────────────────────────────────
    const dmGaps = maps.filter(
      sm => sm.influence === 'decision_maker' && sm.coverageStatus !== 'engaged'
    )
    for (const sm of dmGaps) {
      const contact   = contacts.find(c => c.id === sm.contactId)
      const age       = sm.lastContactDate ? daysSince(sm.lastContactDate) : account.daysInStage
      const isDormant = sm.coverageStatus === 'dormant'
      const severity: GapSeverity =
        isDormant && renewal < 60 ? 'high'   :
        isDormant                 ? 'medium' :
                                    'low'
      const name = contact?.name ?? 'decision maker'
      gaps.push({
        id: `gap-${++idx}`,
        accountId: account.id, accountName: account.name,
        stage: account.stage, arr: account.arr,
        gapType: 'stakeholder_gap',
        actionLabel: isDormant
          ? `Re-engage ${name} at ${account.name}`
          : `Establish contact with ${name} at ${account.name}`,
        context: pipe(
          stage, arr,
          contact?.title ?? null,
          isDormant ? `Last contact ${age}d ago` : 'No contact established',
          renewal < 90 ? `Renewal in ${renewal}d` : null,
        ),
        severity,
        ageDays: age, daysToRenewal: renewal,
        linkedInflectionPointId: null,
        linkedPlayRunId: null,
        linkedPlayTemplateId: null,
        linkedStakeholderMapId: sm.id,
      })
    }

    // ── Rule 5: Renewal approaching, no Renew & Grow play active ─────────────
    if (renewal < 90) {
      const hasRenewPlay = runs.some(
        r => r.type === 'renew_grow' && (r.status === 'in_progress' || r.status === 'completed')
      )
      if (!hasRenewPlay) {
        gaps.push({
          id: `gap-${++idx}`,
          accountId: account.id, accountName: account.name,
          stage: account.stage, arr: account.arr,
          gapType: 'renewal_risk',
          actionLabel: `Initiate the Renew & Grow play for ${account.name}`,
          context: pipe(stage, arr, `${renewal}d to renewal`, 'No commercial play active'),
          severity: renewal < 30 ? 'high' : 'medium',
          ageDays: 90 - renewal, daysToRenewal: renewal,
          linkedInflectionPointId: null,
          linkedPlayRunId: null,
          linkedPlayTemplateId: 'tmpl-renew-grow',
          linkedStakeholderMapId: null,
        })
      }
    }
  }

  return gaps.sort((a, b) =>
    SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
    b.ageDays - a.ageDays
  )
}
