import type { AccountView, InflectionPoint, InflectionPointStatus, PlayRun } from '@/types'

export type WorkspaceSource = 'pipeline' | 'inflection-points'
export type WorkspaceFocus = 'pipeline' | 'inflection-points' | 'plays' | 'next-best-actions' | 'stakeholders'

export interface WorkspaceRecommendation {
  focus: WorkspaceFocus
  ctaLabel: string
  reason: string
  source: WorkspaceSource
  targetRunId?: string
}

const INFLECTION_STATUS_RANK: Record<InflectionPointStatus, number> = {
  overdue: 0,
  pending: 1,
  not_started: 2,
  achieved: 3,
}

function getInflectionSortValue(ip: InflectionPoint): number {
  const dueDateScore = ip.dueDate ? new Date(ip.dueDate).getTime() : Number.MAX_SAFE_INTEGER
  return (INFLECTION_STATUS_RANK[ip.status] * 10_000_000_000_000) + dueDateScore
}

function getRelatedPlayRun(account: AccountView, labels: string[]): PlayRun | null {
  const normalizedLabels = labels.map(label => label.toLowerCase())

  const inProgress = account.playRuns.find(run =>
    normalizedLabels.includes(run.label.toLowerCase()) && run.status === 'in_progress'
  )
  if (inProgress) return inProgress

  return account.playRuns.find(run =>
    normalizedLabels.includes(run.label.toLowerCase()) && run.status === 'not_started'
  ) ?? null
}

export function getPrimaryInflectionPoint(account: AccountView): InflectionPoint | null {
  if (account.inflectionPoints.length === 0) return null

  return [...account.inflectionPoints].sort((a, b) => getInflectionSortValue(a) - getInflectionSortValue(b))[0]
}

export function getWorkspaceRecommendation(
  account: AccountView,
  source: WorkspaceSource
): WorkspaceRecommendation {
  const activeRun = account.playRuns.find(run => run.status === 'in_progress')

  if (source === 'pipeline') {
    if (activeRun) {
      return {
        source,
        focus: 'plays',
        ctaLabel: `Continue ${activeRun.label}`,
        reason: `${activeRun.label} is already in progress for this account.`,
        targetRunId: activeRun.id,
      }
    }

    const topAction = account.nextBestActions[0]
    if (topAction?.linkedPlayTemplateId) {
      const relatedRun = account.playRuns.find(
        run => run.playTemplateId === topAction.linkedPlayTemplateId && run.status !== 'completed' && run.status !== 'skipped'
      )

      if (relatedRun) {
        return {
          source,
          focus: 'plays',
          ctaLabel: relatedRun.status === 'not_started' ? `Prepare ${relatedRun.label}` : `Continue ${relatedRun.label}`,
          reason: topAction.reason,
          targetRunId: relatedRun.id,
        }
      }
    }

    if (topAction?.linkedStakeholderMapId) {
      return {
        source,
        focus: 'stakeholders',
        ctaLabel: 'Review stakeholder coverage',
        reason: topAction.reason,
      }
    }

    if (topAction?.linkedInflectionPointId) {
      return {
        source,
        focus: 'inflection-points',
        ctaLabel: 'Review progression blockers',
        reason: topAction.reason,
      }
    }

    return {
      source,
      focus: 'next-best-actions',
      ctaLabel: 'Open account workspace',
      reason: 'Review the account workspace and decide the next move.',
    }
  }

  const primaryIp = getPrimaryInflectionPoint(account)
  if (!primaryIp) {
    return {
      source,
      focus: 'inflection-points',
      ctaLabel: 'Open account workspace',
      reason: 'No inflection points are currently open for this account.',
    }
  }

  if (primaryIp.type === 'alignment_meeting') {
    const relatedRun = getRelatedPlayRun(account, ['Alignment Meeting'])
    if (relatedRun) {
      return {
        source,
        focus: 'plays',
        ctaLabel: relatedRun.status === 'in_progress' ? 'Continue Alignment Meeting' : 'Prepare Alignment Meeting',
        reason: `${primaryIp.label} is the next inflection point to move this account forward.`,
        targetRunId: relatedRun.id,
      }
    }
  }

  if (primaryIp.type === 'stakeholder_coverage') {
    return {
      source,
      focus: 'stakeholders',
      ctaLabel: 'Review stakeholder coverage',
      reason: 'Stakeholder coverage is the key gap blocking progression.',
    }
  }

  return {
    source,
    focus: 'inflection-points',
    ctaLabel: `Review ${primaryIp.label}`,
    reason: `${primaryIp.label} is the most important inflection point to address next.`,
  }
}

export function buildAccountWorkspacePath(
  accountId: string,
  recommendation: WorkspaceRecommendation
): string {
  const params = new URLSearchParams({
    source: recommendation.source,
    focus: recommendation.focus,
  })

  return `/accounts/${accountId}?${params.toString()}`
}
