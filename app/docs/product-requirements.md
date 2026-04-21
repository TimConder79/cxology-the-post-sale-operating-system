# Product Requirements — CXology Execution Platform

**Version:** 0.1 (MVP)
**Status:** Draft
**Author:** Tim Conder

---

## Problem

Customer Success is inherently inconsistent. Playbooks exist but execution varies by individual. Health scores are subjective and lagging. Expansion happens too late—or not at all.

Existing tools optimize for **visibility**: dashboards, alerts, reporting.

Visibility does not create execution.

---

## Vision

A **system of control for post-sale execution**—ensuring that the work required to retain and grow customers actually gets done.

This platform answers two questions existing tools cannot:

> "Is the customer progressing through the journey required to retain and grow?"

> "What needs to happen next to move them forward?"

---

## Core Concepts

| Concept | Definition |
|---|---|
| **Post-Sale Pipeline** | Five structured stages — Identify → Align → Advocate → Intent → Net Revenue Close |
| **Play** | A designed interaction with entry criteria, structured execution, and defined outputs |
| **Inflection Point** | A critical milestone that must be achieved for progression (e.g., First Value, Alignment Meeting) |
| **Progression** | Movement through the pipeline measured by milestone completion, not activity |
| **Next Best Action** | AI-driven recommendation tied to a play, stage, and progression gap |

---

## MVP Scope

The MVP demonstrates the three core surfaces of the platform:

### 1. Post-Sale Pipeline View
- Accounts grouped by stage (Identify → Align → Advocate → Intent → Net Revenue Close)
- Stage-level counts and progression signals
- Per-account status: advancing / stalled / at-risk
- Entry point to the Account Execution Workspace

### 2. Account Execution Workspace
- Current pipeline stage + stage confidence
- Inflection point timeline (First Value, Alignment Meeting, Goal Progress, Stakeholder Coverage)
- Active and upcoming plays
- Stakeholder map (name, role, influence tier, coverage status)
- Next Best Action panel

### 3. Play Execution Workspace
The most important surface. Scoped to **Alignment Meeting** for MVP.

Each play has four structured steps:

| Step | Purpose |
|---|---|
| **Preparation** | AI-generated customer brief — goals, risks, expansion signals, recommended focus |
| **Interaction Guide** | Structured agenda, required components, key questions, stakeholder talking points |
| **Output Capture** | Structured fields for meeting summary, goal updates, stakeholder notes, risks/opportunities |
| **Progression Update** | Did the customer advance? Stage confidence update. Next best action. |

---

## Design Principles

1. **Progression Over Activity** — measure movement, not meetings
2. **Execution Over Visibility** — drive action, don't just display information
3. **Embedded Training** — every play teaches the user how to run it
4. **Structured, Not Open-Ended** — guided inputs, consistent outputs
5. **AI as Co-Pilot** — AI embedded in preparation, execution, and follow-up

---

## Out of Scope (MVP)

- Backend / database (use mock data)
- Authentication
- HubSpot / CRM integration
- Plays beyond Alignment Meeting (Kickoff, Onboarding, Renew & Grow, etc.)
- Predictive modeling
- Multi-user / team views
- Mobile

---

## Success Criteria (Demo)

A viewer watching a 10-minute demo should understand:

- [ ] The post-sale pipeline is the organizing structure—not a dashboard
- [ ] Each account has a dedicated execution workspace
- [ ] Plays are structured, not free-form
- [ ] AI preparation is embedded in the workflow, not bolted on
- [ ] Progression is measurable and tied to execution

---

## Target User (MVP)

**Customer Success Manager (CSM)** at a B2B SaaS company:
- Manages 10–40 accounts
- Has a defined CS motion but inconsistent execution
- Reports on NRR as a primary metric
- Uses HubSpot or a similar CRM as their system of record
