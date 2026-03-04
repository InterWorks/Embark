# Embark - Planned Changes & Future Roadmap

> This file tracks planned features, improvements, and architectural changes for Embark.

---

## Priority Legend
- **P0** - Critical / Do First
- **P1** - High Priority
- **P2** - Medium Priority
- **P3** - Nice to Have

---

## In Progress

_No tasks currently in progress_

---

## Planned - Short Term

### UI/UX Improvements
| Feature | Priority | Notes |
|---------|----------|-------|
| Loading states | P2 | Add skeleton loaders for async operations |
| Onboarding flow | P2 | Guide new users through first client setup |
| Empty states | P2 | Better illustrations/CTAs when no data |
| Drag-and-drop time blocks | P2 | Reorder/reschedule blocks in calendar |

### Code Quality
| Feature | Priority | Notes |
|---------|----------|-------|
| Unit tests | P1 | Jest + React Testing Library for hooks/components |
| E2E tests | P2 | Playwright for critical user flows |
| Performance audit | P2 | React DevTools profiling, memo optimization |

---

## Planned - Medium Term

### Authentication & Team Collaboration
| Feature | Priority | Notes |
|---------|----------|-------|
| Backend API | P0 | Node/Express or Supabase |
| Database setup | P0 | PostgreSQL for persistent storage |
| User authentication | P0 | Email/password + OAuth providers |
| SSO integration | P1 | SAML/OIDC via Auth0, Clerk, or WorkOS |
| Team workspaces | P1 | Shared clients, tasks, planner |
| Role-based permissions | P1 | Admin, Member, Viewer roles |
| Real-time collaboration | P2 | Live updates when team members make changes |
| Activity feed | P2 | See what teammates are working on |
| @mentions | P2 | Tag team members in comments/notes |

### Data & Security
| Feature | Priority | Notes |
|---------|----------|-------|
| Data migration tool | P0 | Move localStorage data to database |
| Audit logging | P1 | Track who changed what and when |
| Data encryption | P1 | Encrypt sensitive client data at rest |
| GDPR compliance | P2 | Data export, deletion requests |
| Backup/restore from cloud | P2 | Automatic backups to user's cloud storage |

---

## Planned - Long Term

### Integrations
| Feature | Priority | Notes |
|---------|----------|-------|
| Real Google Calendar sync | P1 | OAuth + Google Calendar API |
| Real Outlook sync | P1 | Microsoft Graph API |
| Slack integration | P2 | Notifications, slash commands |
| Zapier/Make integration | P2 | Connect to 1000s of apps |
| Email integration | P2 | Send emails from within app |
| CRM imports | P3 | Import from Salesforce, HubSpot |

### Advanced Features
| Feature | Priority | Notes |
|---------|----------|-------|
| Client portal | P2 | Clients can view their own progress |
| Invoicing | P2 | Generate invoices from tracked time |
| Reporting dashboard | P2 | Analytics on team productivity |
| Mobile app | P3 | React Native or PWA |
| Offline mode | P3 | Work without internet, sync later |
| AI assistant improvements | P3 | Smarter suggestions, auto-scheduling |

---

## Completed

| Feature | Completed | Notes |
|---------|-----------|-------|
| Multi-contact support | 2026-02-11 | Multiple points of contact per client with name, email, phone, title, primary flag |
| Team-based client assignments | 2026-02-11 | Replace free text with team member selection, multiple assignees with roles |
| Customizable assignment roles | 2026-02-11 | Delivery Lead, Account Manager, TAM, etc. - fully customizable |
| Complete app backup/restore | 2026-02-11 | Export/import ALL app data, not just clients |
| Error boundary | 2026-02-11 | Graceful error handling with recovery UI |
| Keyboard shortcuts (Planner) | 2026-02-11 | Escape to close panels/modals |
| Planner time block CRUD | 2026-02-11 | Create, edit, delete time blocks |
| Day detail panel | 2026-02-11 | Click day to see journal, tasks, blocks |
| Daily journal | 2026-02-11 | Auto-save notes + daily goals |
| Client/task integration | 2026-02-11 | Link time blocks, view tasks by day |

---

## Architecture Notes

### Current Stack
- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS 4
- **State**: localStorage via custom hooks
- **No backend** - fully client-side

### Proposed Stack for Team Features
- **Frontend**: Same (React + Vite)
- **Backend**: Supabase (recommended) or Node/Express
- **Database**: PostgreSQL (via Supabase or self-hosted)
- **Auth**: Supabase Auth or Auth0/Clerk for SSO
- **Real-time**: Supabase Realtime or Socket.io
- **Hosting**: Vercel (frontend) + Supabase (backend)

### Migration Strategy
1. Set up Supabase project with schema matching current types
2. Add Supabase client to React app
3. Create auth context and protected routes
4. Migrate hooks one-by-one (useClients, useDailyPlanner, etc.)
5. Add data migration utility to move localStorage to database
6. Add team/workspace layer on top

---

## Ideas Backlog

_Unrefined ideas to consider later:_

- Time tracking with start/stop timer
- Pomodoro mode for focus sessions
- Weekly/monthly planner views
- Recurring time blocks
- Templates for common day structures
- Goal tracking beyond daily (weekly, quarterly OKRs)
- Client satisfaction scoring
- Kanban view for time blocks
- Calendar heatmap for productivity visualization
