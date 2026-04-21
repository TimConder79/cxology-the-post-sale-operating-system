# CXology Execution Platform — App

A Post-Sale Execution Platform. A system of control for retention and growth.

---

## What This Is

This is the web application for the CXology Execution Platform, built inside the `/app` directory of the CXology repository. It is a separate product from the GitHub Pages site at the repo root, which serves as the conceptual framework and reference material.

**The existing site (`/`) is read-only reference material. All app work lives in `/app`.**

---

## Structure

```
app/
├── docs/
│   ├── product-requirements.md   # What we're building and why
│   └── architecture.md           # Tech stack, data model, folder layout
│
└── src/
    ├── pages/          # Top-level route views
    ├── components/     # UI components organized by domain
    ├── types/          # TypeScript type definitions
    ├── data/           # Mock seed data
    ├── hooks/          # Shared React hooks
    └── lib/            # Utility functions
```

---

## Getting Started

```bash
cd app
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Key Routes

| Route | View |
|---|---|
| `/pipeline` | Post-Sale Pipeline — accounts grouped by stage |
| `/accounts/:id` | Account Execution Workspace |
| `/accounts/:id/plays/:playId` | Play Execution — 4-step guided workflow |

---

## Docs

- [Product Requirements](docs/product-requirements.md) — scope, principles, MVP definition
- [Architecture](docs/architecture.md) — tech stack, data model, folder structure, future AI/CRM integration

---

## MVP Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Router v6
- Lucide React (icons)
- Mock data (no backend required)
