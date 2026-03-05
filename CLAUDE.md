# Xat — Project Instructions for Claude

## Overview

Xat is an open-source omnichannel customer support platform built with SvelteKit. It replicates the functionality of Chatwoot but with a modern TypeScript stack.

## Language Rules

**ALL code must be in English.** No exceptions. This includes:
- Variables, functions, classes, interfaces, types
- File and folder names
- Database tables and columns
- API endpoints and route paths
- Comments and docstrings
- Commit messages
- Error messages and log output
- Test descriptions

The README.es.md is in Spanish for the team. README.md (main) is in English.

## Tech Stack

- **Framework:** SvelteKit with Svelte 5 (runes: $state, $derived, $effect)
- **Language:** TypeScript (strict mode)
- **Database:** PostgreSQL with Drizzle ORM
- **Cache/Queue:** Redis with BullMQ for background jobs
- **Real-time:** Socket.IO for WebSocket communication
- **Storage:** S3-compatible (MinIO in dev, AWS S3 in prod)
- **Auth:** Lucia Auth
- **UI:** Tailwind CSS + shadcn-svelte
- **i18n:** Paraglide.js
- **Testing:** Vitest (unit) + Playwright (E2E)
- **Monorepo:** pnpm workspaces + Turborepo

## Naming Conventions

| Context | Convention | Example |
|---------|-----------|---------|
| Files & folders | `kebab-case` | `automation-rules.ts` |
| Variables & functions | `camelCase` | `getConversations` |
| Types & interfaces | `PascalCase` | `Conversation` |
| DB tables & columns | `snake_case` | `account_users` |
| API endpoints | `kebab-case` | `/api/v1/canned-responses` |
| Constants & enums | `UPPER_SNAKE_CASE` | `CONVERSATION_STATUS` |

## Project Structure

```
apps/web/          — Main SvelteKit app (dashboard + API)
apps/widget/       — Embeddable chat widget (Web Component)
apps/portal/       — Public Help Center (SvelteKit)
packages/db/       — Drizzle schema + DB utilities
packages/shared/   — Shared types, constants, validators (Zod)
packages/email-templates/ — Email templates
```

### Server Code

- All server-only code lives in `apps/web/src/lib/server/`
- Never import from `lib/server/` in client components
- Business logic goes in `lib/server/services/`
- Database queries go in `lib/server/db/`
- Background jobs go in `lib/server/jobs/`
- Channel-specific logic goes in `lib/server/channels/`

### Routes

- `(auth)/` — Public authentication routes
- `(app)/` — Protected dashboard routes (require login)
- `api/v1/` — Public REST API
- `widget/` — Widget API endpoints
- `super-admin/` — Super admin console

## Key Patterns

### Database

- Use Drizzle ORM for all database operations
- Schema files in `packages/db/schema/`
- All tables use `snake_case`
- Every table should have `id`, `created_at`, `updated_at`
- Multi-tenant: most tables have `account_id` foreign key
- Always filter by `account_id` in queries (data isolation)

### API Design

- RESTful endpoints under `/api/v1/`
- Authentication via API key header or session cookie
- Validate input with Zod schemas
- Return consistent JSON structure: `{ data, meta? }` or `{ error }`
- Use proper HTTP status codes

### Real-time

- Socket.IO for WebSocket connections
- Events follow pattern: `resource:action` (e.g., `conversation:created`, `message:new`)
- Rooms scoped by account: `account:${accountId}`

### Background Jobs

- BullMQ for async processing
- Job processors in `lib/server/jobs/`
- Use for: email sending, webhook delivery, automation rule execution, channel syncing

## Testing

- Unit tests with Vitest for business logic and utilities
- E2E tests with Playwright for critical user flows
- Test files: `*.test.ts` for unit, `*.spec.ts` for E2E
- Descriptive test names: `it("should assign conversation to next available agent")`

## Commits

Follow Conventional Commits in English:
```
feat: add round-robin agent assignment
fix: resolve websocket reconnection on mobile
refactor: extract message parser into service
```

## Do NOT

- Use `any` type — use `unknown` and narrow
- Leave `console.log` in production code
- Hardcode secrets or credentials
- Skip input validation at API boundaries
- Import server code from client components
- Modify existing database migrations (create new ones)
- Use inline styles (use Tailwind classes)
