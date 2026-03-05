# Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                   │
├──────────┬──────────┬──────────┬──────────┬─────────────────────┤
│ Dashboard│  Widget  │  Portal  │ REST API │  External Channels  │
│ (SvelteKit│ (Web     │ (Help    │ Clients  │ (WhatsApp, FB,      │
│  SSR+SPA)│Component)│ Center)  │          │  Email, Telegram...)│
└────┬─────┴────┬─────┴────┬─────┴────┬─────┴──────────┬──────────┘
     │          │          │          │                 │
     ▼          ▼          ▼          ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SvelteKit Server                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│  │  Routes   │  │   API    │  │  Widget  │  │   Webhooks     │  │
│  │ (SSR/CSR) │  │ /api/v1  │  │   API    │  │  (inbound)     │  │
│  └────┬──────┘  └────┬─────┘  └────┬─────┘  └───────┬────────┘  │
│       │              │             │                 │            │
│       ▼              ▼             ▼                 ▼            │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                    Services Layer                         │    │
│  │  ConversationService, ContactService, InboxService,       │    │
│  │  MessageService, AutomationService, ReportService, ...    │    │
│  └──────────┬────────────────┬──────────────────┬───────────┘    │
│             │                │                  │                 │
│  ┌──────────▼──┐  ┌─────────▼────┐  ┌──────────▼──────────┐     │
│  │  Drizzle DB │  │  Socket.IO   │  │    BullMQ Queue     │     │
│  │  (queries)  │  │ (real-time)  │  │  (background jobs)  │     │
│  └──────┬──────┘  └──────┬───────┘  └──────────┬──────────┘     │
└─────────┼────────────────┼──────────────────────┼────────────────┘
          │                │                      │
          ▼                ▼                      ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐
│  PostgreSQL  │  │    Redis     │  │      BullMQ Workers      │
│  (primary    │  │  (pub/sub,   │  │  ┌──────────────────┐    │
│   database)  │  │   cache,     │  │  │ Email sender      │    │
│              │  │   sessions)  │  │  │ Webhook delivery  │    │
└──────────────┘  └──────────────┘  │  │ Automation engine │    │
                                    │  │ Channel sync      │    │
┌──────────────┐                    │  │ Report generation │    │
│ MinIO / S3   │                    │  └──────────────────┘    │
│ (file        │                    └──────────────────────────┘
│  storage)    │
└──────────────┘
```

## Layer Responsibilities

### Routes Layer (`routes/`)

- HTTP request handling and response
- Input parsing (form data, query params, JSON body)
- Authentication/authorization checks via hooks
- Delegates all business logic to Services

### Services Layer (`lib/server/services/`)

- All business logic lives here
- Services are stateless functions (no classes needed)
- Each service corresponds to a domain: conversations, contacts, messages, inboxes, etc.
- Services call the DB layer for persistence and BullMQ for async work
- Services emit real-time events via Socket.IO

### Database Layer (`lib/server/db/` + `packages/db/`)

- Drizzle ORM schema definitions in `packages/db/schema/`
- Query functions in `lib/server/db/`
- All queries are scoped by `account_id` (multi-tenancy)
- Migrations managed by Drizzle Kit

### Real-time Layer (Socket.IO)

- WebSocket server integrated with SvelteKit
- Rooms scoped by account: `account:${accountId}`
- Sub-rooms for specific contexts: `conversation:${id}`, `agent:${id}`
- Events follow `resource:action` pattern

### Background Jobs (BullMQ)

- Async processing for non-blocking operations
- Separate worker process (can scale independently)
- Job types:
  - `email:send` — Send email notifications and replies
  - `webhook:deliver` — Deliver outbound webhook events
  - `automation:execute` — Run automation rule actions
  - `channel:sync` — Sync messages from external channels
  - `report:generate` — Generate report data

## Data Flow Examples

### Incoming Website Chat Message

```
1. Customer sends message via Widget (WebSocket)
2. Socket.IO server receives event
3. MessageService.create() is called
4. Message saved to PostgreSQL
5. Socket.IO emits "message:created" to account room
6. Dashboard receives event, updates conversation in real-time
7. BullMQ job queued for:
   - Automation rules evaluation
   - Agent notification (email/push if offline)
   - Webhook delivery to external systems
```

### Incoming WhatsApp Message

```
1. WhatsApp sends webhook to /api/v1/webhooks/whatsapp
2. WhatsApp channel handler parses the payload
3. Contact is found or created
4. Conversation is found or created
5. MessageService.create() saves the message
6. Socket.IO emits event to dashboard
7. BullMQ handles automation rules and notifications
```

### Agent Sends Reply

```
1. Agent types message in Dashboard
2. POST /api/v1/conversations/:id/messages
3. MessageService.create() saves message
4. Socket.IO emits to account room (other agents see it)
5. Channel-specific delivery:
   - Website: Socket.IO emits to widget room
   - Email: BullMQ job sends SMTP email
   - WhatsApp: BullMQ job calls WhatsApp API
   - etc.
```

## Multi-tenancy

- Every record belongs to an `account` (organization)
- All queries filter by `account_id`
- API authentication resolves the account from the token
- Session authentication resolves the account from the user's active account
- Super admin can access all accounts

## Authentication

### Dashboard (Session-based)

```
Login → Lucia Auth creates session → Session cookie set
→ hooks.server.ts validates session on every request
→ User and account available in locals
```

### API (Token-based)

```
Request with header: api_access_token=<token>
→ hooks.server.ts resolves user and account from token
→ User and account available in locals
```

### Widget (HMAC-based)

```
Website loads widget with websiteToken
→ Optional: HMAC signature validates contact identity
→ Contact session created
→ Messages scoped to contact + inbox
```

## Deployment Architecture

### Development

```
docker compose up -d    # PostgreSQL, Redis, MinIO
pnpm dev                # SvelteKit dev server (includes worker)
```

### Production (Docker Compose)

```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│   Traefik    │   │  SvelteKit  │   │   Worker    │
│  (reverse    │──▶│   (web +    │   │  (BullMQ    │
│   proxy)     │   │  Socket.IO) │   │  processor) │
└─────────────┘   └──────┬──────┘   └──────┬──────┘
                         │                  │
              ┌──────────▼──────────────────▼──────┐
              │          Shared Services            │
              │  ┌────────────┐  ┌──────────────┐  │
              │  │ PostgreSQL │  │    Redis      │  │
              │  └────────────┘  └──────────────┘  │
              │  ┌────────────┐                    │
              │  │   MinIO    │                    │
              │  └────────────┘                    │
              └────────────────────────────────────┘
```

### Production (Kubernetes)

- Web deployment: SvelteKit + Socket.IO (with sticky sessions)
- Worker deployment: BullMQ processors (scalable replicas)
- PostgreSQL: managed service or StatefulSet
- Redis: managed service or StatefulSet
- S3: AWS S3 or compatible service
- Ingress: with WebSocket support

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **SvelteKit for everything** | Single framework for SSR dashboard, API, and widget endpoints. Reduces complexity vs separate frontend + backend. |
| **Drizzle ORM** | Type-safe, lightweight, close to SQL. Better DX than Prisma for complex queries. |
| **BullMQ over pg-boss** | Redis-backed, battle-tested, good dashboard (Bull Board). Needed for pub/sub anyway. |
| **Socket.IO over native WS** | Room abstraction, auto-reconnection, fallback transports. Essential for multi-tenant real-time. |
| **Monorepo** | Shared types between apps, single CI pipeline, easier refactoring across packages. |
| **Lucia Auth** | Framework-agnostic, session-based, works well with SvelteKit. Simpler than NextAuth. |
| **shadcn-svelte** | Unstyled, accessible components. Full control over design without fighting a component library. |
| **Paraglide.js** | Compile-time i18n, type-safe, tree-shakeable. Best fit for SvelteKit. |
