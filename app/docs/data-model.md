# Data Model — CXology Execution Platform

**Version:** 1.0
**Status:** MVP — prototype-grade, mock data only
**Scope:** Covers all entities required to run the Alignment Meeting vertical slice

---

## Design Principles

- **Structured over free-form** — every field that matters is its own typed property, not buried in a notes blob
- **Relationships are explicit** — foreign keys are named `entityId`, never implicit
- **Enums over strings** — status, type, and stage fields are constrained sets
- **Mock-ready** — every model has a complete example record usable as seed data

---

## Entity Overview

```
Account ─────────────────────────────────────────────┐
  │                                                   │
  ├── StageConfidence (1:1 per stage)                 │
  ├── InflectionPoint[] (1:many)                      │
  ├── PlayRun[] (1:many) ──── PlayTemplate (ref)      │
  │     ├── MeetingBrief (1:1)                        │
  │     └── MeetingOutput (1:1)                       │
  ├── StakeholderMap[] (1:many) ──── Contact (ref)    │
  └── NextBestAction[] (1:many)                       │
                                                       │
Contact ───────────────────────────────────────────────┘
```

---

## 1. Account

**Purpose:** The central entity. Represents a customer organization managed by a CSM. Everything else hangs off an account.

### Key Fields

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique identifier (`acc-001`) |
| `name` | `string` | Company name |
| `industry` | `string` | Industry vertical |
| `arr` | `number` | Annual recurring revenue (USD) |
| `csm` | `string` | Assigned CSM name (or ID when auth is added) |
| `stage` | `PipelineStageId` | Current pipeline stage |
| `progressionStatus` | `ProgressionStatus` | `advancing` \| `stalled` \| `at_risk` |
| `renewalDate` | `string` | ISO date — drives urgency signals |
| `daysInStage` | `number` | Days in current stage — staleness signal |
| `createdAt` | `string` | ISO datetime |

### Relationships

| Relationship | Cardinality | Via |
|---|---|---|
| StageConfidence | 1:1 per stage | `accountId` |
| InflectionPoint | 1:many | `accountId` |
| PlayRun | 1:many | `accountId` |
| StakeholderMap | 1:many | `accountId` |
| NextBestAction | 1:many | `accountId` |

### Example Record

```json
{
  "id": "acc-001",
  "name": "Meridian Health Systems",
  "industry": "Healthcare SaaS",
  "arr": 180000,
  "csm": "Sarah Chen",
  "stage": "advocate",
  "progressionStatus": "advancing",
  "renewalDate": "2026-09-15",
  "daysInStage": 18,
  "createdAt": "2025-12-01T00:00:00Z"
}
```

---

## 2. Contact

**Purpose:** A person at a customer organization. Contacts are independent of any single account's play history — they can be referenced across stakeholder maps, meeting outputs, and briefings.

### Key Fields

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique identifier (`con-001`) |
| `accountId` | `string` | The account this contact belongs to |
| `name` | `string` | Full name |
| `title` | `string` | Job title |
| `email` | `string \| null` | Email address |
| `phone` | `string \| null` | Phone number |
| `linkedInUrl` | `string \| null` | LinkedIn profile |
| `notes` | `string \| null` | Freeform — the one place free-form is acceptable |
| `createdAt` | `string` | ISO datetime |

### Relationships

| Relationship | Cardinality | Via |
|---|---|---|
| Account | many:1 | `accountId` |
| StakeholderMap | 1:1 | `contactId` on StakeholderMap |

> Contact stores *who someone is*. StakeholderMap stores *how they relate to this account's journey*.

### Example Record

```json
{
  "id": "con-002",
  "accountId": "acc-001",
  "name": "Priya Nair",
  "title": "Director of IT",
  "email": "priya.nair@meridianhealth.com",
  "phone": null,
  "linkedInUrl": null,
  "notes": "Primary technical champion. Drives internal adoption.",
  "createdAt": "2025-12-15T00:00:00Z"
}
```

---

## 3. PipelineStage

**Purpose:** Reference definition for each stage in the post-sale pipeline. Not stored per account — it's a shared lookup. Defines what it means to be *in* a stage and what's required to *exit* it.

### Key Fields

| Field | Type | Description |
|---|---|---|
| `id` | `PipelineStageId` | `identify` \| `align` \| `advocate` \| `intent` \| `nrr_close` |
| `label` | `string` | Display name |
| `order` | `number` | 1–5, used for rendering and progression logic |
| `description` | `string` | What this stage represents |
| `entrySignals` | `string[]` | What should be true to enter this stage |
| `exitCriteria` | `string[]` | What must be true to advance to the next stage |
| `requiredPlays` | `PlayTemplateId[]` | Plays that must be completed during this stage |
| `keyInflectionPoints` | `InflectionPointType[]` | Milestones tracked during this stage |

### Relationships

| Relationship | Cardinality | Via |
|---|---|---|
| Account | 1:many | `account.stage` references `PipelineStage.id` |
| PlayTemplate | 1:many | `playTemplate.stageId` |

### Example Record

```json
{
  "id": "advocate",
  "label": "Advocate",
  "order": 3,
  "description": "Customer is achieving value, adoption is growing, and internal champions are emerging.",
  "entrySignals": [
    "First Value milestone achieved",
    "Primary champion identified and engaged",
    "Initial goals documented and progressing"
  ],
  "exitCriteria": [
    "Customer can articulate measurable value achieved",
    "Executive sponsor engaged",
    "Expansion opportunity identified or expansion conversation initiated"
  ],
  "requiredPlays": ["play-tmpl-alignment-meeting", "play-tmpl-value-blocks"],
  "keyInflectionPoints": ["goal_progress", "stakeholder_coverage", "insight_delivery"]
}
```

---

## 4. PlayTemplate

**Purpose:** The reusable definition of a play — what it is, when it runs, how it's structured, and what outputs it requires. Think of this as the playbook entry, not the execution instance.

### Key Fields

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique identifier (`play-tmpl-alignment-meeting`) |
| `type` | `PlayType` | Enum: `alignment_meeting`, `kickoff`, `onboarding`, etc. |
| `label` | `string` | Display name |
| `description` | `string` | What this play accomplishes |
| `stageId` | `PipelineStageId` | Which pipeline stage this play belongs to |
| `entryCriteria` | `string[]` | What must be true before this play can begin |
| `steps` | `PlayStep[]` | Ordered steps — each with a label, description, and type |
| `interactionGuide` | `InteractionGuide` | Structured agenda, required components, key questions |
| `requiredOutputFields` | `OutputFieldDef[]` | Defines the structured output fields CSM must complete |
| `progressionInfluence` | `InflectionPointType[]` | Which inflection points completing this play satisfies |

### `PlayStep` shape

```typescript
interface PlayStep {
  number: 1 | 2 | 3 | 4
  label: string
  description: string
  type: 'preparation' | 'interaction' | 'output' | 'progression'
}
```

### `OutputFieldDef` shape

```typescript
interface OutputFieldDef {
  key: string           // e.g. "meetingSummary"
  label: string         // e.g. "Meeting Summary"
  inputType: 'textarea' | 'boolean' | 'select' | 'number'
  required: boolean
  placeholder: string
}
```

### Relationships

| Relationship | Cardinality | Via |
|---|---|---|
| PipelineStage | many:1 | `stageId` |
| PlayRun | 1:many | `playRun.playTemplateId` |

### Example Record

```json
{
  "id": "play-tmpl-alignment-meeting",
  "type": "alignment_meeting",
  "label": "Alignment Meeting",
  "description": "A structured quarterly meeting to realign on goals, assess progress, surface risks, and confirm the path to renewal and growth.",
  "stageId": "advocate",
  "entryCriteria": [
    "First Value milestone achieved",
    "At least 30 days since last Alignment Meeting or Kickoff",
    "Primary champion identified"
  ],
  "steps": [
    { "number": 1, "label": "Preparation", "description": "AI-generated brief covering customer context, goal progress, risks, and expansion signals", "type": "preparation" },
    { "number": 2, "label": "Interaction Guide", "description": "Structured agenda, required components, and key questions", "type": "interaction" },
    { "number": 3, "label": "Output Capture", "description": "Record structured meeting outcomes", "type": "output" },
    { "number": 4, "label": "Progression Update", "description": "Assess advancement and update pipeline confidence", "type": "progression" }
  ],
  "interactionGuide": {
    "agenda": [
      "Open with reason for meeting and desired outcomes",
      "Revisit goals from last session — what's changed?",
      "Review progress against primary success criteria",
      "Identify blockers or risks to progression",
      "Discuss next milestones and owner assignments",
      "Confirm alignment and agree on next steps"
    ],
    "requiredComponents": [
      "Revisit reason for purchase",
      "Confirm success criteria are still relevant",
      "Update goal progress with evidence",
      "Assign owners to open milestones"
    ],
    "keyQuestions": [
      "What has changed since we last met — internally or with your goals?",
      "Are you on track with the outcomes you committed to at kickoff?",
      "What would make this next quarter a clear success for your team?",
      "Who else in your organization should be part of this conversation?",
      "Is there anything that could slow down or derail your progress?"
    ],
    "stakeholderTalkingPoints": []
  },
  "requiredOutputFields": [
    { "key": "meetingSummary", "label": "Meeting Summary", "inputType": "textarea", "required": true, "placeholder": "What was discussed and agreed?" },
    { "key": "goalUpdates", "label": "Goal & Value Progress Updates", "inputType": "textarea", "required": true, "placeholder": "What changed? Any evidence of progress?" },
    { "key": "stakeholderNotes", "label": "Stakeholder Notes", "inputType": "textarea", "required": false, "placeholder": "Any changes in contacts, influence, or engagement?" },
    { "key": "risksOpportunities", "label": "Risks & Opportunities", "inputType": "textarea", "required": false, "placeholder": "New risks surfaced or expansion signals identified?" },
    { "key": "customerAdvanced", "label": "Did the customer advance?", "inputType": "boolean", "required": true, "placeholder": "" },
    { "key": "progressionNotes", "label": "Next Steps & Commitments", "inputType": "textarea", "required": true, "placeholder": "What was committed to? Who owns what?" }
  ],
  "progressionInfluence": ["alignment_meeting", "goal_progress"]
}
```

---

## 5. PlayRun

**Purpose:** A specific instance of a PlayTemplate being executed for a specific account. Records state (current step, start/end times) and links to the brief generated before the play and the outputs captured after.

### Key Fields

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique identifier (`run-001`) |
| `accountId` | `string` | The account this run is for |
| `playTemplateId` | `string` | The template being executed |
| `status` | `PlayRunStatus` | `not_started` \| `in_progress` \| `completed` \| `skipped` |
| `currentStep` | `1 \| 2 \| 3 \| 4` | Which step the CSM is currently on |
| `scheduledDate` | `string \| null` | When the meeting is scheduled |
| `startedAt` | `string \| null` | When the CSM first opened the play |
| `completedAt` | `string \| null` | When Step 4 was submitted |
| `briefId` | `string \| null` | FK to MeetingBrief |
| `outputId` | `string \| null` | FK to MeetingOutput |

### Relationships

| Relationship | Cardinality | Via |
|---|---|---|
| Account | many:1 | `accountId` |
| PlayTemplate | many:1 | `playTemplateId` |
| MeetingBrief | 1:1 | `briefId` |
| MeetingOutput | 1:1 | `outputId` |

### Example Record

```json
{
  "id": "run-001",
  "accountId": "acc-001",
  "playTemplateId": "play-tmpl-alignment-meeting",
  "status": "in_progress",
  "currentStep": 1,
  "scheduledDate": "2026-04-28",
  "startedAt": "2026-04-21T09:00:00Z",
  "completedAt": null,
  "briefId": "brief-001",
  "outputId": null
}
```

---

## 6. InflectionPoint

**Purpose:** A critical milestone that must be achieved for an account to progress. Tracked per account. Status is updated either automatically (when a relevant PlayRun is completed) or manually by the CSM.

### Key Fields

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique identifier (`ip-001`) |
| `accountId` | `string` | The account this milestone belongs to |
| `type` | `InflectionPointType` | `first_value` \| `alignment_meeting` \| `goal_progress` \| `stakeholder_coverage` \| `insight_delivery` |
| `label` | `string` | Human-readable label |
| `status` | `InflectionPointStatus` | `not_started` \| `pending` \| `achieved` \| `overdue` |
| `dueDate` | `string \| null` | When this milestone should be achieved |
| `achievedDate` | `string \| null` | When it was actually achieved |
| `achievedByRunId` | `string \| null` | FK to the PlayRun that satisfied this milestone |
| `notes` | `string \| null` | Optional context |

### Relationships

| Relationship | Cardinality | Via |
|---|---|---|
| Account | many:1 | `accountId` |
| PlayRun | many:1 (optional) | `achievedByRunId` |

### Example Record

```json
{
  "id": "ip-002",
  "accountId": "acc-001",
  "type": "alignment_meeting",
  "label": "Alignment Meeting",
  "status": "pending",
  "dueDate": "2026-04-28",
  "achievedDate": null,
  "achievedByRunId": null,
  "notes": "Last alignment was 2026-03-22. Next due within 30 days."
}
```

---

## 7. StakeholderMap

**Purpose:** Represents the relationship between a Contact and an Account — their influence tier, engagement status, and last interaction. This is the execution layer on top of the Contact record.

### Key Fields

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique identifier (`sm-001`) |
| `accountId` | `string` | The account |
| `contactId` | `string` | The contact |
| `influence` | `StakeholderInfluence` | `champion` \| `decision_maker` \| `end_user` \| `blocker` |
| `coverageStatus` | `StakeholderCoverage` | `engaged` \| `dormant` \| `not_contacted` |
| `lastContactDate` | `string \| null` | Date of last meaningful interaction |
| `daysSinceContact` | `number \| null` | Derived — used for staleness signals |
| `coverageRisk` | `boolean` | True if this is a decision-maker or champion and coverage is dormant/not_contacted |
| `notes` | `string \| null` | Optional context on the relationship |

### Relationships

| Relationship | Cardinality | Via |
|---|---|---|
| Account | many:1 | `accountId` |
| Contact | 1:1 | `contactId` |

### Example Record

```json
{
  "id": "sm-003",
  "accountId": "acc-001",
  "contactId": "con-003",
  "influence": "decision_maker",
  "coverageStatus": "not_contacted",
  "lastContactDate": null,
  "daysSinceContact": null,
  "coverageRisk": true,
  "notes": "CFO — renewal sign-off authority. No contact established yet."
}
```

---

## 8. MeetingBrief

**Purpose:** The AI-generated (or seeded) preparation brief for a PlayRun. Generated before the meeting and surfaced in Step 1 of Play Execution. Structured into discrete sections — not a blob of text.

### Key Fields

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique identifier (`brief-001`) |
| `playRunId` | `string` | The PlayRun this brief belongs to |
| `accountId` | `string` | Denormalized for convenience |
| `generatedAt` | `string` | ISO datetime (mock: hardcoded, real: API call timestamp) |
| `generatedBy` | `'ai' \| 'seed'` | Source — `seed` for mock data, `ai` when real API is wired |
| `customerSummary` | `string` | 2–4 sentence narrative on account status |
| `goalProgress` | `string` | Narrative on how goals are tracking |
| `risks` | `BriefItem[]` | Structured list of identified risks |
| `expansionSignals` | `BriefItem[]` | Structured list of growth signals |
| `recommendedFocus` | `BriefItem[]` | Prioritized recommendations for this meeting |

### `BriefItem` shape

```typescript
interface BriefItem {
  id: string
  text: string
  priority?: 'high' | 'medium' | 'low'
  linkedInflectionPointId?: string   // if this risk ties to an inflection point
  linkedStakeholderId?: string       // if this signal ties to a stakeholder
}
```

### Relationships

| Relationship | Cardinality | Via |
|---|---|---|
| PlayRun | 1:1 | `playRunId` |
| Account | many:1 | `accountId` |

### Example Record

```json
{
  "id": "brief-001",
  "playRunId": "run-001",
  "accountId": "acc-001",
  "generatedAt": "2026-04-21T08:45:00Z",
  "generatedBy": "seed",
  "customerSummary": "Meridian Health Systems is 3 months post-onboarding and has achieved their initial First Value milestone — reducing manual reporting time by 40%. The executive sponsor (VP Operations) is engaged. The primary champion, Director of IT, has been active in weekly check-ins.",
  "goalProgress": "Primary goal (reporting automation) is 40% complete against a 60% target for this period. Secondary goal (cross-department visibility) has not yet been addressed and has no assigned owner on the customer side.",
  "risks": [
    {
      "id": "risk-001",
      "text": "Cross-department visibility goal has no assigned owner on the customer side",
      "priority": "high",
      "linkedInflectionPointId": "ip-003"
    },
    {
      "id": "risk-002",
      "text": "No contact established with CFO — renewal sign-off typically requires finance approval",
      "priority": "high",
      "linkedStakeholderId": "sm-003"
    },
    {
      "id": "risk-003",
      "text": "Two power users have not logged in within the past 14 days",
      "priority": "medium",
      "linkedInflectionPointId": null
    }
  ],
  "expansionSignals": [
    {
      "id": "exp-001",
      "text": "Director of IT mentioned a second team (Finance Ops) struggling with the same reporting problem",
      "priority": "high",
      "linkedStakeholderId": "sm-004"
    },
    {
      "id": "exp-002",
      "text": "Usage spiked 35% in March — suggests growing internal adoption",
      "priority": "medium"
    }
  ],
  "recommendedFocus": [
    {
      "id": "focus-001",
      "text": "Revisit the cross-department goal — assign an owner and set a milestone",
      "priority": "high"
    },
    {
      "id": "focus-002",
      "text": "Introduce the CFO conversation before the next alignment cycle",
      "priority": "high"
    },
    {
      "id": "focus-003",
      "text": "Surface the Finance Ops opportunity as a natural expansion play",
      "priority": "medium"
    }
  ]
}
```

---

## 9. MeetingOutput

**Purpose:** The structured record of what happened during a PlayRun. Captured in Step 3 (Output Capture) and Step 4 (Progression Update). Fields mirror the `requiredOutputFields` defined on the PlayTemplate.

### Key Fields

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique identifier (`out-001`) |
| `playRunId` | `string` | The PlayRun this output belongs to |
| `accountId` | `string` | Denormalized for convenience |
| `capturedAt` | `string` | ISO datetime — when the CSM submitted Step 3 |
| `meetingSummary` | `string` | What was discussed and agreed |
| `goalUpdates` | `string` | How goal/value progress changed |
| `stakeholderNotes` | `string \| null` | Changes in contacts, engagement, or influence |
| `risksOpportunities` | `string \| null` | New risks surfaced or expansion signals identified |
| `customerAdvanced` | `boolean` | Did the customer advance toward the next stage? |
| `stageConfidenceChange` | `number \| null` | Delta applied to StageConfidence (e.g. +8, -5) |
| `progressionNotes` | `string` | Commitments made, next steps, owners |
| `nextBestActionGenerated` | `boolean` | Whether a NextBestAction was triggered by this output |

### Relationships

| Relationship | Cardinality | Via |
|---|---|---|
| PlayRun | 1:1 | `playRunId` |
| Account | many:1 | `accountId` |
| StageConfidence | triggers update | `accountId` + `stageConfidenceChange` |
| NextBestAction | may create | `nextBestActionGenerated` |

### Example Record

```json
{
  "id": "out-001",
  "playRunId": "run-001",
  "accountId": "acc-001",
  "capturedAt": "2026-04-28T11:30:00Z",
  "meetingSummary": "Reviewed Q1 progress. Reporting automation goal moving well. Agreed to assign Maria Reyes as owner for cross-department visibility workstream. CFO intro to be arranged by James (VP Ops) before end of May.",
  "goalUpdates": "Reporting automation now at 52% — ahead of prior estimate. Cross-department visibility now has an assigned owner. New target: 30% by June 1.",
  "stakeholderNotes": "CFO (David Ko) intro scheduled for May 12 via James Whitfield. Aisha Torres (Finance Ops) identified as new contact — will be added.",
  "risksOpportunities": "Finance Ops team confirmed as expansion opportunity. James mentioned budget discussion happening in June — timing aligns with renewal.",
  "customerAdvanced": true,
  "stageConfidenceChange": 10,
  "progressionNotes": "Next: Alignment Meeting in 30 days. James to intro CFO by May 12. Maria Reyes to present cross-department plan by May 1.",
  "nextBestActionGenerated": true
}
```

---

## 10. NextBestAction

**Purpose:** A prioritized, AI-generated (or rule-based) recommendation for what the CSM should do next with a specific account. Actions are tied to a specific play, stage gap, or inflection point — never generic.

### Key Fields

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique identifier (`nba-001`) |
| `accountId` | `string` | The account this action is for |
| `label` | `string` | Short action label — what to do |
| `reason` | `string` | Why this action is recommended now |
| `priority` | `ActionPriority` | `high` \| `medium` \| `low` |
| `source` | `ActionSource` | `ai` \| `rule` \| `seed` — what generated this action |
| `linkedPlayTemplateId` | `string \| null` | If clicking this should launch a play |
| `linkedInflectionPointId` | `string \| null` | If this action addresses a specific inflection point |
| `linkedStakeholderId` | `string \| null` | If this action is about a specific stakeholder |
| `status` | `ActionStatus` | `active` \| `dismissed` \| `completed` |
| `createdAt` | `string` | ISO datetime |
| `completedAt` | `string \| null` | When the action was resolved |
| `triggeredByOutputId` | `string \| null` | If created as a result of a MeetingOutput |

### Relationships

| Relationship | Cardinality | Via |
|---|---|---|
| Account | many:1 | `accountId` |
| PlayTemplate | many:1 (optional) | `linkedPlayTemplateId` |
| InflectionPoint | many:1 (optional) | `linkedInflectionPointId` |
| StakeholderMap | many:1 (optional) | `linkedStakeholderId` |
| MeetingOutput | many:1 (optional) | `triggeredByOutputId` |

### Example Record

```json
{
  "id": "nba-002",
  "accountId": "acc-001",
  "label": "Introduce executive sponsor to CFO",
  "reason": "Renewal requires finance sign-off. No contact established with CFO. Renewal is in 147 days — this needs to happen before the next alignment cycle.",
  "priority": "high",
  "source": "rule",
  "linkedPlayTemplateId": null,
  "linkedInflectionPointId": "ip-004",
  "linkedStakeholderId": "sm-003",
  "status": "active",
  "createdAt": "2026-04-21T08:00:00Z",
  "completedAt": null,
  "triggeredByOutputId": null
}
```

---

## 11. StageConfidence

**Purpose:** A scored, signal-based assessment of how confident the CSM should be that an account is truly at its current pipeline stage — and ready to advance. Replaces subjective health scores with execution-derived signals.

### Key Fields

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique identifier (`sc-001`) |
| `accountId` | `string` | The account this score belongs to |
| `stage` | `PipelineStageId` | The stage being scored |
| `score` | `number` | 0–100 — derived from signals |
| `signals` | `ConfidenceSignal[]` | The individual factors contributing to the score |
| `updatedAt` | `string` | ISO datetime — when the score was last recalculated |
| `updatedByRunId` | `string \| null` | The PlayRun that triggered the last update (if any) |
| `trend` | `'improving' \| 'declining' \| 'stable'` | Direction vs. prior score |
| `priorScore` | `number \| null` | Previous score before last update |

### `ConfidenceSignal` shape

```typescript
interface ConfidenceSignal {
  id: string
  label: string
  weight: number          // contribution to total score (0–100 across all signals)
  status: 'met' | 'partial' | 'unmet'
  detail: string          // why this signal is met/unmet
  linkedInflectionPointId?: string
}
```

### Relationships

| Relationship | Cardinality | Via |
|---|---|---|
| Account | 1:1 (per stage) | `accountId` + `stage` |
| PlayRun | many:1 (optional) | `updatedByRunId` |

### Example Record

```json
{
  "id": "sc-001",
  "accountId": "acc-001",
  "stage": "advocate",
  "score": 72,
  "trend": "improving",
  "priorScore": 62,
  "updatedAt": "2026-04-28T11:35:00Z",
  "updatedByRunId": "run-001",
  "signals": [
    {
      "id": "sig-001",
      "label": "First Value achieved",
      "weight": 25,
      "status": "met",
      "detail": "Achieved 2026-02-10. Reporting automation milestone confirmed.",
      "linkedInflectionPointId": "ip-001"
    },
    {
      "id": "sig-002",
      "label": "Alignment Meeting completed within last 30 days",
      "weight": 20,
      "status": "met",
      "detail": "Alignment Meeting completed 2026-04-28.",
      "linkedInflectionPointId": "ip-002"
    },
    {
      "id": "sig-003",
      "label": "Primary goal progressing on track",
      "weight": 20,
      "status": "partial",
      "detail": "Reporting automation at 52% vs 60% target. Cross-department goal now has an owner.",
      "linkedInflectionPointId": "ip-003"
    },
    {
      "id": "sig-004",
      "label": "Decision maker engaged",
      "weight": 20,
      "status": "partial",
      "detail": "VP Operations engaged. CFO intro scheduled but not yet completed.",
      "linkedInflectionPointId": "ip-004"
    },
    {
      "id": "sig-005",
      "label": "Expansion signal identified",
      "weight": 15,
      "status": "met",
      "detail": "Finance Ops team identified as expansion opportunity. Budget discussion in June.",
      "linkedInflectionPointId": null
    }
  ]
}
```

---

## Relationship Summary

```
Account
  ├── stage → PipelineStage.id
  ├── [StageConfidence] accountId + stage
  ├── [InflectionPoint[]] accountId
  │     └── achievedByRunId → PlayRun.id
  ├── [PlayRun[]] accountId
  │     ├── playTemplateId → PlayTemplate.id
  │     ├── briefId → MeetingBrief.id
  │     └── outputId → MeetingOutput.id
  │           └── (triggers) StageConfidence update
  │           └── (may create) NextBestAction
  ├── [StakeholderMap[]] accountId
  │     └── contactId → Contact.id
  └── [NextBestAction[]] accountId
        ├── linkedPlayTemplateId → PlayTemplate.id
        ├── linkedInflectionPointId → InflectionPoint.id
        └── linkedStakeholderId → StakeholderMap.id

PlayTemplate (reference data, not per-account)
  └── stageId → PipelineStage.id
```

---

## Enum Reference

```typescript
type PipelineStageId      = 'identify' | 'align' | 'advocate' | 'intent' | 'nrr_close'
type ProgressionStatus    = 'advancing' | 'stalled' | 'at_risk'
type PlayType             = 'purchase_welcome' | 'kickoff' | 'onboarding' | 'first_value'
                          | 'alignment_meeting' | 'value_blocks' | 'goal_facilitation'
                          | 'renew_grow' | 'key_contact_change' | 'offboarding'
type PlayRunStatus        = 'not_started' | 'in_progress' | 'completed' | 'skipped'
type InflectionPointType  = 'first_value' | 'alignment_meeting' | 'goal_progress'
                          | 'stakeholder_coverage' | 'insight_delivery'
type InflectionPointStatus = 'not_started' | 'pending' | 'achieved' | 'overdue'
type StakeholderInfluence = 'champion' | 'decision_maker' | 'end_user' | 'blocker'
type StakeholderCoverage  = 'engaged' | 'dormant' | 'not_contacted'
type ActionPriority       = 'high' | 'medium' | 'low'
type ActionSource         = 'ai' | 'rule' | 'seed'
type ActionStatus         = 'active' | 'dismissed' | 'completed'
type ConfidenceSignalStatus = 'met' | 'partial' | 'unmet'
```
