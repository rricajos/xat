# Database Schema

Initial database schema for Phases 0-2. Tables are organized by domain and will be extended in later phases.

## Conventions

- All tables use `snake_case`
- Primary keys: `id` (serial or uuid)
- Every table has `created_at` and `updated_at` timestamps
- Multi-tenant tables have `account_id` foreign key
- Soft deletes use `deleted_at` timestamp where applicable
- Indexes on all foreign keys and commonly filtered columns

---

## Phase 0 — Core Tables

### accounts

The top-level entity. Each organization/company is an account.

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| name | varchar(255) | Organization name |
| locale | varchar(10) | Default locale (e.g., "en") |
| domain | varchar(255) | Custom domain (nullable) |
| settings | jsonb | Account-level settings (timezone, features, etc.) |
| limits | jsonb | Plan limits (max_agents, max_inboxes, etc.) |
| created_at | timestamp | |
| updated_at | timestamp | |

### users

Application users (agents, admins, super admins).

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| email | varchar(255) | Unique |
| encrypted_password | varchar(255) | Hashed password |
| name | varchar(255) | Full name |
| display_name | varchar(255) | Display name in conversations |
| avatar_url | text | Profile picture URL |
| availability | smallint | 0=online, 1=busy, 2=offline |
| ui_settings | jsonb | Theme, font size, locale, etc. |
| type | varchar(20) | "user" or "super_admin" |
| created_at | timestamp | |
| updated_at | timestamp | |

### account_users

Join table: which users belong to which accounts and their role.

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| account_id | int FK | -> accounts.id |
| user_id | int FK | -> users.id |
| role | varchar(20) | "owner", "administrator", "agent" |
| auto_offline | boolean | Auto set offline when inactive |
| availability | smallint | Account-specific availability override |
| active_at | timestamp | Last activity timestamp |
| created_at | timestamp | |
| updated_at | timestamp | |

**Unique:** (account_id, user_id)

---

## Phase 1 — Conversations Core

### inboxes

Communication channels configured for an account.

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| account_id | int FK | -> accounts.id |
| name | varchar(255) | Inbox display name |
| channel_type | varchar(50) | "web_widget", "email", "api", "whatsapp", "facebook", "telegram", etc. |
| channel_id | int | Polymorphic FK to channel-specific table |
| greeting_enabled | boolean | |
| greeting_message | text | |
| enable_auto_assignment | boolean | |
| enable_email_collect | boolean | |
| csat_survey_enabled | boolean | |
| allow_messages_after_resolved | boolean | |
| business_hours_enabled | boolean | |
| out_of_office_message | text | |
| settings | jsonb | Channel-specific settings |
| created_at | timestamp | |
| updated_at | timestamp | |

### channel_web_widgets

Channel-specific config for website live chat.

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| account_id | int FK | -> accounts.id |
| website_token | varchar(255) | Unique token for widget embed |
| website_url | text | Allowed website URL |
| welcome_title | varchar(255) | Widget header title |
| welcome_tagline | varchar(255) | Widget header tagline |
| widget_color | varchar(7) | Hex color |
| reply_time | varchar(20) | "in_a_few_minutes", "in_a_few_hours", "in_a_day" |
| pre_chat_form_enabled | boolean | |
| pre_chat_form_options | jsonb | Field configuration |
| hmac_token | varchar(255) | HMAC secret for identity validation |
| hmac_mandatory | boolean | |
| created_at | timestamp | |
| updated_at | timestamp | |

### channel_email

Channel-specific config for email inboxes.

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| account_id | int FK | -> accounts.id |
| email | varchar(255) | Inbox email address |
| forward_to_email | varchar(255) | Forwarding address |
| imap_enabled | boolean | |
| imap_address | varchar(255) | |
| imap_port | int | |
| imap_login | varchar(255) | |
| imap_password | varchar(255) | Encrypted |
| imap_enable_ssl | boolean | |
| smtp_enabled | boolean | |
| smtp_address | varchar(255) | |
| smtp_port | int | |
| smtp_login | varchar(255) | |
| smtp_password | varchar(255) | Encrypted |
| smtp_enable_ssl_tls | boolean | |
| created_at | timestamp | |
| updated_at | timestamp | |

### channel_api

Channel-specific config for API channels.

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| account_id | int FK | -> accounts.id |
| webhook_url | text | Callback URL for events |
| hmac_token | varchar(255) | HMAC secret |
| created_at | timestamp | |
| updated_at | timestamp | |

### contacts

People who interact with the organization.

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| account_id | int FK | -> accounts.id |
| name | varchar(255) | |
| email | varchar(255) | |
| phone_number | varchar(50) | |
| avatar_url | text | |
| identifier | varchar(255) | External unique identifier (from SDK) |
| additional_attributes | jsonb | Browser, OS, location, IP, etc. |
| custom_attributes | jsonb | User-defined custom fields |
| company_id | int FK | -> companies.id (nullable) |
| last_activity_at | timestamp | |
| created_at | timestamp | |
| updated_at | timestamp | |

**Unique:** (account_id, email), (account_id, identifier), (account_id, phone_number)

### companies

Organizations/companies that contacts belong to.

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| account_id | int FK | -> accounts.id |
| name | varchar(255) | |
| domain | varchar(255) | |
| description | text | |
| custom_attributes | jsonb | |
| created_at | timestamp | |
| updated_at | timestamp | |

### conversations

A conversation thread between a contact and agents.

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| account_id | int FK | -> accounts.id |
| inbox_id | int FK | -> inboxes.id |
| contact_id | int FK | -> contacts.id |
| assignee_id | int FK | -> users.id (nullable) |
| team_id | int FK | -> teams.id (nullable) |
| display_id | int | Account-scoped sequential number |
| status | smallint | 0=open, 1=resolved, 2=pending, 3=snoozed |
| priority | smallint | 0=none, 1=low, 2=medium, 3=high, 4=urgent |
| snoozed_until | timestamp | When to reopen snoozed conversation |
| additional_attributes | jsonb | Browser info, referer, etc. |
| custom_attributes | jsonb | User-defined custom fields |
| first_reply_created_at | timestamp | For SLA tracking |
| waiting_since | timestamp | Last time customer sent message without reply |
| last_activity_at | timestamp | Last message or status change |
| uuid | uuid | Public identifier |
| created_at | timestamp | |
| updated_at | timestamp | |

**Index:** (account_id, status), (account_id, inbox_id), (account_id, assignee_id), (account_id, team_id), (account_id, display_id)

### messages

Individual messages within a conversation.

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| account_id | int FK | -> accounts.id |
| conversation_id | int FK | -> conversations.id |
| sender_type | varchar(20) | "User" (agent) or "Contact" |
| sender_id | int | Polymorphic FK |
| message_type | smallint | 0=incoming, 1=outgoing, 2=activity, 3=template |
| content_type | varchar(20) | "text", "input_select", "cards", "form", etc. |
| content | text | Message body |
| content_attributes | jsonb | Interactive message data, email metadata |
| private | boolean | True = private note (agent only) |
| status | varchar(20) | "sent", "delivered", "read", "failed" |
| source_id | varchar(255) | External message ID (email Message-ID, WhatsApp msg ID) |
| external_source_ids | jsonb | Additional external IDs |
| created_at | timestamp | |
| updated_at | timestamp | |

**Index:** (conversation_id, created_at), (account_id, conversation_id)

### attachments

Files attached to messages.

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| account_id | int FK | -> accounts.id |
| message_id | int FK | -> messages.id |
| file_type | smallint | 0=image, 1=audio, 2=video, 3=file, 4=location, 5=fallback |
| external_url | text | S3 URL |
| coordinates_lat | decimal | For location type |
| coordinates_long | decimal | For location type |
| fallback_title | varchar(255) | |
| created_at | timestamp | |
| updated_at | timestamp | |

### contact_inboxes

Which contacts are connected to which inboxes (tracks sessions).

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| account_id | int FK | -> accounts.id |
| contact_id | int FK | -> contacts.id |
| inbox_id | int FK | -> inboxes.id |
| source_id | varchar(255) | Channel-specific contact ID |
| hmac_verified | boolean | |
| created_at | timestamp | |
| updated_at | timestamp | |

**Unique:** (contact_id, inbox_id, source_id)

---

## Phase 2 — Collaboration & Organization

### labels

Reusable tags for categorization.

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| account_id | int FK | -> accounts.id |
| title | varchar(255) | |
| description | text | |
| color | varchar(7) | Hex color |
| show_on_sidebar | boolean | |
| created_at | timestamp | |
| updated_at | timestamp | |

**Unique:** (account_id, title)

### label_taggings

Polymorphic join table for labels on conversations and contacts.

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| account_id | int FK | -> accounts.id |
| label_id | int FK | -> labels.id |
| taggable_type | varchar(50) | "Conversation" or "Contact" |
| taggable_id | int | FK to conversation or contact |
| created_at | timestamp | |

**Unique:** (label_id, taggable_type, taggable_id)

### canned_responses

Saved reply templates.

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| account_id | int FK | -> accounts.id |
| short_code | varchar(255) | Trigger shortcode (e.g., "/greeting") |
| content | text | Template content |
| created_at | timestamp | |
| updated_at | timestamp | |

### teams

Groups of agents.

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| account_id | int FK | -> accounts.id |
| name | varchar(255) | |
| description | text | |
| allow_auto_assign | boolean | |
| created_at | timestamp | |
| updated_at | timestamp | |

### team_members

Join table: users in teams.

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| team_id | int FK | -> teams.id |
| user_id | int FK | -> users.id |
| created_at | timestamp | |
| updated_at | timestamp | |

**Unique:** (team_id, user_id)

### conversation_participants

Agents participating in a conversation (beyond the assignee).

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| account_id | int FK | -> accounts.id |
| conversation_id | int FK | -> conversations.id |
| user_id | int FK | -> users.id |
| created_at | timestamp | |
| updated_at | timestamp | |

**Unique:** (conversation_id, user_id)

### mentions

Tracks @mentions of agents in messages.

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| account_id | int FK | -> accounts.id |
| conversation_id | int FK | -> conversations.id |
| message_id | int FK | -> messages.id |
| user_id | int FK | -> users.id (mentioned agent) |
| created_at | timestamp | |
| updated_at | timestamp | |

### contact_notes

Notes agents add to contacts.

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| account_id | int FK | -> accounts.id |
| contact_id | int FK | -> contacts.id |
| user_id | int FK | -> users.id (author) |
| content | text | |
| created_at | timestamp | |
| updated_at | timestamp | |

### custom_attribute_definitions

Schema for user-defined custom attributes.

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| account_id | int FK | -> accounts.id |
| attribute_display_name | varchar(255) | Human-readable name |
| attribute_display_type | varchar(20) | "text", "number", "date", "list", "checkbox", "link" |
| attribute_key | varchar(255) | Machine key (snake_case) |
| attribute_model | varchar(20) | "conversation" or "contact" |
| default_value | text | |
| attribute_values | jsonb | For "list" type: allowed values |
| created_at | timestamp | |
| updated_at | timestamp | |

**Unique:** (account_id, attribute_key, attribute_model)

### custom_filters

Saved filter configurations (folders/segments).

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| account_id | int FK | -> accounts.id |
| user_id | int FK | -> users.id |
| name | varchar(255) | Filter name (shown in sidebar) |
| filter_type | varchar(20) | "conversation" or "contact" |
| query | jsonb | Filter conditions |
| created_at | timestamp | |
| updated_at | timestamp | |

### notifications

In-app notifications for agents.

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| account_id | int FK | -> accounts.id |
| user_id | int FK | -> users.id |
| notification_type | varchar(50) | "conversation_creation", "conversation_assignment", "mention", "participating_conversation_new_message" |
| primary_actor_type | varchar(50) | "Conversation", "Message" |
| primary_actor_id | int | |
| secondary_actor_type | varchar(50) | "User", "Contact" |
| secondary_actor_id | int | |
| read_at | timestamp | |
| snoozed_until | timestamp | |
| created_at | timestamp | |
| updated_at | timestamp | |

**Index:** (account_id, user_id, read_at)

---

## Phase 5+ — Extended Tables

These tables will be designed in detail when their respective phases begin:

- `automation_rules` — Event-based automation rules
- `macros` — Saved action sequences
- `macro_actions` — Individual actions in a macro
- `sla_policies` — SLA definitions
- `applied_slas` — SLA instances applied to conversations
- `campaigns` — Ongoing and one-off campaigns
- `portals` — Help Center portals
- `categories` — Portal categories
- `articles` — Knowledge base articles
- `article_translations` — Multi-language article content
- `webhooks` — Outbound webhook subscriptions
- `integrations` — Connected third-party integrations
- `agent_bots` — Bot configurations per inbox
- `audit_logs` — Who did what and when
- `custom_roles` — Granular permission roles
- `data_imports` — CSV import tracking

---

## Entity Relationship Diagram (Core)

```
accounts
  ├── account_users ──── users
  ├── inboxes
  │     ├── channel_web_widgets
  │     ├── channel_email
  │     └── channel_api
  ├── contacts
  │     ├── contact_inboxes ──── inboxes
  │     ├── contact_notes
  │     └── companies
  ├── conversations
  │     ├── messages
  │     │     └── attachments
  │     ├── conversation_participants ──── users
  │     └── mentions ──── users
  ├── labels
  │     └── label_taggings ──── conversations/contacts
  ├── teams
  │     └── team_members ──── users
  ├── canned_responses
  ├── custom_attribute_definitions
  ├── custom_filters ──── users
  └── notifications ──── users
```
