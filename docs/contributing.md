# Contributing to Xat

Thank you for your interest in contributing to Xat! This guide will help you get started.

## Getting Started

### Prerequisites

- **Node.js** >= 20
- **pnpm** >= 9
- **Docker** and **Docker Compose**
- **Git**

### Setup

```bash
# Fork and clone the repository
git clone https://github.com/your-user/xat.git
cd xat

# Install dependencies
pnpm install

# Start infrastructure services
docker compose up -d

# Run database migrations
pnpm db:migrate

# Seed initial data
pnpm db:seed

# Start development server
pnpm dev
```

## Code Conventions

### Language

**All code must be written in English.** This includes:
- Variable, function, class, and file names
- API endpoints and route paths
- Database table and column names
- Comments and docstrings
- Commit messages
- Error messages and logs

### Naming

| Context | Convention | Example |
|---------|-----------|---------|
| Files & folders | `kebab-case` | `automation-rules.ts` |
| Variables & functions | `camelCase` | `getConversations` |
| Types & interfaces | `PascalCase` | `Conversation` |
| Database tables | `snake_case` | `account_users` |
| API endpoints | `kebab-case` | `/api/v1/canned-responses` |
| Constants & enums | `UPPER_SNAKE_CASE` | `CONVERSATION_STATUS` |

### TypeScript

- Strict mode enabled (`strict: true` in tsconfig)
- Prefer `interface` over `type` for object shapes
- Use Zod for runtime validation at system boundaries
- Avoid `any` — use `unknown` and narrow with type guards

### Svelte

- Use Svelte 5 runes (`$state`, `$derived`, `$effect`)
- One component per file
- Components in `PascalCase.svelte`
- Keep components small and focused

### Database

- All schema changes go through Drizzle migrations
- Never modify existing migrations — create new ones
- Use `snake_case` for all database identifiers
- Always add indexes for foreign keys and commonly queried columns

## Git Workflow

### Branches

- `main` — stable, production-ready code
- `feature/<name>` — new features
- `fix/<name>` — bug fixes
- `refactor/<name>` — code refactoring
- `docs/<name>` — documentation changes

### Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add round-robin agent assignment
fix: resolve websocket reconnection issue on mobile
refactor: extract message parser into separate service
docs: add API channel setup guide
test: add E2E tests for conversation filters
chore: update dependencies
```

**Rules:**
- Use imperative mood ("add", not "added" or "adds")
- Keep the subject line under 72 characters
- Add a body for complex changes explaining the "why"
- Reference issue numbers when applicable (`fixes #123`)

### Pull Requests

1. Create your branch from `main`
2. Make your changes
3. Ensure all checks pass:
   ```bash
   pnpm lint
   pnpm format
   pnpm test
   pnpm build
   ```
4. Write a clear PR description with:
   - **Summary:** what changed and why
   - **Test plan:** how to verify the changes
5. Request a review

### PR Requirements

- [ ] All tests pass
- [ ] Lint and format checks pass
- [ ] Build succeeds
- [ ] Unit tests for new business logic
- [ ] E2E tests for new user-facing flows
- [ ] No `console.log` left in production code
- [ ] No hardcoded secrets or credentials

## Project Structure

```
apps/web/src/
├── lib/
│   ├── server/          # Server-only code (never imported from client)
│   │   ├── db/          # Database queries and connection
│   │   ├── services/    # Business logic services
│   │   ├── jobs/        # Background job processors
│   │   ├── channels/    # Channel-specific logic
│   │   └── auth/        # Authentication and authorization
│   ├── components/      # Reusable Svelte components
│   ├── stores/          # Svelte stores for global state
│   └── utils/           # Shared utility functions
├── routes/
│   ├── (auth)/          # Public auth routes
│   ├── (app)/           # Protected dashboard routes
│   └── api/             # REST API endpoints
└── hooks.server.ts      # Request hooks and middleware
```

### Key Principles

- **Server code stays on the server:** anything in `lib/server/` must never be imported from client components
- **Colocation:** keep related files together (e.g., a route's page, layout, and server files in the same directory)
- **Shared types:** put types used by both client and server in `packages/shared/`
- **Database schema:** all schema definitions live in `packages/db/schema/`

## Testing

### Unit Tests (Vitest)

```bash
pnpm test              # Run all unit tests
pnpm test -- --watch   # Watch mode
```

- Test business logic in `lib/server/services/`
- Test utility functions in `lib/utils/`
- Use descriptive test names: `it("should assign conversation to next available agent")`

### E2E Tests (Playwright)

```bash
pnpm test:e2e          # Run all E2E tests
```

- Test critical user flows (login, send message, resolve conversation)
- Use page object pattern for reusable interactions
- Keep E2E tests focused and independent

## Need Help?

- Open an issue for bugs or feature requests
- Start a discussion for questions or ideas
- Check existing issues before creating new ones

## License

By contributing, you agree that your contributions will be licensed under the Apache License 2.0.
