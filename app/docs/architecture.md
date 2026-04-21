# Technical Architecture — CXology Execution Platform

**Version:** 0.1 (MVP)
**Status:** Draft

---

## Overview

The MVP is a client-side React application with no backend. All data is seeded as mock data at startup. This enables fast iteration and a strong demo without infrastructure dependencies.

When ready to productionize, the data layer is the only thing that changes — the component and routing architecture remains stable.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | React 18 + TypeScript | Industry standard for B2B SaaS UIs; strong ecosystem |
| Build tool | Vite | Near-instant dev server; fast HMR |
| Styling | Tailwind CSS | Utility-first; rapid iteration without style files |
| Routing | React Router v6 | Declarative; supports nested layouts |
| State | React Context + useState | Sufficient for MVP; no external state library needed |
| Icons | Lucide React | Consistent, lightweight icon set |
| AI (future) | Anthropic Claude API | Preparation briefs, output summaries, next best actions |
| CRM (future) | HubSpot API | Account data, contacts, deal records |
| Auth (future) | Clerk or Supabase Auth | — |
| DB (future) | Supabase (Postgres) | — |

---

## Folder Structure

```
app/
├── index.html                  # Vite entry point
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
│
├── docs/
│   ├── product-requirements.md
│   └── architecture.md
│
└── src/
    ├── main.tsx                # React root
    ├── App.tsx                 # Router + layout
    ├── index.css               # Tailwind base imports
    │
    ├── types/
    │   └── index.ts            # All shared TypeScript types
    │
    ├── data/
    │   └── mockAccounts.ts     # Seed data — accounts, plays, inflection points
    │
    ├── lib/
    │   └── utils.ts            # Shared helpers (cn, formatDate, etc.)
    │
    ├── hooks/
    │   └── useAccounts.ts      # Account state + mutations
    │
    ├── components/
    │   ├── ui/                 # Primitive components (Button, Badge, Card, etc.)
    │   ├── layout/             # Shell, Sidebar, TopBar
    │   ├── pipeline/           # PipelineColumn, AccountCard, StageHeader
    │   ├── account/            # InflectionTimeline, PlayList, StakeholderMap, NextBestAction
    │   └── plays/              # PlayStep, PrepBrief, InteractionGuide, OutputCapture, ProgressionUpdate
    │
    └── pages/
        ├── PipelineView.tsx    # /pipeline — primary navigation
        ├── AccountWorkspace.tsx # /accounts/:id — per-account execution hub
        └── PlayExecution.tsx   # /accounts/:id/plays/:playId — active play runner
```

---

## Data Model (MVP)

```typescript
// Five pipeline stages
type PipelineStage = 'identify' | 'align' | 'advocate' | 'intent' | 'nrr_close'

// Progression signal for an account
type ProgressionStatus = 'advancing' | 'stalled' | 'at_risk'

// A customer account
interface Account {
  id: string
  name: string
  arr: number
  stage: PipelineStage
  stageConfidence: number          // 0–100
  progressionStatus: ProgressionStatus
  renewalDate: string
  csm: string
  inflectionPoints: InflectionPoint[]
  plays: Play[]
  stakeholders: Stakeholder[]
  nextBestActions: NextBestAction[]
}

// A tracked milestone
interface InflectionPoint {
  id: string
  type: 'first_value' | 'alignment_meeting' | 'goal_progress' | 'stakeholder_coverage' | 'insight_delivery'
  label: string
  status: 'achieved' | 'pending' | 'overdue' | 'not_started'
  achievedDate?: string
  dueDate?: string
}

// A lifecycle play
interface Play {
  id: string
  type: PlayType
  label: string
  status: 'active' | 'upcoming' | 'overdue' | 'completed'
  dueDate?: string
  completedDate?: string
  execution?: PlayExecution     // populated once play is started
}

// The four-step execution record for a running play
interface PlayExecution {
  playId: string
  preparation?: PrepBrief       // AI-generated
  interaction?: InteractionRecord
  outputs?: OutputCapture
  progression?: ProgressionUpdate
  startedAt: string
  completedAt?: string
}

interface Stakeholder {
  id: string
  name: string
  title: string
  influence: 'champion' | 'decision_maker' | 'end_user' | 'blocker'
  coverageStatus: 'engaged' | 'dormant' | 'not_contacted'
}

interface NextBestAction {
  id: string
  label: string
  reason: string
  linkedPlayType?: PlayType
  linkedStage?: PipelineStage
  priority: 'high' | 'medium' | 'low'
}
```

---

## Routing

```
/                           → redirect to /pipeline
/pipeline                   → PipelineView (primary nav)
/accounts/:id               → AccountWorkspace
/accounts/:id/plays/:playId → PlayExecution
```

---

## AI Integration (Future)

AI is not mocked in the MVP — preparation briefs and next best actions are seeded as static data that looks AI-generated. When wiring up the real AI layer:

- **Preparation brief** → Claude API call with account context as input
- **Next best actions** → Claude evaluates inflection point gaps + stage position
- **Output capture suggestions** → Claude processes meeting notes into structured fields

All AI calls are server-side (API route) to protect the API key. The client sends account context; the server returns structured JSON.

---

## Deployment (MVP)

Vite builds a static bundle. Can be deployed to:
- **Vercel** (recommended — zero config, instant preview URLs)
- **Netlify**
- **GitHub Pages** (same repo, `/app/dist` subfolder)

No environment variables required for MVP (mock data only).
