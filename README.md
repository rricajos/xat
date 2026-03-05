# Xat

**Open-source omnichannel customer support platform.**
An alternative to Intercom, Zendesk, and Chatwoot — built from scratch with SvelteKit.

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![README en Espanol](https://img.shields.io/badge/README-Espa%C3%B1ol-orange)](README.es.md)

---

## What is Xat?

Xat is a fully open-source customer engagement platform, built from scratch with a modern stack based on **SvelteKit**. It provides an omnichannel inbox, intelligent automation, help center, and proactive campaigns — all in a single application.

> **Note:** This is an independent implementation. It is not a fork and does not contain code from any other project. All code is original, written from scratch, and licensed under Apache 2.0.

---

## Code Conventions

> **All code is written in English.** This includes: variable names, function names, class names, file names, route paths, API endpoints, database columns/tables, comments, commit messages, error messages, logs, and docstrings.

**Naming conventions:**
- Files & folders: `kebab-case` (e.g., `automation-rules.ts`, `canned-responses/`)
- Variables & functions: `camelCase` (e.g., `getConversations`, `assignedAgent`)
- Types & interfaces: `PascalCase` (e.g., `Conversation`, `InboxChannel`)
- Database tables: `snake_case` (e.g., `account_users`, `custom_attributes`)
- API endpoints: `kebab-case` (e.g., `/api/v1/canned-responses`)
- Constants & enums: `UPPER_SNAKE_CASE` (e.g., `CONVERSATION_STATUS`, `MAX_RETRY_COUNT`)
- Commits: [Conventional Commits](https://www.conventionalcommits.org/) in English (e.g., `feat: add round-robin assignment`)

---

## Stack Comparison

| Layer | Chatwoot | Xat |
|-------|----------|-----|
| Backend Framework | Ruby on Rails | SvelteKit (server) |
| Frontend Framework | Vue.js | Svelte 5 |
| Language | Ruby + JavaScript | TypeScript (full-stack) |
| Database | PostgreSQL | PostgreSQL |
| ORM | ActiveRecord | Drizzle ORM |
| Cache / Pub-Sub | Redis | Redis |
| Background Jobs | Sidekiq | BullMQ |
| Storage | ActiveStorage (S3) | S3-compatible (MinIO / AWS S3) |
| WebSockets | ActionCable | Socket.IO |
| Serialization | jbuilder | SuperJSON / native |
| CSS | Tailwind CSS | Tailwind CSS |
| UI Components | Custom Vue | shadcn-svelte |
| Widget | Vue (iframe/SDK) | Svelte (Web Component/SDK) |
| Authentication | Devise | Lucia Auth |
| i18n | Rails i18n | Paraglide.js |
| Testing | RSpec + Cypress | Vitest + Playwright |
| Containers | Docker | Docker |

---

## Complete Features

### Communication Channels (13+)

| Channel | Description |
|---------|-------------|
| **Website Live Chat** | Embeddable widget, JavaScript SDK (`xat.js`), HMAC identity validation, configurable pre-chat form, dark mode, greeting message, business hours, conversation continuity |
| **Email** | Reception via IMAP polling or forwarding webhook, sending via SMTP, email thread parsing, agent signature |
| **WhatsApp** | WhatsApp Business API (Cloud API / providers like 360dialog), templates, interactive messages |
| **Facebook Messenger** | Via Graph API, messages, images, attachments |
| **Instagram DMs** | Via Graph API, story replies, direct messages |
| **Twitter/X DMs** | Via API v2, direct messages |
| **Telegram** | Via Bot API, messages, files, stickers |
| **LINE** | Via Messaging API |
| **SMS** | Via Twilio or other providers |
| **Voice** | Inbound/outbound calls, basic voice workflows |
| **TikTok** | Direct messages (experimental) |
| **API Channel** | Generic channel via webhooks for custom integrations |
| **Custom Channels** | Extensible framework to add new channels |

### Conversations

- **States:** open, resolved, pending, snoozed
- **Priority:** urgent, high, medium, low, none
- **Assignment:** manual to agent, manual to team, round-robin, rule-based auto-assignment
- **Labels** on conversations
- **Private notes** between agents (not visible to customer)
- **Mentions** (@agent) in private notes
- **Participants** in conversations (multiple agents)
- **Typing indicators** in real time
- **Read receipts**
- **Rich text** in messages (markdown, formatting)
- **Emoji picker**
- **File attachments** (drag & drop, images, documents, videos)
- **Voice notes** (audio recording)
- **Interactive messages** (buttons, lists, cards)
- **Bulk actions** (resolve, assign, label multiple conversations)
- **Mute/unmute** conversations
- **Send transcript** via email
- **Conversation workflows:** required attributes before resolving

#### Conversation Sidebar (Right Panel)

- Contact information (name, email, phone, location, IP)
- Conversation custom attributes
- Contact custom attributes
- Contact's previous conversations
- Conversation participants
- Quick actions (assign, label, prioritize)

### Contacts

- **Unified contact profile** with complete conversation history
- **Contact notes** (log calls, meetings, manual notes)
- **Custom attributes** (text, number, date, list, checkbox, link)
- **Labels** on contacts
- **Contact segments** (advanced filters saved in sidebar)
- **Import/Export CSV** of contacts
- **Merge** duplicate contacts
- **Companies/Organizations** associated with contacts
- **Advanced filters** (by name, email, phone, location, custom attribute, operators: equals, not equals, contains, does not contain, present, not present)

### Teams & Agents

- **Teams** with assigned members
- **Predefined roles:** owner, administrator, agent
- **Custom Roles** with granular permissions
- **Agent availability:** online, busy, offline
- **Agent Capacity** — concurrent conversation limit per agent
- **Auto-assignment** respecting availability and capacity
- **Round-robin** even distribution

### Automation

#### Automation Rules (Event-based)

Rule engine with **Event -> Conditions -> Actions** structure:

**Events (Triggers):**
- Conversation created
- Conversation updated
- Conversation reopened
- Message created

**Conditions** (combinable with AND/OR):
- Message content (contains, equals)
- Status, inbox, team, assigned agent
- Labels, priority
- Contact or conversation attributes
- Contact email, phone, country
- Visitor browser language

**Actions:**
- Assign agent or team
- Add/remove label
- Change priority
- Resolve, snooze, mute
- Send message to customer
- Send email to agent/team
- Assign SLA policy

#### Macros

- Saved action sequences, executable with one click
- Sequential actions defined in order
- Private (personal) or shared (team-wide) macros
- Preview before execution
- Accessible from command bar

#### SLA Policies

- **First Response Time** — maximum time for first response
- **Next Response Time** — maximum time between responses
- **Resolution Time** — maximum time to resolve
- Alerts before breach
- Automatic assignment via automation rules
- Compliance reports (hit rate)

#### Business Hours

- Configurable schedule per inbox
- Automatic replies outside business hours
- SLA calculation respecting business hours

### Campaigns

#### Ongoing Campaigns

- Proactive messages on website live chat
- Page URL-based trigger (supports wildcards for subdirectories)
- Configurable by time on page
- Sent by bot or agent

#### One-off Campaigns

- Mass sending to audience segmented by labels
- Channels: SMS, WhatsApp (pre-approved templates)
- Scheduled sending
- Fields: title, message, inbox, audience, date/time

### Help Center (Knowledge Base)

- **Multiple portals** per account
- **Categories and subcategories** to organize content
- **Article editor** (rich text / Markdown)
- **Public portal** with full-text search
- **Multi-language** — each locale with its own URL structure
- **SEO:** meta tags, sitemap, friendly URLs
- **Custom domain** with SSL
- **Widget integration:** suggest articles before starting chat
- **Authorship:** each article has an assigned author

### Reports & Analytics

#### Dashboard Overview

- Open, unattended, unassigned conversations
- Real-time metrics

#### Report Types

| Report | Metrics |
|--------|---------|
| **Conversations** | First response time, resolution time, resolution count, CSAT |
| **Agents** | Metrics per individual agent |
| **Labels** | Volume and performance per label |
| **Inboxes** | Metrics per channel/inbox |
| **Teams** | Performance per team |
| **CSAT** | Satisfaction scores with filters by inbox, agent, team |
| **SLA** | Hit rate, misses, compliance per policy |

#### Report Features

- Period filters: days, weeks, months
- Trend charts (line charts)
- Paginated and filterable tables
- CSV export
- CSAT surveys on conversation resolution (configurable per inbox)

### Integrations

| Integration | Description |
|-------------|-------------|
| **Slack** | Conversation notifications + reply directly from Slack |
| **Dialogflow** | Chatbots with Google NLU |
| **Google Translate** | Automatic message translation in 100+ languages |
| **Linear** | Convert customer feedback into Linear issues |
| **Dyte** | Video calls with customers from live chat |
| **Dashboard Apps** | Embed internal tools as iframes in the sidebar |
| **Webhooks** | Real-time HTTP callbacks for events (conversations, messages, contacts) |
| **Agent Bot API** | Webhook-based: send events to external endpoint, receive responses, handoff to human |

### UI / UX

#### Main Navigation (Sidebar)

1. **Conversations** — main inbox
2. **Contacts** — contact directory
3. **Reports** — analytics and reports
4. **Campaigns** — proactive campaigns
5. **Help Center** — knowledge base management
6. **Settings** — account configuration

#### Conversations Sidebar (Secondary Panel)

- **All Conversations** — all account conversations
- **Mentions** — conversations where you were mentioned (@)
- **Unattended** — conversations without a reply
- **Custom Folders** — saved conversation filters (saved views)
- **Labels** — quick access by label
- **Teams** — conversations by team

#### Command Bar (Cmd+K / Ctrl+K)

- Quick navigation to any section (Settings, Reports, Contacts, etc.)
- Contextual actions on current conversation:
  - Resolve / reopen
  - Assign agent or team
  - Add label
  - Mute / snooze
  - Send transcript via email
- Execute macros
- Global search

#### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open command bar |
| `Cmd/Ctrl + /` | View all shortcuts |
| `Cmd/Ctrl + Enter` | Send message |
| `Cmd/Ctrl + E` | Resolve conversation |
| `Cmd/Ctrl + B` | Toggle sidebar |
| `J` / `K` | Navigate between conversations |
| `Alt + N` | New conversation |

#### Themes & Accessibility

- **Dark mode** on dashboard and widget (auto / light / dark)
- **Font size selector** (6 options: smaller -> extra large)
- **i18n** — 30+ supported languages (managed via Crowdin/Paraglide)

### Notifications

| Type | Description |
|------|-------------|
| **In-app** | Notification center (bell icon) with list |
| **Audio** | Configurable sound alerts (multiple sounds, trigger conditions) |
| **Email** | Email notifications (new conversation, assignment, mention) |
| **Push** | Push notifications in browser and mobile |

**Granular preferences per type:**
- New conversation alerts
- Assignment notifications
- Mention notifications
- New message in assigned conversation

**Configurable audio alerts:**
- Only when window is not active
- Every 30 seconds until assigned conversations are read

### Profile Settings

- Avatar, name, display name
- Availability (online, busy, offline)
- Notification preferences (audio, email, push)
- Dashboard language
- Font size
- Agent email signature

### Settings (Administration)

| Section | Content |
|---------|---------|
| **Account** | Name, logo, timezone, site language |
| **Inboxes** | Inbox CRUD, per-channel configuration (greeting, auto-assignment, CSAT toggle, pre-chat form, business hours, HMAC) |
| **Agents** | Invite, deactivate, change role, view capacity |
| **Teams** | Create teams, assign members |
| **Labels** | Create and manage labels |
| **Canned Responses** | Quick reply templates |
| **Macros** | Create and manage macros |
| **Custom Attributes** | Define custom fields for conversations and contacts |
| **Custom Roles** | Create roles with granular permissions |
| **Automation** | Automation rules |
| **SLA Policies** | Service level agreement policies |
| **Conversation Workflows** | Required attributes on resolve |
| **Integrations** | Connect/disconnect apps (Slack, Dialogflow, Linear, Dyte) |
| **Applications** | Dashboard Apps (iframes) |
| **Audit Log** | Record of who did what and when |
| **Security** | SAML SSO, authentication configuration |

### Super Admin

- Admin panel at `/super_admin`
- Account/organization management (create, suspend, delete)
- Create super admins
- Background job monitoring (Sidekiq equivalent -> Bull Board)
- **Platform APIs** for programmatic management of users, accounts, and roles

### Public API

Full REST API documented with OpenAPI/Swagger:

| Resource | Endpoints |
|----------|-----------|
| Conversations | List, Create, Filter, Details, Update, Toggle Status, Toggle Priority, Custom Attributes, Labels, Reporting Events |
| Messages | List, Create, Delete |
| Contacts | List, Create, Update, Search, Filter, Conversations, Labels, Notes |
| Inboxes | List, Create, Update, Delete, Agent Bot config |
| Agents | List, Create, Update, Delete |
| Teams | List, Create, Update, Delete, Members |
| Labels | CRUD |
| Canned Responses | CRUD |
| Custom Attributes | CRUD |
| Custom Filters | CRUD |
| Automation Rules | CRUD |
| Help Center | Portals, Categories, Articles — CRUD |
| Reports | Conversations, Agents, Labels, Inboxes, Teams metrics |
| Webhooks | CRUD |
| Profile | Get, Update |
| Account Users | List, Create, Delete |
| Agent Bots | CRUD |
| **Platform APIs** | Accounts, Users, Roles (super admin) |

---

## Development Phases

### Phase 0 — Foundations & Architecture (Weeks 1-3)

Set up project base, tooling, authentication, and core layout.

- [ ] Initialize monorepo with pnpm workspaces
- [ ] Create SvelteKit app with strict TypeScript
- [ ] Configure ESLint, Prettier, Husky (pre-commit hooks)
- [ ] Configure Tailwind CSS + shadcn-svelte
- [ ] Configure Docker Compose: PostgreSQL, Redis, MinIO
- [ ] Configure Drizzle ORM with migrations
- [ ] Base schema: `accounts`, `users`, `roles`, `account_users`
- [ ] Authentication system: register, login, logout, sessions (Lucia Auth)
- [ ] Role-based authorization middleware (owner, admin, agent)
- [ ] Dashboard layout: main sidebar, secondary sidebar, content area, right panel
- [ ] Navigation: Conversations, Contacts, Reports, Campaigns, Help Center, Settings
- [ ] Profile settings: avatar, display name, availability, language, font size
- [ ] Notification center (bell icon with in-app list)
- [ ] Command bar (Cmd+K) with basic navigation
- [ ] Keyboard shortcuts framework
- [ ] Dark mode (auto / light / dark) on dashboard
- [ ] i18n setup with Paraglide.js (English + Spanish initially)
- [ ] Vitest + Playwright configured
- [ ] CI with GitHub Actions (lint, test, build)

**Deliverable:** App with login, full dashboard layout, dark mode, command bar, i18n, and notifications.

---

### Phase 1 — Inboxes, Widget & Website Channel (Weeks 4-6)

The core channel: website live chat.

- [ ] Schema: `inboxes`, `channels`, `conversations`, `messages`, `contacts`, `contact_inboxes`
- [ ] Inbox CRUD in Settings
- [ ] **Embeddable widget (Web Component):**
  - Compile Svelte component as Web Component
  - JavaScript SDK (`xat.js`) for integration
  - Configurable pre-chat form (standard + custom fields)
  - HMAC-based identity validation
  - Configurable greeting message
  - Customization: colors, heading, tagline, reply time
  - Widget dark mode (auto / light / dark)
  - setLocale(), setUser(), setCustomAttributes() via SDK
- [ ] Real-time communication via WebSocket (Socket.IO)
- [ ] **Conversation view in dashboard:**
  - Conversation list (secondary sidebar) with filters
  - Conversation detail (central area) with message thread
  - Right panel: contact info, custom attributes, previous conversations
- [ ] Real-time message sending and receiving
- [ ] Typing indicators (agent and customer)
- [ ] Read receipts
- [ ] Emoji picker
- [ ] File attachments (drag & drop, images, documents)
- [ ] Audio recording (voice notes)
- [ ] Rich text / Markdown in messages
- [ ] Conversation states: open, resolved, pending, snoozed
- [ ] Conversation priority (urgent, high, medium, low, none)
- [ ] Manual agent assignment

**Deliverable:** Functional live chat with embeddable widget, real-time messages, and complete conversation panel.

---

### Phase 2 — Conversation & Contact Management (Weeks 7-9)

Tools for agents to work efficiently.

- [ ] **Conversations:**
  - Team assignment
  - Round-robin auto-assignment
  - Labels on conversations
  - Private notes between agents
  - Mentions (@agent) in private notes
  - Conversation participants
  - Bulk actions (resolve, assign, label multiple)
  - Mute/unmute conversations
  - Send transcript via email
  - Canned responses
  - Advanced conversation filters (by status, inbox, agent, team, label, priority)
  - Custom folders / saved views (saved in sidebar)
  - "Mentions" and "Unattended" views
- [ ] **Contacts:**
  - Unified contact view with conversation history
  - Contact notes (Cmd+Enter to add)
  - Custom attributes (text, number, date, list, checkbox, link)
  - Labels on contacts
  - Contact segments (advanced filters saved in sidebar)
  - CSV import of contacts
  - CSV export of contacts
  - Merge duplicate contacts
  - Associated Companies/Organizations
  - Advanced filters with operators (equals, not equals, contains, present, etc.)
- [ ] Full **keyboard shortcuts** (resolve, navigate J/K, send, toggle sidebar, etc.)
- [ ] **Command bar** contextual actions (resolve, assign, label, snooze, mute, macro)

**Deliverable:** Complete support team workflow with advanced contact management.

---

### Phase 3 — Email Channel + API Channel (Weeks 10-12)

Expand communication channels.

- [ ] **Email Channel:**
  - IMAP/SMTP inbox configuration in Settings
  - Reception via IMAP polling
  - Reception via forwarding (webhook)
  - Reply sending via SMTP
  - Email thread parsing (In-Reply-To, References headers)
  - Configurable agent signature
  - Email as conversation in unified inbox
- [ ] **API Channel:**
  - Create API-type inbox in Settings
  - REST endpoint to create conversations and messages programmatically
  - Callback URL for incoming webhooks
  - API key authentication
  - Channel documentation

**Deliverable:** Email and API channel support in addition to live chat.

---

### Phase 4 — Teams, Roles & Notifications (Weeks 13-15)

Scale for organizations with multiple teams.

- [ ] Schema: `teams`, `team_members`, `custom_roles`, `permissions`
- [ ] Team CRUD in Settings
- [ ] Conversation assignment to teams
- [ ] Auto-assignment based on inbox -> team rules
- [ ] **Custom Roles** with granular permissions (beyond admin/agent)
- [ ] **Agent Capacity** — configurable concurrent conversation limit
- [ ] Auto-assignment respecting availability + capacity
- [ ] Team conversation view in sidebar
- [ ] **Complete notifications:**
  - Audio alerts with multiple sounds and conditions
  - Email notifications (new conversation, assignment, mention, new message)
  - Push notifications (Web Push API) with browser permissions
  - Granular preferences per event type
  - Configuration: only when window inactive / every 30s until read
- [ ] Real-time agent presence (online, busy, offline)

**Deliverable:** Multiple teams with custom roles, capacity management, and full notifications.

---

### Phase 5 — Automation (Weeks 16-19)

Complete automation engine.

- [ ] **Automation Rules:**
  - UI for creating/editing rules in Settings -> Automation
  - Events: conversation created, updated, opened; message created
  - Conditions with AND/OR operators (content, attributes, inbox, team, labels, priority, contact)
  - Actions: assign agent/team, add/remove label, change priority, resolve, snooze, mute, send message, send email, assign SLA
  - Execution via BullMQ (background jobs)
- [ ] **Macros:**
  - CRUD in Settings -> Macros
  - Ordered action sequences
  - Private and shared macros
  - Preview before execution
  - Executable from command bar and conversation UI
- [ ] **SLA Policies:**
  - CRUD in Settings -> SLA
  - First response time, next response time, resolution time
  - Alerts before breach
  - Assignment via automation rules
- [ ] **Business Hours:**
  - Configuration per inbox
  - Off-hours message
  - SLA respects business hours
- [ ] **Conversation Workflows:**
  - Required attributes before resolving (Settings -> Conversation Workflows)
  - Modal that blocks resolution until fields are filled
- [ ] **Agent Bot API:**
  - Webhook-based: send events to external endpoint
  - Receive bot responses
  - Handoff to human agent
  - Configuration per inbox

**Deliverable:** Conversations are automatically routed and processed. Macros and SLA operational.

---

### Phase 6 — Reports & CSAT (Weeks 20-22)

Metrics to measure and improve support.

- [ ] **Dashboard Overview:**
  - Open, unattended, unassigned conversations in real time
  - Summarized metrics for the period
- [ ] **Reports by type:**
  - Conversation reports
  - Agent reports
  - Label reports
  - Inbox reports
  - Team reports
- [ ] **Metrics in each report:**
  - First response time
  - Resolution time
  - Resolution count
  - Conversations count
  - CSAT score
- [ ] Period filters: days, weeks, months (date range picker)
- [ ] Trend charts (line/bar charts)
- [ ] Paginated and filterable tables
- [ ] CSV export
- [ ] **CSAT:**
  - Satisfaction survey on conversation resolution
  - Toggle per inbox in Settings
  - CSAT Reports with filters by inbox, agent, team, label
- [ ] **SLA Reports:**
  - Hit rate (percentage of SLAs met)
  - SLA misses
  - Filters by SLA policy, inbox, agent, team, label

**Deliverable:** Managers can measure team performance and customer satisfaction with exportable data.

---

### Phase 7 — Campaigns (Weeks 23-24)

Proactive messages to customers.

- [ ] "Campaigns" section in main sidebar
- [ ] **Ongoing Campaigns (website live chat):**
  - Message trigger based on page URL (supports wildcards)
  - Time on page as condition
  - Sent by bot or agent
  - Enable/disable campaign
- [ ] **One-off Campaigns:**
  - Mass sending to audience segmented by labels
  - Supported channels: SMS, WhatsApp (templates)
  - Scheduled sending (scheduled datetime)
  - Fields: title, message, inbox, audience, date/time
  - Campaign status (draft, scheduled, sent)

**Deliverable:** Proactive campaigns via live chat, SMS, and WhatsApp.

---

### Phase 8 — Help Center (Weeks 25-27)

Public knowledge base for self-service.

- [ ] Schema: `portals`, `categories`, `articles`, `article_translations`
- [ ] "Help Center" section in main sidebar
- [ ] **Portal Management:**
  - Create multiple portals per account
  - Configuration: name, slug, custom domain, color, logo
  - SSL for custom domain
- [ ] **Categories:**
  - CRUD with hierarchy (categories and subcategories)
  - Drag & drop ordering
- [ ] **Articles:**
  - Rich text / Markdown editor
  - Assign author and category
  - Meta content (description, tags) for SEO
  - States: draft, published, archived
- [ ] **Public portal:**
  - Public view with full-text search
  - Friendly URLs (/portal/slug/category/article)
  - Automatic sitemap
  - SEO meta tags
  - Responsive design
- [ ] **Multi-language:**
  - Article translations per locale
  - Each language with its own URL structure
  - Automatic redirect by visitor language
- [ ] **Widget integration:**
  - Suggest relevant articles before starting chat
  - Article search from widget
  - Link to full article

**Deliverable:** Public, multi-language knowledge base with SEO, connected to widget.

---

### Phase 9 — Messaging Channels (Weeks 28-32)

Expand to all social messaging channels.

- [ ] **WhatsApp** (Cloud API / 360dialog)
  - Message sending and receiving
  - Message templates
  - Interactive messages (buttons, lists)
  - Media (images, documents, audio, video)
- [ ] **Facebook Messenger** (Graph API)
  - Connect Facebook page
  - Messages, images, attachments
- [ ] **Instagram DMs** (Graph API)
  - Connect Instagram Business account
  - Direct messages, story replies
- [ ] **Telegram** (Bot API)
  - Create and connect bot
  - Messages, files, stickers
- [ ] **Twitter/X DMs** (API v2)
  - Connect account
  - Direct messages
- [ ] **LINE** (Messaging API)
  - Connect LINE channel
  - Messages
- [ ] **SMS** (Twilio)
  - Configure Twilio account
  - SMS sending and receiving
- [ ] **Voice** (WebRTC / Twilio Voice)
  - Inbound and outbound calls
  - Basic voice workflows
- [ ] **TikTok** (experimental)
  - Direct messages

**Deliverable:** Real omnichannel support with all major messaging and voice channels.

---

### Phase 10 — Integrations (Weeks 33-35)

Connect Xat with the tools ecosystem.

- [ ] **Settings -> Integrations** page
- [ ] **Slack:**
  - Connect workspace
  - Conversation notifications in channel
  - Reply to conversations from Slack
- [ ] **Dialogflow:**
  - Connect Dialogflow project
  - NLU chatbot per inbox
- [ ] **Google Translate:**
  - Automatic message translation
  - 100+ languages
- [ ] **Linear:**
  - Create issues from conversations
  - Feature request tracking
- [ ] **Dyte:**
  - Video calls from live chat
  - Generate call links
- [ ] **Dashboard Apps:**
  - Framework for embedding iframes in conversation sidebar
  - Custom app configuration per account
- [ ] **Outbound webhooks:**
  - CRUD in Settings
  - Event subscription (conversation.created, message.created, etc.)
  - Payload with complete event data
- [ ] **App/Integration framework:**
  - Structure for third-party plugins
  - Event hooks

**Deliverable:** Xat integrated with Slack, Dialogflow, Translate, Linear, Dyte, and extensible via webhooks.

---

### Phase 11 — Public API & Super Admin (Weeks 36-38)

Complete API and platform administration.

- [ ] **Public REST API:**
  - Documentation with OpenAPI 3.0 / Swagger UI
  - Complete endpoints: Conversations, Messages, Contacts, Inboxes, Agents, Teams, Labels, Canned Responses, Custom Attributes, Custom Filters, Automation Rules, Help Center, Reports, Webhooks, Profile, Account Users, Agent Bots
  - API key authentication (user token + account)
  - Rate limiting
- [ ] **Platform APIs:**
  - Account, User, Role management at platform level
  - Accessible only by super admins
- [ ] **Super Admin Console (/super_admin):**
  - Platform dashboard
  - Account/organization CRUD (create, suspend, delete)
  - Create and manage super admins
  - Background job monitoring (Bull Board)
  - Platform-level audit log
- [ ] **Complete multi-tenancy:**
  - Data isolation per account
  - Configurable limits per plan (agents, inboxes, contacts)
- [ ] **Security:**
  - SAML SSO (Settings -> Security)
  - Account-level Audit Log (Settings -> Audit Log)
  - Rate limiting and abuse protection
- [ ] **Custom branding:**
  - Logo and colors per account
  - Custom domain for widget

**Deliverable:** Platform ready to operate as multi-tenant SaaS with complete API and super admin.

---

### Phase 12 — Production & Scalability (Weeks 39-41)

Prepare for production deployment at scale.

- [ ] **Docker:**
  - Optimized Dockerfile (multi-stage build)
  - Docker Compose for development
  - Docker Compose for production (with Traefik/Nginx)
  - Separate services: web (SvelteKit), worker (BullMQ), websocket
- [ ] **Kubernetes:**
  - Helm chart
  - Horizontal Pod Autoscaler
  - WebSocket sticky sessions
- [ ] **Observability:**
  - Health checks and readiness probes
  - Structured logging (JSON, correlation by request ID)
  - Application metrics (Prometheus endpoint)
  - Tracing (OpenTelemetry)
- [ ] **Database:**
  - Zero-downtime migrations
  - Automated backup and restore
  - Connection pooling
- [ ] **Scaling:**
  - Horizontal scaling: independent workers
  - Shared state in Redis
  - CDN for static assets
- [ ] **Documentation:**
  - Self-hosted deployment guide
  - Channel configuration guide
  - Contributing guide

**Deliverable:** Xat deployable in production with observability, scalability, and complete documentation.

---

## Project Structure

```
xat/
├── apps/
│   ├── web/                        # SvelteKit main app (dashboard + API + SSR)
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   ├── server/
│   │   │   │   │   ├── db/         # Database connection and queries
│   │   │   │   │   ├── services/   # Business logic
│   │   │   │   │   ├── jobs/       # BullMQ job processors
│   │   │   │   │   ├── channels/   # Channel logic (email, whatsapp, etc.)
│   │   │   │   │   ├── integrations/ # Slack, Dialogflow, etc.
│   │   │   │   │   └── auth/       # Lucia Auth, SAML SSO
│   │   │   │   ├── components/
│   │   │   │   │   ├── ui/         # shadcn-svelte components
│   │   │   │   │   ├── conversations/ # Conversation list, detail, sidebar
│   │   │   │   │   ├── contacts/   # Contact views
│   │   │   │   │   ├── reports/    # Charts, tables
│   │   │   │   │   ├── campaigns/  # Campaign views
│   │   │   │   │   ├── help-center/ # Portal editor, article editor
│   │   │   │   │   ├── settings/   # Settings sections
│   │   │   │   │   └── shared/     # CommandBar, Notifications, Shortcuts
│   │   │   │   ├── stores/         # Svelte stores (conversations, contacts, auth, etc.)
│   │   │   │   ├── i18n/           # Paraglide.js translations
│   │   │   │   └── utils/          # Shared helpers
│   │   │   ├── routes/
│   │   │   │   ├── (auth)/         # Login, register, forgot password
│   │   │   │   ├── (app)/          # Dashboard (protected)
│   │   │   │   │   ├── conversations/
│   │   │   │   │   ├── contacts/
│   │   │   │   │   ├── reports/
│   │   │   │   │   ├── campaigns/
│   │   │   │   │   ├── help-center/
│   │   │   │   │   └── settings/
│   │   │   │   │       ├── account/
│   │   │   │   │       ├── inboxes/
│   │   │   │   │       ├── agents/
│   │   │   │   │       ├── teams/
│   │   │   │   │       ├── labels/
│   │   │   │   │       ├── canned-responses/
│   │   │   │   │       ├── macros/
│   │   │   │   │       ├── custom-attributes/
│   │   │   │   │       ├── custom-roles/
│   │   │   │   │       ├── automation/
│   │   │   │   │       ├── sla/
│   │   │   │   │       ├── conversation-workflows/
│   │   │   │   │       ├── integrations/
│   │   │   │   │       ├── applications/
│   │   │   │   │       ├── audit-log/
│   │   │   │   │       └── security/
│   │   │   │   ├── super-admin/    # Super admin console
│   │   │   │   ├── api/            # REST API endpoints
│   │   │   │   │   └── v1/
│   │   │   │   │       ├── conversations/
│   │   │   │   │       ├── messages/
│   │   │   │   │       ├── contacts/
│   │   │   │   │       ├── inboxes/
│   │   │   │   │       ├── agents/
│   │   │   │   │       ├── teams/
│   │   │   │   │       ├── labels/
│   │   │   │   │       ├── canned-responses/
│   │   │   │   │       ├── custom-attributes/
│   │   │   │   │       ├── automation-rules/
│   │   │   │   │       ├── help-center/
│   │   │   │   │       ├── reports/
│   │   │   │   │       ├── webhooks/
│   │   │   │   │       ├── profile/
│   │   │   │   │       └── platform/
│   │   │   │   └── widget/         # Widget API endpoints
│   │   │   └── hooks.server.ts     # Auth middleware, request hooks
│   │   ├── drizzle/                # SQL migrations
│   │   ├── static/                 # Static assets
│   │   └── tests/                  # Playwright E2E tests
│   │
│   ├── widget/                     # Embeddable widget
│   │   ├── src/
│   │   │   ├── Widget.svelte       # Main component
│   │   │   ├── components/         # Chat bubble, message list, pre-chat form
│   │   │   ├── sdk/                # xat.js SDK (setUser, setLocale, HMAC, etc.)
│   │   │   └── styles/             # Theming (light/dark)
│   │   └── vite.config.ts          # Build as Web Component
│   │
│   └── portal/                     # Public Help Center (SvelteKit)
│       ├── src/routes/
│       │   ├── [portal_slug]/
│       │   │   ├── [locale]/
│       │   │   │   ├── [category]/
│       │   │   │   │   └── [article]/
│       │   │   │   └── +page.svelte
│       │   │   └── +page.svelte
│       │   └── +layout.svelte
│       └── drizzle/                # Shared DB access
│
├── packages/
│   ├── db/                         # Drizzle schema + DB utilities
│   │   ├── schema/
│   │   │   ├── accounts.ts
│   │   │   ├── users.ts
│   │   │   ├── conversations.ts
│   │   │   ├── messages.ts
│   │   │   ├── contacts.ts
│   │   │   ├── inboxes.ts
│   │   │   ├── channels.ts
│   │   │   ├── teams.ts
│   │   │   ├── labels.ts
│   │   │   ├── automation-rules.ts
│   │   │   ├── macros.ts
│   │   │   ├── sla-policies.ts
│   │   │   ├── campaigns.ts
│   │   │   ├── help-center.ts
│   │   │   ├── integrations.ts
│   │   │   ├── notifications.ts
│   │   │   ├── webhooks.ts
│   │   │   ├── audit-logs.ts
│   │   │   └── custom-attributes.ts
│   │   └── index.ts
│   ├── shared/                     # Shared types and utilities
│   │   ├── types/
│   │   ├── constants/
│   │   └── validators/             # Zod schemas
│   └── email-templates/            # Email templates (mjml / react-email)
│
├── docker/
│   ├── docker-compose.yml          # Development
│   ├── docker-compose.prod.yml     # Production
│   ├── Dockerfile                  # Multi-stage build
│   └── nginx.conf
│
├── docs/
│   ├── self-hosted-guide.md
│   ├── api-reference.md
│   ├── channel-setup/
│   └── contributing.md
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── release.yml
│
├── pnpm-workspace.yaml
├── turbo.json                      # Turborepo for builds
├── LICENSE                         # Apache 2.0
├── README.md                       # English (main)
└── README.es.md                    # Spanish
```

---

## Local Development

```bash
# Clone the repository
git clone https://github.com/your-user/xat.git
cd xat

# Install dependencies
pnpm install

# Start services (PostgreSQL, Redis, MinIO)
docker compose up -d

# Run migrations
pnpm db:migrate

# Seed initial data (super admin)
pnpm db:seed

# Start in development mode
pnpm dev

# Open in browser
# Dashboard: http://localhost:5173
# Widget test: http://localhost:5173/widget/test
# Super Admin: http://localhost:5173/super-admin
```

### Available Scripts

```bash
pnpm dev              # Development with HMR
pnpm build            # Production build
pnpm preview          # Build preview
pnpm test             # Vitest (unit tests)
pnpm test:e2e         # Playwright (E2E tests)
pnpm lint             # ESLint
pnpm format           # Prettier
pnpm db:migrate       # Run migrations
pnpm db:generate      # Generate migration from schema
pnpm db:seed          # Seed initial data
pnpm db:studio        # Drizzle Studio (DB GUI)
pnpm widget:build     # Build widget as Web Component
```

---

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](docs/contributing.md) before submitting a PR.

1. Fork the repository
2. Create your branch (`git checkout -b feature/my-feature`)
3. Commit your changes following [Conventional Commits](https://www.conventionalcommits.org/) (`git commit -m 'feat: add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

### PR Requirements

- Unit tests for business logic
- E2E tests for critical flows
- Lint and format OK (`pnpm lint && pnpm format`)
- Successful build (`pnpm build`)

---

## License

This project is licensed under the **Apache License 2.0** — see the [LICENSE](LICENSE) file for details.

---

> **Disclaimer:** This project is an independent implementation inspired by customer engagement platform functionality. It is not a fork, does not contain code from any other project, and is not affiliated with any other platform. All code is original and written from scratch.
