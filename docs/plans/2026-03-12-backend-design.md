# Backend Design — Embark

**Date:** 2026-03-12
**Status:** Approved
**Author:** Cody Alexander

---

## Overview

Add a production backend to Embark — replacing the current localStorage-only architecture with a persistent, multi-user, server-backed system. The app currently has no backend; all data lives in each user's browser. This design covers the full stack: database, API, auth, and migration strategy.

**Goals:**
- Shared data — all 30–50 InterWorks users see the same clients, tasks, and studio pages
- Real persistence — data survives browser clears, device switches, and deploys
- Proper auth — replace `btoa()` placeholder with bcrypt + JWT sessions + Cloudflare Access SSO
- Server-side execution — real webhook dispatch, email sending, automation triggers

**Non-goals (deferred):**
- Multi-tenancy (single InterWorks org only)
- Real-time collaborative editing
- Mobile app

---

## Architecture

### Stack

| Layer | Choice | Reason |
|---|---|---|
| API framework | Hono | TypeScript-first, lightweight, Railway-friendly |
| ORM | Drizzle | TypeScript-native schema, excellent migrations, no magic |
| Database | PostgreSQL (Railway plugin) | 1-click setup, same project, `DATABASE_URL` auto-injected |
| Auth | bcrypt + JWT + Cloudflare Access | Secure passwords now, SSO later |
| Runtime | Node.js 20 | Same ecosystem as frontend |

### Project structure

```
client-onboarding-tracker/
├── src/                      ← existing React frontend (unchanged)
├── server/
│   ├── src/
│   │   ├── index.ts          ← Hono app entry point
│   │   ├── routes/           ← one file per domain
│   │   │   ├── auth.ts
│   │   │   ├── clients.ts
│   │   │   ├── studio.ts
│   │   │   ├── templates.ts
│   │   │   ├── buds.ts
│   │   │   ├── automations.ts
│   │   │   ├── webhooks.ts
│   │   │   ├── forms.ts
│   │   │   ├── users.ts
│   │   │   ├── gamification.ts
│   │   │   └── services.ts
│   │   ├── db/
│   │   │   ├── schema.ts     ← Drizzle schema (all 28 tables)
│   │   │   ├── index.ts      ← db connection
│   │   │   └── migrations/   ← generated SQL migrations
│   │   └── middleware/
│   │       ├── auth.ts       ← session JWT verification
│   │       └── cfAccess.ts   ← Cloudflare Access JWT verification
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile.api        ← NEW: API service
├── Dockerfile                ← existing frontend (unchanged)
└── railway.toml              ← updated: references both services
```

### Railway deployment

Two services in one Railway project, one GitHub repo:
- **`web`** — existing nginx frontend (Dockerfile, unchanged)
- **`api`** — Hono Node.js server (Dockerfile.api, new)
- **`Postgres`** — Railway plugin, `DATABASE_URL` auto-injected into `api` service

---

## Database Schema

28 tables. Normalized where data needs querying; JSONB for complex nested payloads that are always loaded together.

### JSONB usage rationale
- `checklist_items.subtasks/comments/attachments` — nested arrays never queried independently
- `bud_conversations.messages` — append-only, always fetched as a whole
- `studio_pages.content` / `studio_templates.content` — Tiptap JSONContent, opaque to DB
- `automation_rules.actions/conditions` — structured config, not filtered
- `onboarding_phases.gate_criteria` — complex nested object

### Full schema

```sql
-- AUTH
CREATE TABLE users (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email               TEXT UNIQUE NOT NULL,
  username            TEXT UNIQUE NOT NULL,
  password_hash       TEXT NOT NULL,
  role                TEXT NOT NULL DEFAULT 'member',
  avatar_url          TEXT,
  character_class     TEXT,
  team_id             UUID,
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  preferences         JSONB NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CLIENTS
CREATE TABLE clients (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name               TEXT NOT NULL,
  status             TEXT NOT NULL DEFAULT 'active',
  lifecycle_stage    TEXT NOT NULL DEFAULT 'onboarding',
  industry           TEXT,
  company_size       TEXT,
  website            TEXT,
  health_score_total INTEGER NOT NULL DEFAULT 0,
  assigned_to        UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by         UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE client_contacts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  email      TEXT,
  phone      TEXT,
  role       TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE client_assignments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'member',
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, user_id)
);

CREATE TABLE account_info (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id      UUID UNIQUE NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  mrr            NUMERIC(12,2),
  arr            NUMERIC(12,2),
  contract_value NUMERIC(12,2),
  contract_start DATE,
  contract_end   DATE,
  renewal_date   DATE,
  nps_score      INTEGER,
  payment_status TEXT,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE custom_fields (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  key       TEXT NOT NULL,
  value     TEXT,
  type      TEXT NOT NULL DEFAULT 'text'
);

CREATE TABLE tags (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name  TEXT UNIQUE NOT NULL,
  color TEXT
);

CREATE TABLE client_tags (
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  tag_id    UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (client_id, tag_id)
);

-- TASKS & PROGRESS
CREATE TABLE checklist_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'pending',
  due_date    TIMESTAMPTZ,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  phase       TEXT,
  priority    TEXT NOT NULL DEFAULT 'medium',
  depends_on  UUID[],
  recurrence  JSONB,
  subtasks    JSONB NOT NULL DEFAULT '[]',
  comments    JSONB NOT NULL DEFAULT '[]',
  attachments JSONB NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE onboarding_phases (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  phase_order   INTEGER NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending',
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  gate_criteria JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE milestones (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  due_date     DATE,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE success_plans (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  start_date  DATE,
  end_date    DATE,
  status      TEXT NOT NULL DEFAULT 'active',
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE success_plan_tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  success_plan_id UUID NOT NULL REFERENCES success_plans(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending',
  due_date        DATE,
  assigned_to     UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- COMMUNICATION
CREATE TABLE communication_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  subject     TEXT,
  content     TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  metadata    JSONB NOT NULL DEFAULT '{}'
);

-- STUDIO
CREATE TABLE studio_pages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT NOT NULL DEFAULT 'Untitled',
  icon       TEXT NOT NULL DEFAULT '📄',
  content    JSONB NOT NULL DEFAULT '{"type":"doc","content":[]}',
  parent_id  UUID REFERENCES studio_pages(id) ON DELETE SET NULL,
  is_pinned  BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE studio_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  category    TEXT NOT NULL,
  content     JSONB NOT NULL DEFAULT '{"type":"doc","content":[]}',
  author      TEXT,
  author_role TEXT,
  is_built_in BOOLEAN NOT NULL DEFAULT false,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TEMPLATES
CREATE TABLE email_templates (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  subject    TEXT NOT NULL,
  body       TEXT NOT NULL,
  variables  JSONB NOT NULL DEFAULT '[]',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notes_templates (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  content    TEXT NOT NULL,
  variables  JSONB NOT NULL DEFAULT '[]',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- FORMS
CREATE TABLE forms (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT,
  fields      JSONB NOT NULL DEFAULT '[]',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE form_responses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id      UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  client_id    UUID REFERENCES clients(id) ON DELETE SET NULL,
  data         JSONB NOT NULL DEFAULT '{}',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI
CREATE TABLE buds (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  icon          TEXT,
  color         TEXT,
  type          TEXT NOT NULL DEFAULT 'custom',
  description   TEXT,
  created_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE bud_conversations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bud_id     UUID NOT NULL REFERENCES buds(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id  UUID REFERENCES clients(id) ON DELETE SET NULL,
  messages   JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AUTOMATIONS
CREATE TABLE automation_rules (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  trigger           TEXT NOT NULL,
  conditions        JSONB NOT NULL DEFAULT '{}',
  actions           JSONB NOT NULL DEFAULT '[]',
  enabled           BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  trigger_count     INTEGER NOT NULL DEFAULT 0,
  created_by        UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- WEBHOOKS
CREATE TABLE webhook_endpoints (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url         TEXT NOT NULL,
  secret_hash TEXT,
  events      JSONB NOT NULL DEFAULT '[]',
  enabled     BOOLEAN NOT NULL DEFAULT true,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE webhook_deliveries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id       UUID NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  event_type        TEXT NOT NULL,
  payload           JSONB NOT NULL DEFAULT '{}',
  status            TEXT NOT NULL DEFAULT 'pending',
  attempts          INTEGER NOT NULL DEFAULT 0,
  last_attempted_at TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- GAMIFICATION
CREATE TABLE gamification_state (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  xp         INTEGER NOT NULL DEFAULT 0,
  level      INTEGER NOT NULL DEFAULT 1,
  streak     INTEGER NOT NULL DEFAULT 0,
  weekly_xp  INTEGER NOT NULL DEFAULT 0,
  deeds      JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SERVICES
CREATE TABLE services (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  price       NUMERIC(12,2),
  category    TEXT,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE client_services (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  service_id   UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  start_date   DATE,
  end_date     DATE,
  custom_price NUMERIC(12,2),
  notes        TEXT
);

-- INDEXES
CREATE INDEX idx_clients_status         ON clients(status);
CREATE INDEX idx_clients_lifecycle      ON clients(lifecycle_stage);
CREATE INDEX idx_clients_assigned_to    ON clients(assigned_to);
CREATE INDEX idx_clients_renewal_date   ON clients(renewal_date);
CREATE INDEX idx_clients_health_score   ON clients(health_score_total);
CREATE INDEX idx_checklist_client       ON checklist_items(client_id);
CREATE INDEX idx_checklist_due_date     ON checklist_items(due_date);
CREATE INDEX idx_checklist_assigned_to  ON checklist_items(assigned_to);
CREATE INDEX idx_checklist_status       ON checklist_items(status);
CREATE INDEX idx_comm_log_client        ON communication_log(client_id);
CREATE INDEX idx_comm_log_occurred_at   ON communication_log(occurred_at);
CREATE INDEX idx_studio_pages_parent    ON studio_pages(parent_id);
CREATE INDEX idx_sessions_token_hash    ON sessions(token_hash);
CREATE INDEX idx_sessions_expires_at    ON sessions(expires_at);
CREATE INDEX idx_webhook_del_status     ON webhook_deliveries(status);
CREATE INDEX idx_bud_conv_user          ON bud_conversations(user_id);
```

---

## API Design

Base URL: `/api/v1`

### Response envelope
```json
{ "data": <T>, "error": null }
{ "data": null, "error": "message", "code": "ERROR_CODE" }
```
Lists: `{ "data": [], "total": 42, "page": 1, "limit": 25 }`

### Middleware stack (in order)
1. `cors` — allow requests from Railway frontend domain
2. `cfAccess` — verify `CF-Access-Jwt-Assertion` header when present
3. `auth` — verify `Authorization: Bearer <token>` session JWT
4. `logger` — request/response logging

### Endpoints

```
-- Auth
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
GET    /api/v1/auth/me

-- Clients
GET    /api/v1/clients              ?status, lifecycle, assignedTo, tag, search, page, limit
POST   /api/v1/clients
GET    /api/v1/clients/:id
PATCH  /api/v1/clients/:id
DELETE /api/v1/clients/:id
GET    /api/v1/clients/:id/contacts
POST   /api/v1/clients/:id/contacts
PATCH  /api/v1/clients/:id/contacts/:contactId
DELETE /api/v1/clients/:id/contacts/:contactId
GET    /api/v1/clients/:id/checklist
POST   /api/v1/clients/:id/checklist
PATCH  /api/v1/clients/:id/checklist/:itemId
DELETE /api/v1/clients/:id/checklist/:itemId
GET    /api/v1/clients/:id/phases
POST   /api/v1/clients/:id/phases
PATCH  /api/v1/clients/:id/phases/:phaseId
GET    /api/v1/clients/:id/milestones
POST   /api/v1/clients/:id/milestones
PATCH  /api/v1/clients/:id/milestones/:milestoneId
GET    /api/v1/clients/:id/communication-log
POST   /api/v1/clients/:id/communication-log
GET    /api/v1/clients/:id/account-info
PUT    /api/v1/clients/:id/account-info
GET    /api/v1/clients/:id/success-plans
POST   /api/v1/clients/:id/success-plans
PATCH  /api/v1/clients/:id/success-plans/:planId
GET    /api/v1/clients/:id/services
POST   /api/v1/clients/:id/services
DELETE /api/v1/clients/:id/services/:serviceId
GET    /api/v1/clients/:id/assignments
POST   /api/v1/clients/:id/assignments
DELETE /api/v1/clients/:id/assignments/:userId

-- Tags
GET    /api/v1/tags
POST   /api/v1/tags
DELETE /api/v1/tags/:id

-- Studio
GET    /api/v1/studio/pages
POST   /api/v1/studio/pages
GET    /api/v1/studio/pages/:id
PATCH  /api/v1/studio/pages/:id
DELETE /api/v1/studio/pages/:id
GET    /api/v1/studio/templates
POST   /api/v1/studio/templates
PATCH  /api/v1/studio/templates/:id
DELETE /api/v1/studio/templates/:id
POST   /api/v1/studio/templates/:id/use

-- Templates
GET    /api/v1/templates/email
POST   /api/v1/templates/email
PATCH  /api/v1/templates/email/:id
DELETE /api/v1/templates/email/:id
GET    /api/v1/templates/notes
POST   /api/v1/templates/notes
PATCH  /api/v1/templates/notes/:id
DELETE /api/v1/templates/notes/:id
GET    /api/v1/templates/checklist
POST   /api/v1/templates/checklist
PATCH  /api/v1/templates/checklist/:id
DELETE /api/v1/templates/checklist/:id

-- AI / Buds
GET    /api/v1/buds
POST   /api/v1/buds
PATCH  /api/v1/buds/:id
DELETE /api/v1/buds/:id
GET    /api/v1/buds/:id/conversations
POST   /api/v1/buds/:id/conversations
GET    /api/v1/buds/:id/conversations/:convId
POST   /api/v1/buds/:id/conversations/:convId/messages

-- Automations
GET    /api/v1/automations
POST   /api/v1/automations
PATCH  /api/v1/automations/:id
DELETE /api/v1/automations/:id
POST   /api/v1/automations/:id/trigger

-- Webhooks
GET    /api/v1/webhooks/endpoints
POST   /api/v1/webhooks/endpoints
PATCH  /api/v1/webhooks/endpoints/:id
DELETE /api/v1/webhooks/endpoints/:id
GET    /api/v1/webhooks/deliveries
POST   /api/v1/webhooks/endpoints/:id/test

-- Forms (POST /responses is public — no auth)
GET    /api/v1/forms
POST   /api/v1/forms
GET    /api/v1/forms/:id
PATCH  /api/v1/forms/:id
DELETE /api/v1/forms/:id
POST   /api/v1/forms/:id/responses
GET    /api/v1/forms/:id/responses

-- Team / Users
GET    /api/v1/users
GET    /api/v1/users/:id
PATCH  /api/v1/users/:id
DELETE /api/v1/users/:id
GET    /api/v1/team/settings
PATCH  /api/v1/team/settings

-- Gamification
GET    /api/v1/gamification
PATCH  /api/v1/gamification
POST   /api/v1/gamification/deeds/:deedId

-- Services
GET    /api/v1/services
POST   /api/v1/services
PATCH  /api/v1/services/:id
DELETE /api/v1/services/:id
```

---

## Auth & Migration Strategy

### Auth flows

**Username/password:**
- `POST /auth/login` validates credentials with bcrypt
- Creates a row in `sessions`, returns signed JWT
- Frontend stores JWT in `httpOnly` cookie (not localStorage — XSS-safe)

**Cloudflare Access (SSO):**
- Cloudflare injects `CF-Access-Jwt-Assertion` header on every request
- Middleware verifies against Cloudflare's public certs, extracts email
- Auto-provisions user on first login if not found
- Same session JWT issued — frontend is unaware of which path was used

### Migration phases

Data migration is incremental — no big bang, no data loss:

| Phase | Scope | Frontend change |
|---|---|---|
| 1 | Auth only | Replace `btoa()` with bcrypt + JWT sessions |
| 2 | Clients | Replace `useClients` + one-time localStorage→API migration util |
| 3 | Studio, Templates, Buds | Replace hooks one by one |
| 4 | Automations, Webhooks, Forms | Enables server-side execution |
| 5 | Gamification + remaining | Final localStorage removal |

Each phase is an independent deploy. Rollback = revert one hook.

### Error handling

| HTTP status | Meaning | Frontend behavior |
|---|---|---|
| 401 | Unauthenticated | Redirect to login |
| 403 | Forbidden | Show inline permission error |
| 422 | Validation failed | Show field-level errors |
| 500 | Server error | Log to Sentry, show error toast |

All errors: `{ "data": null, "error": "human-readable", "code": "ERROR_CODE" }`
