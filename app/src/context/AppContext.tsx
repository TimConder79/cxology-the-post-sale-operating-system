import { createContext, useContext, useState, type ReactNode } from 'react'
import type {
  Account, Contact, StakeholderMap, InflectionPoint, StageConfidence,
  PlayRun, MeetingBrief, MeetingOutput, NextBestAction, Opportunity, AccountTimeline,
  PipelineStage, PlayTemplate, AccountView, ConfidenceLevel, OutcomeEvidence, PipelineStageId,
  FiveQuestions, BlockStatus, JourneyCycle, AccountHealth,
} from '@/types'

// Supplementary data passed with value_blocks play completions
export interface ValueBlockData {
  blockStatus: BlockStatus
  hasInsightShared: boolean
}
import {
  accounts as seedAccounts,
  contacts as seedContacts,
  stakeholderMaps as seedStakeholderMaps,
  inflectionPoints as seedInflectionPoints,
  stageConfidences as seedStageConfidences,
  playRuns as seedPlayRuns,
  meetingBriefs as seedMeetingBriefs,
  nextBestActions as seedNextBestActions,
  opportunities as seedOpportunities,
  accountTimelines as seedAccountTimelines,
  outcomeEvidence as seedOutcomeEvidence,
  fiveQuestions as seedFiveQuestions,
  journeyCycles as seedJourneyCycles,
  accountHealth as seedAccountHealth,
  pipelineStages,
  playTemplates,
} from '@/data/seedData'

interface AppState {
  accounts: Account[]
  contacts: Contact[]
  stakeholderMaps: StakeholderMap[]
  inflectionPoints: InflectionPoint[]
  journeyCycles: JourneyCycle[]
  stageConfidences: StageConfidence[]
  playRuns: PlayRun[]
  meetingBriefs: MeetingBrief[]
  meetingOutputs: MeetingOutput[]
  nextBestActions: NextBestAction[]
  opportunities: Opportunity[]
  accountTimelines: AccountTimeline[]
  outcomeEvidence: OutcomeEvidence[]
  fiveQuestions: FiveQuestions[]
  accountHealth: AccountHealth[]
}

interface AppContextValue extends AppState {
  // Reference data
  pipelineStages: PipelineStage[]
  playTemplates: PlayTemplate[]

  // Derived getters
  getAccountView: (accountId: string) => AccountView | null
  getPlayRun: (runId: string) => PlayRun | null
  getMeetingBrief: (runId: string) => MeetingBrief | null
  getMeetingOutput: (runId: string) => MeetingOutput | null
  getPlayTemplate: (templateId: string) => PlayTemplate | null
  getActivePlayRun: (accountId: string) => PlayRun | null

  // Mutations
  advancePlayStep: (runId: string, step: 1 | 2 | 3 | 4) => void
  completePlay: (runId: string, output: Omit<MeetingOutput, 'id' | 'playRunId' | 'accountId' | 'capturedAt'>, valueBlockData?: ValueBlockData) => void
  moveOpportunityStage: (oppId: string, newStage: PipelineStageId) => void
  captureFiveQuestions: (runId: string, answers: Omit<FiveQuestions, 'id' | 'accountId' | 'capturedAt' | 'capturedByRunId'>) => void
  setFirstValueStatement: (accountId: string, statement: string) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    accounts: seedAccounts,
    contacts: seedContacts,
    stakeholderMaps: seedStakeholderMaps,
    inflectionPoints: seedInflectionPoints,
    journeyCycles: seedJourneyCycles,
    stageConfidences: seedStageConfidences,
    playRuns: seedPlayRuns,
    meetingBriefs: seedMeetingBriefs,
    meetingOutputs: [],
    nextBestActions: seedNextBestActions,
    opportunities: seedOpportunities,
    accountTimelines: seedAccountTimelines,
    outcomeEvidence: seedOutcomeEvidence,
    fiveQuestions: seedFiveQuestions,
    accountHealth: seedAccountHealth,
  })

  const getAccountView = (accountId: string): AccountView | null => {
    const account = state.accounts.find(a => a.id === accountId)
    if (!account) return null
    const stageConfidence = state.stageConfidences.find(s => s.accountId === accountId && s.stage === account.stage)
    const accountFQs = state.fiveQuestions
      .filter(fq => fq.accountId === accountId)
      .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt))
    return {
      ...account,
      stageConfidence: stageConfidence!,
      inflectionPoints: state.inflectionPoints.filter(ip => ip.accountId === accountId),
      cycles: state.journeyCycles
        .filter(c => c.accountId === accountId)
        .sort((a, b) => a.year - b.year || a.cycleNumber - b.cycleNumber),
      playRuns: state.playRuns.filter(pr => pr.accountId === accountId),
      stakeholderMaps: state.stakeholderMaps.filter(sm => sm.accountId === accountId),
      contacts: state.contacts.filter(c => c.accountId === accountId),
      nextBestActions: state.nextBestActions.filter(nba => nba.accountId === accountId && nba.status === 'active'),
      outcomeEvidence: state.outcomeEvidence.filter(ev => ev.accountId === accountId),
      latestFiveQuestions: accountFQs[0] ?? null,
    }
  }

  const getPlayRun = (runId: string) => state.playRuns.find(r => r.id === runId) ?? null
  const getMeetingBrief = (runId: string) => state.meetingBriefs.find(b => b.playRunId === runId) ?? null
  const getMeetingOutput = (runId: string) => state.meetingOutputs.find(o => o.playRunId === runId) ?? null
  const getPlayTemplate = (templateId: string) => playTemplates.find(t => t.id === templateId) ?? null
  const getActivePlayRun = (accountId: string) =>
    state.playRuns.find(r => r.accountId === accountId && r.status === 'in_progress') ?? null

  const advancePlayStep = (runId: string, step: 1 | 2 | 3 | 4) => {
    setState(s => ({
      ...s,
      playRuns: s.playRuns.map(r => r.id === runId ? { ...r, currentStep: step } : r),
    }))
  }

  const completePlay = (
    runId: string,
    output: Omit<MeetingOutput, 'id' | 'playRunId' | 'accountId' | 'capturedAt'>,
    valueBlockData?: ValueBlockData,
  ) => {
    const run = state.playRuns.find(r => r.id === runId)
    if (!run) return

    const now = new Date().toISOString()
    const outputId = `out-${Date.now()}`
    const newOutput: MeetingOutput = {
      id: outputId,
      playRunId: runId,
      accountId: run.accountId,
      capturedAt: now,
      ...output,
    }

    setState(s => {
      // 1. Complete the play run
      const updatedRuns = s.playRuns.map(r =>
        r.id === runId ? { ...r, status: 'completed' as const, completedAt: now, outputId } : r
      )

      // 2. Mark linked inflection points as achieved
      const updatedIPs = s.inflectionPoints.map(ip => {
        if (ip.accountId !== run.accountId) return ip

        // alignment_meeting: mark alignment_meeting IP + goal_progress on advancement
        if (run.type === 'alignment_meeting' && ip.type === 'alignment_meeting' && ip.status !== 'achieved') {
          return { ...ip, status: 'achieved' as const, achievedDate: now, achievedByRunId: runId }
        }
        if (run.type === 'alignment_meeting' && ip.type === 'goal_progress' && ip.status === 'pending' && output.customerAdvanced) {
          return { ...ip, status: 'achieved' as const, achievedDate: now, achievedByRunId: runId }
        }

        // value_blocks: mark goal_progress if block was completed
        if (run.type === 'value_blocks' && ip.type === 'goal_progress' && ip.status !== 'achieved' && valueBlockData?.blockStatus === 'completed') {
          return { ...ip, status: 'achieved' as const, achievedDate: now, achievedByRunId: runId }
        }
        // value_blocks: mark insight_delivery if an insight was shared with the customer
        if (run.type === 'value_blocks' && ip.type === 'insight_delivery' && ip.status !== 'achieved' && valueBlockData?.hasInsightShared) {
          return { ...ip, status: 'achieved' as const, achievedDate: now, achievedByRunId: runId }
        }

        return ip
      })

      // 3. Update stage confidence
      const updatedConfidences = s.stageConfidences.map(sc => {
        if (sc.accountId !== run.accountId) return sc
        const delta = output.stageConfidenceDelta ?? 0
        const newScore = Math.min(100, Math.max(0, sc.score + delta))
        return {
          ...sc,
          priorScore: sc.score,
          score: newScore,
          trend: (delta > 0 ? 'improving' : delta < 0 ? 'declining' : 'stable') as StageConfidence['trend'],
          updatedAt: now,
          updatedByRunId: runId,
        }
      })

      // 4. Mark the triggering NBA as completed, add new one
      const updatedNBAs = s.nextBestActions.map(nba =>
        nba.accountId === run.accountId && nba.linkedPlayTemplateId === run.playTemplateId
          ? { ...nba, status: 'completed' as const, completedAt: now }
          : nba
      )

      if (output.customerAdvanced && run.type === 'alignment_meeting') {
        updatedNBAs.push({
          id: `nba-${Date.now()}`,
          accountId: run.accountId,
          label: 'Confirm CFO introduction before next alignment cycle',
          reason: 'Customer advanced. CFO engagement is the next critical step before renewal.',
          priority: 'high',
          source: 'rule',
          status: 'active',
          linkedPlayTemplateId: null,
          linkedInflectionPointId: null,
          linkedStakeholderMapId: 'sm-003',
          createdAt: now,
          completedAt: null,
          triggeredByOutputId: outputId,
        })
      }

      if (run.type === 'value_blocks') {
        const blockStatus = valueBlockData?.blockStatus ?? 'in_progress'
        if (blockStatus === 'completed') {
          // Block done — keep the cadence going
          updatedNBAs.push({
            id: `nba-${Date.now()}`,
            accountId: run.accountId,
            label: 'Schedule next Value Block session — maintain the progress cadence',
            reason: 'Block completed. Accounts that sustain a Value Block cadence after First Value are significantly more likely to renew and expand. Don\'t let momentum stall.',
            priority: 'medium',
            source: 'rule',
            status: 'active',
            linkedPlayTemplateId: 'tmpl-value-blocks',
            linkedInflectionPointId: null,
            linkedStakeholderMapId: null,
            createdAt: now,
            completedAt: null,
            triggeredByOutputId: outputId,
          })
        } else if (blockStatus === 'stalled' || blockStatus === 'at_risk') {
          // Block stalled — diagnose and unblock
          updatedNBAs.push({
            id: `nba-${Date.now()}`,
            accountId: run.accountId,
            label: `Value Block ${blockStatus === 'at_risk' ? 'at risk' : 'stalled'} — diagnose and unblock before next session`,
            reason: 'A stalled block is a signal, not a failure. Identify the root cause (skillset, knowledge, cost, demands, or change) and adjust the block or reduce scope before re-engaging.',
            priority: blockStatus === 'at_risk' ? 'high' : 'medium',
            source: 'rule',
            status: 'active',
            linkedPlayTemplateId: 'tmpl-value-blocks',
            linkedInflectionPointId: null,
            linkedStakeholderMapId: null,
            createdAt: now,
            completedAt: null,
            triggeredByOutputId: outputId,
          })
        }
      }

      // 5. Update account progression status
      const updatedAccounts = s.accounts.map(a => {
        if (a.id !== run.accountId) return a
        return output.customerAdvanced ? { ...a, progressionStatus: 'advancing' as const } : a
      })

      // 6. Update opportunity confidence when execution issues are resolved
      // alignment_meeting completed + customer advanced → boost expansion/upsell confidence
      // Any advancement → incrementally improve renewal confidence from low
      const upgrade = (c: ConfidenceLevel): ConfidenceLevel =>
        c === 'low' ? 'medium' : c === 'medium' ? 'high' : 'high'

      const updatedOpportunities = s.opportunities.map(opp => {
        if (opp.accountId !== run.accountId) return opp
        if (!output.customerAdvanced) return opp

        if (run.type === 'alignment_meeting') {
          if (opp.type === 'expansion' || opp.type === 'upsell') {
            return { ...opp, confidence: upgrade(opp.confidence), lastUpdatedAt: now }
          }
          if (opp.type === 'renewal' && opp.confidence === 'low') {
            return { ...opp, confidence: 'medium' as ConfidenceLevel, lastUpdatedAt: now }
          }
        }

        if (run.type === 'first_value' || run.type === 'kickoff') {
          if (opp.type === 'renewal' && opp.confidence === 'low') {
            return { ...opp, confidence: 'medium' as ConfidenceLevel, lastUpdatedAt: now }
          }
        }

        // value_blocks completed → lift renewal confidence + boost expansion readiness
        if (run.type === 'value_blocks' && valueBlockData?.blockStatus === 'completed') {
          if (opp.type === 'expansion' || opp.type === 'upsell') {
            return { ...opp, confidence: upgrade(opp.confidence), lastUpdatedAt: now }
          }
          if (opp.type === 'renewal' && opp.confidence !== 'high') {
            return { ...opp, confidence: upgrade(opp.confidence), lastUpdatedAt: now }
          }
        }

        return opp
      })

      // 7. Capture outcome evidence when customer advanced
      const updatedEvidence = [...s.outcomeEvidence]
      if (output.customerAdvanced && output.goalUpdates.trim()) {
        updatedEvidence.push({
          id: `ev-${Date.now()}`,
          accountId: run.accountId,
          goalTargeted: `${run.label} objectives`,
          outcomeAchieved: output.goalUpdates,
          businessImpact: output.progressionNotes || 'Customer confirmed advancement.',
          capturedAt: now,
          capturedByRunId: runId,
        })
      }

      return {
        ...s,
        accounts: updatedAccounts,
        playRuns: updatedRuns,
        inflectionPoints: updatedIPs,
        stageConfidences: updatedConfidences,
        nextBestActions: updatedNBAs,
        meetingOutputs: [...s.meetingOutputs, newOutput],
        opportunities: updatedOpportunities,
        outcomeEvidence: updatedEvidence,
      }
    })
  }

  const captureFiveQuestions = (
    runId: string,
    answers: Omit<FiveQuestions, 'id' | 'accountId' | 'capturedAt' | 'capturedByRunId'>
  ) => {
    const run = state.playRuns.find(r => r.id === runId)
    if (!run) return
    const newFQ: FiveQuestions = {
      id: `fq-${Date.now()}`,
      accountId: run.accountId,
      capturedAt: new Date().toISOString(),
      capturedByRunId: runId,
      ...answers,
    }
    setState(s => ({ ...s, fiveQuestions: [...s.fiveQuestions, newFQ] }))
  }

  const setFirstValueStatement = (accountId: string, statement: string) => {
    setState(s => ({
      ...s,
      accounts: s.accounts.map(a =>
        a.id === accountId ? { ...a, firstValueStatement: statement } : a
      ),
    }))
  }

  const moveOpportunityStage = (oppId: string, newStage: PipelineStageId) => {
    setState(s => ({
      ...s,
      opportunities: s.opportunities.map(o =>
        o.id === oppId
          ? { ...o, stage: newStage, daysInStage: 0, lastUpdatedAt: new Date().toISOString() }
          : o
      ),
    }))
  }

  return (
    <AppContext.Provider value={{
      ...state,
      pipelineStages,
      playTemplates,
      getAccountView,
      getPlayRun,
      getMeetingBrief,
      getMeetingOutput,
      getPlayTemplate,
      getActivePlayRun,
      advancePlayStep,
      completePlay: completePlay as AppContextValue['completePlay'],
      moveOpportunityStage,
      captureFiveQuestions,
      setFirstValueStatement,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
