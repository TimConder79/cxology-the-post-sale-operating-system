import type { MeetingBrief } from '@/types'

// ─── Generation steps ─────────────────────────────────────────────────────────
// Defines the step-by-step labels shown during AI generation.
// In production each step corresponds to a distinct Claude API call or retrieval.

export interface GenStep {
  label: string
  ms: number
}

export const BRIEF_GEN_STEPS: GenStep[] = [
  { label: 'Pulling account context',           ms: 550 },
  { label: 'Reviewing goals and value progress', ms: 700 },
  { label: 'Identifying risks and signals',      ms: 750 },
  { label: 'Drafting meeting brief',             ms: 650 },
]

export const VALUE_BLOCKS_BRIEF_GEN_STEPS: GenStep[] = [
  { label: 'Loading account objective and Five Questions', ms: 500 },
  { label: 'Reviewing First Value and block history',      ms: 650 },
  { label: 'Diagnosing likely customer need type',         ms: 700 },
  { label: 'Recommending next Value Blocks',               ms: 750 },
]

export const SUMMARY_GEN_STEPS: GenStep[] = [
  { label: 'Reading your meeting notes', ms: 500 },
  { label: 'Structuring outputs',        ms: 700 },
  { label: 'Drafting next steps',        ms: 600 },
]

export function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

// ─── Coaching tips ────────────────────────────────────────────────────────────
// Derives 3 account-specific coaching tips from the brief.
// No async needed — derived from already-loaded data.
// In production: a fast Claude call with brief + account snapshot as input.

export interface CoachingTip {
  id: string
  text: string
  linkedRiskId?: string
  linkedSignalId?: string
}

export function deriveCoachingTips(brief: MeetingBrief, accountName: string): CoachingTip[] {
  const tips: CoachingTip[] = []

  // Lead with momentum, not problems
  tips.push({
    id: 'tip-1',
    text: `Open by naming the win before the gap. Reference ${accountName}'s reporting automation progress — anchoring in success makes the harder conversations easier to have.`,
  })

  // Address the highest-priority risk with accountability
  const topRisk = brief.risks.find(r => r.priority === 'high')
  if (topRisk) {
    tips.push({
      id: 'tip-2',
      text: `Don't leave the meeting without an owner and a date on the cross-department visibility goal. Unowned milestones don't move — assign accountability before you close the agenda.`,
      linkedRiskId: topRisk.id,
    })
  }

  // Expansion timing guidance
  const topSignal = brief.expansionSignals.find(s => s.priority === 'high')
  if (topSignal) {
    tips.push({
      id: 'tip-3',
      text: `Introduce the Finance Ops opportunity only after resolving the current goal gaps. Raising expansion while primary goals are incomplete sends the wrong signal about your priorities.`,
      linkedSignalId: topSignal.id,
    })
  }

  // Stakeholder coverage tip if no expansion signal
  if (tips.length < 3) {
    tips.push({
      id: 'tip-4',
      text: `Ask James Whitfield to facilitate the CFO introduction in this session — a verbal commitment in the room is far more likely to follow through than an email ask afterward.`,
    })
  }

  return tips.slice(0, 3)
}

// ─── Draft outputs ────────────────────────────────────────────────────────────
// Generates structured draft content for the Output Capture step.
// Takes user's rough notes + brief context → returns polished structured fields.
// In production: Claude API call with brief + user notes as input.

export interface DraftedOutputs {
  goalUpdates: string
  stakeholderNotes: string
  progressionNotes: string
}

export function draftMeetingOutputs(
  brief: MeetingBrief,
  accountName: string,
  userNotes: string,
): DraftedOutputs {
  // Parse any numbers from userNotes if they exist, otherwise use brief defaults
  const progressMatch = userNotes.match(/(\d{1,3})%/)
  const progressValue = progressMatch ? progressMatch[1] : '52'

  const goalUpdates =
    `Reporting automation: Updated to ${progressValue}% complete (was 40% at last check-in). Ahead of revised estimate; tracking toward 60% target by end of quarter.

Cross-department visibility: Owner assigned in this session. Milestone and completion target to be set by May 1. This goal is now active.

Both primary goals are progressing. Value evidence is present for the reporting automation goal. Cross-department goal needs a milestone before next check-in.`

  const stakeholderNotes =
    `James Whitfield (VP Operations): Engaged. Committed to facilitating CFO introduction by May 12.

David Ko (CFO): Introduction scheduled via James Whitfield for May 12. No direct contact yet — follow up after intro is made.

Aisha Torres (Finance Ops): Identified as new contact through this conversation. Add to stakeholder map and initiate outreach once CFO engagement is confirmed.`

  const topFocus = brief.recommendedFocus
    .filter(f => f.priority === 'high')
    .map(f => `• ${f.text}`)
    .join('\n')

  const progressionNotes =
    `Commitments from this session:
• James Whitfield to introduce CFO David Ko by May 12
• New goal owner to present cross-department visibility plan by May 1
• ${accountName} team to confirm adoption metrics before next check-in

Next steps:
• Schedule next Alignment Meeting in 30 days
• CSM to follow up on CFO intro by May 14 if not confirmed
• Begin stakeholder outreach to Aisha Torres after CFO intro

${topFocus}`

  return { goalUpdates, stakeholderNotes, progressionNotes }
}

// ─── Value Blocks coaching tips ───────────────────────────────────────────────
// Derives account-specific coaching tips for the Value Blocks interaction guide.
// Focus shifts from alignment tactics to block execution tactics.

export function deriveValueBlocksCoachingTips(brief: MeetingBrief, accountName: string): CoachingTip[] {
  const tips: CoachingTip[] = []

  // Framing: open with the objective, not the block
  tips.push({
    id: 'vb-tip-1',
    text: `Open by naming ${accountName}'s larger objective before introducing the block. "We're here to move the cross-department visibility goal forward" lands better than "today we're running a Value Block session." Purpose before process.`,
  })

  // Execution: active not passive
  const topRisk = brief.risks.find(r => r.priority === 'high')
  if (topRisk) {
    tips.push({
      id: 'vb-tip-2',
      text: `The highest-risk gap today is an internal change problem — no owner on a key goal. Don't try to solve this for them. Guide Priya to name the owner in the room. A commitment made by the customer lands ten times harder than a recommendation made by you.`,
      linkedRiskId: topRisk.id,
    })
  }

  // Insight delivery: make it specific
  const insightSignal = brief.expansionSignals.find(s => s.priority === 'high')
  if (insightSignal) {
    tips.push({
      id: 'vb-tip-3',
      text: `When you share the adoption insight, lead with the data point, not the interpretation. "Usage spiked 35% in March — here's what that means for where your team is heading" is more credible than "you're doing great." Let the data make the case.`,
      linkedSignalId: insightSignal.id,
    })
  }

  // Close with the next block
  if (tips.length < 3) {
    tips.push({
      id: 'vb-tip-4',
      text: `End the session by naming the next block — don't leave it open. "Based on today, the next block I'd recommend is X — does that feel right?" gives the customer a path forward and gives you a reason to meet again that isn't manufactured.`,
    })
  }

  return tips.slice(0, 3)
}

// ─── Value Blocks draft outputs ───────────────────────────────────────────────
// Drafts standard meeting output fields in the context of a Value Blocks session.
// In production: Claude call with block context + user notes as input.

export function draftValueBlocksOutputs(
  brief: MeetingBrief,
  _accountName: string,
  userNotes: string,
  blockName: string,
): DraftedOutputs {
  const goalUpdates =
    `${blockName || 'Value Block'} session completed. ${userNotes.trim() ? `CSM notes: "${userNotes.trim().slice(0, 120)}${userNotes.length > 120 ? '…' : ''}"` : ''}

Based on this session, the cross-department visibility goal now has a nominated internal owner. Reporting automation continues to progress — current estimate is ahead of revised target. Both primary goals are active and assigned.`

  const stakeholderNotes =
    `Priya Nair (Director of IT, champion): Engaged and driving the internal change conversation. Nominated a department head to own the cross-department visibility goal in this session — follow up to confirm within 5 days.

James Whitfield (VP Operations): Not present in this session. Priya to brief him on the new goal ownership before the next alignment cycle.`

  const topFocus = brief.recommendedFocus
    .filter(f => f.priority === 'high')
    .slice(0, 2)
    .map(f => `• ${f.text.slice(0, 100)}`)
    .join('\n')

  const progressionNotes =
    `Block completed. Immediate follow-ups:
• Confirm the new goal owner has been briefed and has accepted the milestone by May 20
• Send adoption insight summary to Priya for internal circulation
• Propose Finance Ops pre-engagement block as the next session — position as knowledge transfer, not expansion motion

${topFocus}`

  return { goalUpdates, stakeholderNotes, progressionNotes }
}

// ─── Prompt metadata ──────────────────────────────────────────────────────────
// In production these are the actual prompts sent to Claude.
// Exposed here so engineers can inspect and tune them.

export function getBriefPrompt(accountName: string, stage: string, arr: number): string {
  return `You are a Customer Success AI assistant preparing a CSM for an Alignment Meeting.

Account: ${accountName}
Pipeline stage: ${stage}
ARR: $${arr.toLocaleString()}

Using the account's goal progress, inflection point history, stakeholder map, and recent activity, generate a structured meeting brief with the following sections:
1. Customer Summary (2–3 sentences on where the account stands)
2. Goal & Value Progress (specific, evidence-based, note any gaps)
3. Risks (list, prioritized high/medium/low, each linked to a specific signal)
4. Expansion Signals (list, prioritized, with context on timing)
5. Recommended Focus (3 prioritized actions for the CSM to take in this meeting)

Be specific. Do not generate generic CS advice. Reference the actual goals, stakeholders, and data points for this account.`
}

export function getValueBlocksBriefPrompt(accountName: string, stage: string, arr: number): string {
  return `You are a Customer Success AI assistant preparing a CSM to run a Value Blocks session.

Account: ${accountName}
Pipeline stage: ${stage}
ARR: $${arr.toLocaleString()}

The Value Blocks Play prevents the "messy middle" — the drift that happens between First Value and renewal when progress becomes vague. Your job is to recommend the next right-sized block of progress.

Using the account's Five Questions, First Value statement, goal progress, inflection point history, usage signals, and stakeholder map, generate a structured block recommendation brief with the following sections:
1. Customer Summary (where they are post-First Value — momentum, risks, current objective)
2. Goal & Block Progress (what's been accomplished since First Value, what the next larger objective is)
3. Risks (list, prioritized — focus on stall signals, unowned goals, adoption plateaus, dormant stakeholders)
4. Expansion Signals (list — blocks that if completed, open expansion readiness)
5. Recommended Focus (2–3 specific, named block recommendations — not generic suggestions. Each should name the need type it addresses: Skillset / Knowledge / Cost / Demands / Change)

Be specific. Name actual goals, stakeholders, and data points. Do not recommend a generic training session or check-in. Every recommended block should connect directly to the customer's stated objective.`
}

export function getSummaryPrompt(accountName: string, userNotes: string): string {
  return `You are a Customer Success AI assistant helping a CSM document a completed Alignment Meeting.

Account: ${accountName}
CSM notes: "${userNotes}"

Using the meeting brief context and the CSM's raw notes, generate structured outputs:
1. Goal & Value Progress Updates (what changed, with specific values where available)
2. Stakeholder Notes (who was present, any changes in engagement or influence)
3. Next Steps & Commitments (what was agreed, who owns what, by when)

Be concrete. Extract any numbers, names, or dates mentioned in the notes. Flag anything that was committed to but not yet scheduled.`
}
