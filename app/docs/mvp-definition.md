# MVP Definition — CXology Execution Platform

**Version:** 1.0
**Status:** Approved for build
**Scope:** One user. One workflow. One account moved forward.

---

## The Wedge

> A CSM opens the platform, sees which account needs attention, runs an Alignment Meeting, captures the output, and marks the account as advanced — all inside a single, structured workflow.

This is the smallest thing that proves the product's core claim: **execution can be designed**.

---

## Primary User

**Customer Success Manager (CSM)**

- Owns 10–40 accounts
- Has a defined CS motion but inconsistent execution
- Needs to run an Alignment Meeting this week
- Does not know where to start or what "good" looks like

---

## Core User Stories

### 1. See what needs attention

> As a CSM, I want to see all my accounts organized by pipeline stage so I can understand where each account stands and prioritize my work based on progression — not last activity date.

**Why it matters:** Replaces the "what should I work on today?" question with a clear progression-first view.

### 2. Understand a specific account

> As a CSM, I want to open an account and immediately see its pipeline stage, inflection point status, active plays, and next best action so I know exactly what's happening and what needs to happen next.

**Why it matters:** Replaces digging through notes, CRM records, and Slack to reconstruct context.

### 3. Prepare for an Alignment Meeting

> As a CSM, I want an AI-generated preparation brief for an upcoming Alignment Meeting — customer context, goal progress, risks, and expansion signals — so I walk in prepared, not improvising.

**Why it matters:** The preparation brief is the product's clearest AI-native moment. It should feel like having a prepared analyst hand you a brief before every meeting.

### 4. Run the Alignment Meeting with structure

> As a CSM, I want a structured interaction guide — agenda, required components, key questions — so every Alignment Meeting follows the same proven structure regardless of my experience level.

**Why it matters:** Enforces consistency. Embeds training. Makes "good" visible and repeatable.

### 5. Capture structured outputs

> As a CSM, I want to record meeting outcomes in structured fields (not free-form notes) so the outputs are consistent, usable, and tied to the account's pipeline state.

**Why it matters:** Structured output is what separates a system of execution from a note-taking tool.

### 6. Advance the account

> As a CSM, I want to record whether the customer advanced, update my stage confidence, and receive a next best action — so I can close the loop and see the account's state update in the pipeline.

**Why it matters:** Ties execution directly to pipeline movement. This is the core loop.

---

## MVP Feature List

### Surface 1: Post-Sale Pipeline View

| Feature | Detail |
|---|---|
| Accounts grouped by stage | Identify → Align → Advocate → Intent → NRR Close |
| Per-account card | Name, ARR, progression status (Advancing / Stalled / At Risk), stage confidence |
| Stage-level signals | Count of at-risk and stalled accounts per stage |
| Click-through to account | Clicking a card opens the Account Workspace |

### Surface 2: Account Execution Workspace

| Feature | Detail |
|---|---|
| Stage + confidence display | Current stage, confidence %, days in stage |
| Stage progress bar | Visual pipeline showing current position |
| Inflection point timeline | First Value, Alignment Meeting, Goal Progress, Stakeholder Coverage — each with status |
| Active plays list | Current play (Alignment Meeting), upcoming plays, overdue plays |
| Stakeholder map | Name, title, influence tier, coverage status |
| Next Best Actions panel | Prioritized, tied to a play and a progression gap |
| "Continue" into active play | One click from account workspace into the play execution workspace |

### Surface 3: Play Execution — Alignment Meeting

| Step | Features |
|---|---|
| **Step 1: Preparation** | Customer summary, goal/value progress, risks list, expansion signals, recommended focus — all AI-generated (mocked for MVP) |
| **Step 2: Interaction Guide** | Structured agenda (6 items), required components checklist, key questions (5), stakeholder talking points |
| **Step 3: Output Capture** | Four structured fields: Meeting Summary, Goal Updates, Stakeholder Notes, Risks & Opportunities |
| **Step 4: Progression Update** | Binary: customer advanced / still progressing. Notes field. "Complete Play" CTA. |

### Navigation & Shell

| Feature | Detail |
|---|---|
| Sidebar with pipeline nav | Single nav item for MVP |
| Play step progress indicator | Shows current step of 4, completed steps, remaining steps |
| Back navigation | Account → Pipeline, Play → Account |
| Completion flow | Completing a play returns the user to the Account Workspace |

---

## Non-Goals (MVP)

These are explicitly out of scope. Do not build them.

| Item | Reason |
|---|---|
| Authentication / login | Demo uses a single hardcoded CSM identity |
| Backend / database | Mock data only |
| HubSpot / CRM integration | Not yet |
| Real AI API calls | Preparation briefs are seeded mock data that looks AI-generated |
| Plays beyond Alignment Meeting | Kickoff, Onboarding, Renew & Grow — all deferred |
| Email / notification system | Not yet |
| Multiple CSM users / team view | Single user only |
| Mobile layout | Desktop only |
| Data persistence | State resets on refresh — acceptable for demo |
| Editable account data | Read-only account records + writable play execution only |
| Health scoring | Derived from execution (future layer) |
| Reporting / analytics | Deferred |
| Settings / admin | Not yet |

---

## Acceptance Criteria

The MVP is complete when a user can:

- [ ] **AC-1** Open the app and see accounts organized across all 5 pipeline stages
- [ ] **AC-2** Identify which accounts are at risk or stalled at a glance
- [ ] **AC-3** Click into an account and see its pipeline stage, inflection point status, active plays, stakeholder map, and next best actions — without scrolling more than one page
- [ ] **AC-4** Open an active Alignment Meeting play from the account workspace
- [ ] **AC-5** Read a preparation brief with customer summary, goal progress, risks, and expansion signals before the meeting
- [ ] **AC-6** Step through a structured interaction guide with agenda, required components, and key questions
- [ ] **AC-7** Enter structured meeting outputs across four distinct fields
- [ ] **AC-8** Record whether the customer advanced and add follow-up notes
- [ ] **AC-9** Complete the play and return to the account workspace
- [ ] **AC-10** The full Alignment Meeting flow is completeable in under 5 minutes (demo path)

---

## Recommended Vertical Slice — First Working Demo

**The demo account:** Meridian Health Systems  
**Why:** Partially advanced (Advocate stage, 72% confidence), has an active Alignment Meeting play with a seeded preparation brief, realistic risks and expansion signals, mixed stakeholder coverage. Creates natural tension and clear "what to do next."

**The demo path (5 minutes):**

```
1. Open app → Pipeline View
   → CSM sees 5 accounts across 4 stages
   → Spots "Meridian Health Systems" in Advocate — Alignment Meeting due in 8 days

2. Click Meridian → Account Workspace
   → Sees: Advocate stage, 72% confidence, 18 days in stage
   → Inflection points: First Value ✓, Alignment Meeting ✓ (last one), Goal Progress pending
   → Next Best Action: "Run Alignment Meeting (due in 8 days)"
   → Active play: Alignment Meeting → "Continue"

3. Enter Play Execution — Step 1: Preparation
   → AI brief loads: customer summary, goal progress at 40%, 3 risks, 2 expansion signals
   → CSM reads: CFO not contacted, Finance Ops expansion opportunity identified

4. Step 2: Interaction Guide
   → Structured agenda, 5 key questions, required components

5. Step 3: Output Capture
   → CSM types brief outputs into 4 structured fields

6. Step 4: Progression Update
   → Marks "Customer advanced"
   → Adds next steps note
   → Clicks "Complete Play & Return to Account"

7. Returns to Meridian Account Workspace
   → Play is marked complete
```

**What the demo proves:**
- The pipeline is the organizing structure — not a dashboard
- Every account has a structured execution workspace
- AI preparation is embedded, not bolted on
- Plays are structured, consistent, and output-driven
- Execution directly ties to pipeline movement

**What the demo does NOT need to prove (yet):**
- Real AI
- Data persistence
- Multiple users
- Any play other than Alignment Meeting
