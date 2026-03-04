# ⚔️ Embark — Client Onboarding Tracker

<div align="center">

### **Client onboarding, leveled up.** 🚀

[![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Tests](https://img.shields.io/badge/Tests-52_passing-22c55e?style=for-the-badge)](#)
[![Version](https://img.shields.io/badge/Version-7.0-f59e0b?style=for-the-badge)](#)
[![PWA](https://img.shields.io/badge/PWA-installable-a855f7?style=for-the-badge)](#)

*Embark replaces the chaos of spreadsheets and scattered notes with a structured, gamified system that keeps every client onboarding on track — from first call to go-live.*

</div>

---

## 🌟 Why Embark?

Most onboarding tools are either too simple (a checklist app) or too complex (an enterprise CRM nobody actually uses). Embark hits the sweet spot — it's powerful enough to handle real operational complexity, but designed to be fun to use every single day.

- ✅ **Full visibility** across every active client at a glance
- 🎮 **Gamified** — earn XP, level up, unlock achievements
- ⚡ **Blazing fast** — runs entirely in the browser, no backend required
- 🧩 **Modular** — configure exactly the dashboard you want
- 🤖 **AI-assisted** — health summaries, risk briefs, portfolio intelligence, proactive anomaly detection
- 📦 **PWA** — install it like a native app, works offline

---

## 🆕 What's New in v7.0 — "Embark Unstoppable"

### 🗂️ Global Task Kanban Board
A full **drag-and-drop task board** spanning every active client. Four columns — To Do, In Progress, Blocked, Done. Filter down to specific clients so the board stays focused instead of showing hundreds of cards. Click any card to open a slide-in drawer with subtasks, comments, and status controls. Every client also gets its own board tab in their detail view.

### 🤝 Two-Way Client Portal
The client portal is no longer read-only. Clients can now **check off their own tasks**, leave per-task comments, post project status updates, and attach files — all from the same shareable URL they already have. CSMs see a "Last viewed by client: X ago" badge and can toggle between Client View and a CSM Summary that shows portal activity at a glance.

### 🧠 AI Proactive Intelligence
AI that acts before you ask:
- **AI Risk Brief** — per-client panel with a Low / Medium / High / Critical tier badge. Critical tier pulses red.
- **AI Portfolio Brief** — dashboard widget that scans all active clients and surfaces the top 3 at-risk ones with recommended plays.
- **Anomaly Detection** — background monitor checks every 60 seconds for health drops and fires alerts to the Morning Briefing automatically.
- **AI Draft** — ✨ button in the Communication Timeline pre-fills your summary based on recent activity.
- **"Why at risk?"** — 🧠 button in Focus Mode opens an AI chat pre-seeded with that client's context for instant triage.

### 📋 Smart Intake Forms
Build intake forms with **7 field types and conditional logic**, publish them at a public `/#form/{id}` URL, and Embark automatically creates the client and applies your chosen template when a prospect submits. No manual entry needed.

### ⏱️ Time Tracking
Track every minute against real client work:
- **Live timer** with a pulsing red indicator on the active task
- **Manual log** with hours/minutes, billable toggle, and note
- **Per-client Time Report** tab showing total, billable, and non-billable hours broken down by task
- **Time Report dashboard widget** ranking your top clients by hours

---

## ✨ Feature Highlights

### 📊 Personalized Dashboard
Choose from **15 configurable widgets** via **Build-A-Dash** — each user picks exactly what they want to see. Stats bar, client health grid, SLA status, CRM pipeline, renewals countdown, go-live dates, AI portfolio brief, time report, and more. Your dashboard, your way.

### 🩺 Onboarding Health Score
Every client gets a **0–100 health score** computed in real-time from task completion rate, SLA status, communication recency, and blocked tasks. Color-coded badges (green / yellow / red) make at-risk clients impossible to miss.

### ⚔️ Gamification & Character Classes
Pick your hero class and earn XP for doing your job:

| Class | Role | XP Bonus |
|-------|------|----------|
| ⚔️ Paladin | The Protector | On-time completions & unblocking tasks |
| 🧙 Wizard | The Strategist | AI features & automations |
| 🏹 Ranger | The Scout | Communications & notes logged |
| 🗡️ Rogue | The Executor | Early completions & client graduations |

Level up, unlock **deeds** (achievements), and compete on the **🏆 Hall of Heroes** leaderboard with your team.

### 🤖 AI-Powered Features
- **Health Pulse** — 3–5 sentence AI health summary for any client, cached and refreshable
- **AI Risk Brief** — tier-rated risk assessment (Low → Critical) with proactive alerts
- **AI Portfolio Brief** — portfolio-wide analysis surfacing at-risk clients with recommended plays
- **Kickoff Pack Generator** — one-click AI draft of a client-facing kickoff email + internal team brief
- **Smart Task Suggestions** — AI recommends checklist tasks based on services and go-live date

### ⚙️ Automation Engine
Build no-code automation rules: *"When priority changes to High → notify the team."* Triggers, conditions, and actions — all visual, no code required.

### 🚪 Phase Gates
Organize work into phases. Tasks in later phases are **locked** until all prior-phase work is done. No more jumping ahead and leaving gaps.

### 🎓 Client Graduation Ceremony
When every checklist item is done, Embark fires **confetti** 🎉, generates an AI handoff summary, pins it as a note, and awards 75 XP. Completing a client actually feels like an achievement.

### 📋 Client Portal
Generate a beautiful, **shareable two-way portal** for your clients. Clients can check off tasks, leave comments, post status updates, and attach files — all from the same URL. Embark shows CSMs when the client last visited.

---

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| 🖼️ Framework | React 19 + TypeScript |
| ⚡ Build | Vite |
| 🎨 Styling | Tailwind CSS v4 |
| 💾 State | localStorage via custom hooks |
| 🧪 Testing | Vitest — 52 tests passing (104 with worktree) |
| 📱 PWA | vite-plugin-pwa (installable, offline-capable) |
| 🔍 Monitoring | Sentry (production only) |
| 🚂 Deployment | Docker + nginx, Railway-ready |

---

## 🚀 Getting Started

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

Open [http://localhost:5173](http://localhost:5173), register an account, and the **5-step onboarding wizard** will walk you through everything. ✨

---

## 📦 Everything That's In The Box

| Feature | What It Does |
|---------|-------------|
| 🔐 Auth | Per-user accounts with login/register; localStorage now, backend-ready |
| 🧭 Onboarding Wizard | 5-step guided setup: profile → team → class → dashboard |
| 📊 Build-A-Dash | 15 configurable widgets, layout saved per user |
| 👥 Client List | Filter, sort, search, bulk actions, health badges |
| 🗂️ Task Kanban Board | Drag-and-drop board across all clients; filter to specific clients |
| ✅ Tasks View | Cross-client task list with filters, due dates, assignees |
| 📅 Planner | Calendar-based planner with daily planning mode |
| ⚙️ Automations | No-code rule engine with triggers, conditions, and actions |
| 📈 Reports | 10+ widgets: velocity trends, bottleneck heatmaps, phase duration |
| 🏆 Hall of Heroes | Team leaderboard with XP, level, class, and deed badges |
| 🔗 Integrations | Webhook delivery with retry logic and delivery logs |
| 🤖 AI Center | Health Pulse, Risk Brief, Portfolio Brief, Kickoff Pack, Task Suggestions |
| 🤝 Two-Way Portal | Clients check tasks, post updates, attach files from their portal URL |
| 📋 Intake Forms | Form builder with conditional logic; auto-creates clients on submit |
| ⏱️ Time Tracking | Live timer, manual log, billable split, per-client report |
| 📱 PWA | Install to desktop, works offline |
| 🌗 Dark Mode | Full dark/light theme support |
| ⌨️ Command Palette | `Ctrl+K` global search and navigation |
| 📤 Export | Excel status reports, HTML client portals |
| 🔔 SLA Tracking | Warnings and breach alerts per client |
| 📝 Notes & Comms | Rich notes with templates + full communication history with AI Draft |
| 🪄 Milestones | Key events tracked separately from tasks |

---

## 🚂 Deploying to Railway

The project is fully pre-configured for one-click Railway deployment:

1. Push to GitHub
2. Connect your repo at [railway.app](https://railway.app)
3. Optionally add `VITE_SENTRY_DSN` for error monitoring
4. Railway auto-detects `railway.toml` → builds via `Dockerfile` → deploys 🎉

See `.env.example` for all environment variables.

---

## 🗺️ Roadmap

- [ ] 🗄️ PostgreSQL backend (Railway) for real multi-user persistence
- [ ] 🔒 RBAC — role-based permissions per team
- [ ] 📧 Email notifications
- [ ] 📱 Native mobile app

---

<div align="center">

Built with ❤️ using React + TypeScript + Vite

*Designed for ops teams who onboard clients at scale and want to actually enjoy doing it.*

</div>
