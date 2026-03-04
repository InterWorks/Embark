# Embark — Client Onboarding Tracker

> **Client onboarding, leveled up.**

Embark is a fully-featured client onboarding tracker built for teams who want visibility, accountability, and a little fun baked into their workflow. It replaces the chaos of spreadsheets and scattered notes with a structured, gamified system that keeps every onboarding on track — from first call to go-live.

---

## What It Does

Embark gives you a centralized command center for every client you're bringing on:

- **Client management** — track status, priority, health score, assignee, go-live date, and custom fields for every client
- **Checklist system** — structured task lists with due dates, subtasks, dependencies, comments, assignees, and file attachments
- **Phase gates** — organize work into phases; tasks in later phases are locked until prior phases complete
- **SLA tracking** — define response and resolution SLAs per client; get warnings before breaches
- **Onboarding health score** — a 0–100 score computed from task completion, SLA status, communication recency, and blocked tasks
- **Team management** — multiple teams, assignable members, workload view
- **Notes & communications log** — rich notes with templates, plus a full communication history (calls, emails, meetings)
- **Milestones** — key events with target dates, tracked separately from tasks
- **Client portal** — generate a shareable read-only progress view for your clients, exportable as standalone HTML
- **Templates** — save and reuse checklist templates across clients

---

## What Makes It Cool

### Gamification
Every action earns XP. Choose a **character class** (Paladin, Wizard, Ranger, or Rogue) that gives you bonus XP for your playstyle — on-time completions, automations, communication logs, or early graduations. Level up, unlock deeds (achievements), and compete with your team on the Hall of Heroes leaderboard.

### Personalized Dashboard (v5.0)
Each user gets their own account and can configure exactly which of the 13 dashboard widgets they want to see via **Build-A-Dash**. Stats bar, client health, task overview, SLA status, CRM panel, renewals, go-live countdown — pick what matters to you.

### Automation Engine
Create no-code automation rules that fire on triggers like status changes, priority updates, or tag additions. Rules check conditions and execute actions automatically — no babysitting required.

### AI Features
- **Health Pulse** — AI-generated 3–5 sentence health summary for any client
- **Kickoff Pack Generator** — one-click AI draft of a client-facing kickoff email and internal team brief
- **Smart Task Suggestions** — AI recommends checklist tasks based on the client's services and go-live date

### Weekly Digest
A weekly XP and activity summary that shows what your team accomplished, which clients are at risk, and where the momentum is.

### CRM Overlay
Track lifecycle stage, MRR, renewal dates, and a stage funnel — without needing a separate CRM for basic pipeline visibility.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS v4 |
| State | localStorage via custom hooks (no backend) |
| Testing | Vitest — 52 tests |
| PWA | vite-plugin-pwa (installable, offline-capable) |
| Error monitoring | Sentry (production only) |
| Deployment | Docker + nginx, Railway-ready |

---

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests
npm run test:run

# Build for production
npm run build
```

Open [http://localhost:5173](http://localhost:5173). Register an account and the onboarding wizard will walk you through the rest.

---

## Feature Overview

| Feature | Description |
|---------|-------------|
| Auth | Per-user accounts with login/register; localStorage now, backend-ready |
| New-user wizard | 5-step guided setup: profile → team → class → dashboard |
| Dashboard | 13 configurable widgets, per-user layout via Build-A-Dash |
| Client list | Filter, sort, search, bulk actions, health badges |
| Task board | Cross-client task view with filters, due dates, assignees |
| Planner | Calendar-based task planner with daily planning mode |
| Automations | No-code rule engine with triggers, conditions, and actions |
| Reports | 10+ report widgets including velocity, bottleneck heatmap, phase duration |
| Hall of Heroes | Team leaderboard with XP, level, class, and deed badges |
| Integrations | Webhook delivery with retry logic and delivery logs |
| AI Center | All AI features in one place (requires local Ollama or API key) |
| PWA | Install to desktop, works offline |

---

## Deployment

The project is fully configured for Railway:

1. Push to GitHub
2. Connect repo to [Railway](https://railway.app)
3. Add `VITE_SENTRY_DSN` environment variable (optional)
4. Railway auto-detects `railway.toml` → builds via `Dockerfile` → deploys

See `.env.example` for all available environment variables.

---

## Roadmap

- [ ] PostgreSQL backend (Railway) for real multi-user persistence
- [ ] RBAC — role-based permissions per team
- [ ] Email notifications
- [ ] Native mobile app (React Native)

---

Built with React + TypeScript + Vite. Designed for internal ops teams who onboard clients at scale.
