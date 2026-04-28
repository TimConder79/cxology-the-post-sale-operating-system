# CXology — Post-Sale Execution Platform
### Product Overview & Build Log

---

## What This Is

A purpose-built post-sale execution platform for Customer Success teams. It operationalises the CXology methodology — the five-stage NRR pipeline, the Five Kickoff Questions, play-based execution, and the "traveling thread" principle that customer context accumulates and carries forward through every interaction.

The platform is a React/TypeScript single-page application running entirely on mock data. It is a functional, navigable demo — not a prototype — with real state mutations, derived calculations, and a coherent data model that mirrors how a production system would be structured.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Routing | React Router v6 |
| Styling | Tailwind CSS |
| State | React Context (`AppContext`) + `useState` |
| Icons | Lucide React |
| Data | In-memory seed data — no API, no database |

Path alias `@/` resolves to `./src`. No external UI component library — every component is hand-built.

---

## The Five-Stage NRR Pipeline

The platform is organized around five post-sale pipeline stages, each with defined entry signals, exit criteria, required plays, and key inflection points:

| Stage | Purpose |
|---|---|
| **Identify** | Establish goals, stakeholders, and success criteria at kickoff |
| **Align** | Achieve first value and build shared ownership |
| **Advocate** | Drive adoption, build champions, expand stakeholder coverage |
| **Intent** | Confirm renewal and expansion intent |
| **NRR Close** | Execute renewal and growth close |

---

## Screens

### 1. Pipeline View (`/pipeline`)

A kanban board of all active opportunities, grouped by pipeline stage. Each card shows account name, ARR, opportunity type, confidence level, days in stage, and progression status.

**Features:**
- **Drag-and-drop** — cards are draggable between stage columns using native HTML5 DnD (no library). Dropping a card calls `moveOpportunityStage()`, updates state, and resets `daysInStage` to zero. Visual feedback: brand-blue ring on the target column, opacity fade on the dragging card, "Drop here" placeholder when a column is empty.
- **NRR Trajectory** — a header-level metric computed from all opportunities using a weighted probability model. Retention and expansion probabilities are derived from each opportunity's `progressionStatus` and `confidence` level. NRR ≥ 100% = green, ≥ 80% = amber, < 80% = red.
- **Execution risks** — each card surfaces blocking and warning-level execution risks (e.g. `first_value_not_achieved`, `missing_alignment_meeting`, `renewal_window_closing`).

### 2. Inflection Points View (`/inflection-points`)

A gap analysis view showing which accounts are missing critical execution milestones, organized by gap type.

**Features:**
- **Gap cards** — grouped by inflection point type (first value, alignment meeting, goal progress, stakeholder coverage, insight delivery). Each card links to the account workspace with a `?focus=` param that auto-scrolls to the relevant section.
- **Opportunity impact chips** — each gap card shows the dollar value at risk, filtered semantically to the gap type (e.g. a stakeholder coverage gap shows renewal ARR at risk; an expansion signal gap shows expansion/upsell value).
- **Activity-without-progress signal** — accounts that are stalled or at-risk but have an active or recently completed play run (within 30 days) are flagged with an amber "Active · not advancing" badge. This surfaces the "busy but not moving" problem.
- **Next Best Actions sidebar** — a prioritised list of recommended actions across all accounts, sorted by priority (high → medium → low). Each NBA card shows the reason, source (AI / rule), and links to the relevant account workspace.

### 3. Account Workspace (`/accounts/:id`)

The full detail view for a single account. Accessed from either Pipeline or Inflection Points, with the source tracked in the URL (`?source=`) to enable correct back-navigation.

**Layout:** Two-column — main content left, narrower sidebar right.

**Sections (left column):**

- **Pipeline Stage** — visual stage progression bar, days in current stage, stage confidence score with trend indicator (improving / declining / stable), and a breakdown of confidence signals (met / partial / unmet).
- **First Value Statement** — the customer-language description of what they need to achieve first and by when. Displayed as a styled block quote. Shows a prompt to capture it if not yet set.
- **Five Questions** — the answers captured at kickoff, displayed as five numbered entries with category labels. Only shown when a record exists. Includes the capture date.
- **Inflection Points** — a timeline of key milestones (achieved, pending, overdue, not started) with due/achieved dates.
- **Outcome Evidence** — a chronological log of documented customer outcomes, each with a goal targeted, the outcome achieved, and the business impact. Automatically populated when a play completes with customer advancement.
- **Plays** — the active play run (prominent CTA) and all historical play runs with status badges and scheduled/completion dates.

**Sections (right column):**

- **Executive Alignment** — surfaces the decision-maker stakeholder specifically. Shows their name, title, coverage status, and days since last contact. Amber styling when dormant or not contacted; red alert when no decision-maker is mapped at all.
- **Stakeholder Map** — all mapped stakeholders with influence role (champion, decision-maker, end user, blocker), coverage status, and last contact date.
- **Next Best Actions** — active recommended actions for this account.
- **Opportunities** — all renewal, expansion, and upsell opportunities with confidence levels and close dates.

**Smart routing:** A `getWorkspaceRecommendation()` function analyses the account state and determines the most important CTA — either launching an active play, scrolling to a specific section, or starting the next recommended play.

### 4. Play Execution (`/accounts/:id/plays/:runId`)

A four-step guided flow for executing a play. This is the core operational loop of the platform.

**Steps:**

| Step | Label | Description |
|---|---|---|
| 1 | Preparation | AI-generated meeting brief assembled from live account state — customer summary, goal progress, risks, expansion signals, recommended focus areas |
| 2 | Interaction Guide | Structured agenda, required components checklist, key questions with account-specific context callouts, stakeholder talking points |
| 3 | Output Capture | Structured meeting outputs with AI-assisted drafting |
| 4 | Progression | Confirm whether the customer advanced; set stage confidence delta |

**Five Questions capture (kickoff plays):**
Step 3 of kickoff plays shows the Five Kickoff Questions before the standard output fields. Each question has a full-text answer field. On completion, answers are stored as a `FiveQuestions` record linked to the play run and account.

**First Value Statement (kickoff + first_value plays):**
Kickoff plays include a First Value Statement field alongside the Five Questions. First value plays include it as a standalone confirmation field. On completion, the account's `firstValueStatement` is updated in state.

**AI simulation:**
Both the brief generation (Step 1) and output drafting (Step 3) simulate an AI process with step-by-step progress indicators and realistic delays. The system uses a prompt-preview `<details>` element in Step 3 so the user can inspect what the AI was given.

**State mutations on completion:**
When a play completes, `completePlay()` runs a multi-step state update:
1. Marks the play run as completed
2. Achieves linked inflection points
3. Updates stage confidence score and trend
4. Marks the triggering NBA as completed, adds a new one if customer advanced
5. Updates account progression status
6. Upgrades opportunity confidence levels (expansion/upsell boost for alignment meetings; renewal upgrade for kickoff/first_value)
7. Captures outcome evidence if customer advanced and goal updates were entered

---

## Data Model

### Core Types

```
Account               — ARR, stage, CSM, progressionStatus, firstValueStatement, renewalDate
Contact               — name, title, email, notes
StakeholderMap        — contact link, influence role, coverageStatus, lastContactDate
InflectionPoint       — type, status, dueDate, achievedDate, achievedByRunId
StageConfidence       — score (0–100), trend, priorScore, signals[]
PlayRun               — playTemplateId, type, status, currentStep, scheduledDate
MeetingBrief          — customerSummary, goalProgress, risks[], expansionSignals[], recommendedFocus[]
MeetingOutput         — meetingSummary, goalUpdates, stakeholderNotes, customerAdvanced, stageConfidenceDelta
NextBestAction        — label, reason, priority, source, linkedPlayTemplateId
Opportunity           — type, stage, estimatedValue, confidence, progressionStatus, executionRisks[]
AccountTimeline       — milestones[] with expectedDay / actualDay / delayDays
OutcomeEvidence       — goalTargeted, outcomeAchieved, businessImpact, capturedByRunId
FiveQuestions         — q1–q5 (the Five Kickoff Questions), capturedAt, capturedByRunId
```

### Reference Data (static)
```
PipelineStage         — id, label, order, entrySignals, exitCriteria, requiredPlayTypes, keyInflectionPoints
PlayTemplate          — type, description, entryCriteria, interactionGuide, requiredOutputFields, progressionInfluence
```

### Derived / Composed
```
AccountView           — extends Account with all related collections + latestFiveQuestions
```

---

## Seed Data

Five accounts covering a realistic spread of scenarios:

| Account | Industry | ARR | Stage | Status | CSM |
|---|---|---|---|---|---|
| Meridian Health Systems | Healthcare SaaS | $180K | Advocate | Advancing | Sarah Chen |
| Apex Logistics Group | Supply Chain SaaS | $95K | Align | Stalled | Marcus Reid |
| Vantage Financial | Fintech | $240K | Intent | Advancing | Sarah Chen |
| Thornwood Media | Media & Publishing | $48K | Identify | At Risk | Marcus Reid |
| ClearPath Analytics | Data & Analytics | $132K | Align | Advancing | Sarah Chen |

Four accounts have full Five Questions records and First Value Statements. Thornwood Media (at-risk, no kickoff completed) has neither — intentionally, to demonstrate the empty/incomplete states.

---

## The Five Kickoff Questions

The core framework from the book, now captured in the platform at the kickoff play and surfaced as persistent context throughout the relationship:

1. **What is the one thing we must get right to make this worth undertaking?**
2. **How does your organization define success?**
3. **What is our role in achieving that success?**
4. **What aspects of the internal culture or external environment could put this effort at risk to fail?**
5. **Assuming we mitigate that risk, what would exceed your wildest dreams?**

Answers are stored as a `FiveQuestions` record linked to the play run that captured them. The most recent record is surfaced on the Account Workspace and will eventually feed into alignment meeting briefs as "traveling thread" context.

---

## Key Architectural Decisions

**No API, no persistence.** All state lives in React Context initialized from `seedData.ts`. This makes the demo portable and eliminates infrastructure concerns during the design phase.

**Normalized state, derived views.** `AppState` stores flat arrays. `getAccountView()` composes them into a rich `AccountView` on demand. This keeps mutations simple and prevents denormalization bugs.

**Mutations are atomic.** `completePlay()` runs all downstream updates in a single `setState` call — inflection points, confidence scores, NBAs, opportunities, evidence — so state is always consistent.

**"Traveling thread" architecture.** Play outputs are structured records (not free text blobs) that can feed into subsequent plays. The Five Questions and First Value Statement are the first implementation of this principle. Alignment meeting briefs will eventually incorporate them as context.

**HTML5 native drag-and-drop.** No DnD library. `dataTransfer.setData/getData` carries the opportunity ID between drag source and drop target. Column-level handlers with `relatedTarget` checking prevent flickering on `dragLeave`.

**NRR as a probability-weighted model.** Rather than requiring actual financial projections, NRR is computed from retention and expansion probability weights derived from each opportunity's `progressionStatus` and `confidence`. This gives a meaningful directional signal from data that already exists.

---

## File Structure

```
app/
  src/
    types/
      index.ts              # All TypeScript interfaces and enums
    data/
      seedData.ts           # All seed data — accounts, plays, briefs, evidence, etc.
    context/
      AppContext.tsx         # Global state, all mutations, derived getters
    lib/
      utils.ts              # Formatting, cn(), display maps, date helpers
      aiService.ts          # AI simulation steps, prompt builders, draft generators
      accountRouting.ts     # Smart CTA routing logic for AccountWorkspace
      executionGaps.ts      # Gap detection logic for InflectionPointsView
    hooks/
      useAiGeneration.ts    # Simulated AI generation state machine
    pages/
      PipelineView.tsx      # Kanban board with NRR trajectory + drag-and-drop
      InflectionPointsView.tsx  # Gap analysis + NBA sidebar
      AccountWorkspace.tsx  # Full account detail with all sections
      PlayExecution.tsx     # 4-step play execution flow
    components/
      layout/               # Shell, nav, layout primitives
    App.tsx                 # Route definitions
```

---

## What's Been Built (Chronological)

1. Initial app scaffold — routing, shell layout, seed data, type system
2. Pipeline View — kanban columns, opportunity cards, execution risk badges
3. Account Workspace — all sections, stage confidence, inflection points, play runs
4. Play Execution — 4-step flow, AI brief simulation, output capture, progression
5. Next Best Actions — moved from Pipeline to Inflection Points sidebar
6. NRR Trajectory — weighted probability model displayed in Pipeline header
7. Activity-without-progress signal — amber badge on gap cards in Inflection Points
8. Executive Alignment section — decision-maker spotlight on Account Workspace
9. Pipeline drag-and-drop — native HTML5 DnD with visual drop targets
10. Outcome Evidence — log of documented customer outcomes, auto-captured on play completion
11. Five Questions — capture at kickoff, display on Account Workspace
12. First Value Statement — captured at kickoff, confirmed at first_value, displayed as block quote

---

*Built alongside the CXology book manuscript. The app is the methodology made interactive.*
