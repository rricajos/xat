// Phase 0 — Core
export { accounts } from "./accounts";
export { users } from "./users";
export { accountUsers } from "./account-users";
export { sessions, usernameRedirects } from "./sessions";

// Phase 1 — Conversations Core
export {
  inboxes,
  channelWebWidgets,
  channelEmail,
  channelWhatsapp,
  channelTelegram,
  channelFacebook,
  channelApi,
  channelInstagram,
  channelTwitter,
  channelLine,
  channelSms,
} from "./inboxes";
export { contacts, companies } from "./contacts";
export { conversations } from "./conversations";
export { messages, attachments, messageReactions } from "./messages";
export { contactInboxes } from "./contact-inboxes";

// Phase 2 — Collaboration & Organization
export { labels, labelTaggings } from "./labels";
export { teams, teamMembers } from "./teams";
export { cannedResponses } from "./canned-responses";
export { notifications, notificationPreferences } from "./notifications";
export {
  conversationParticipants,
  mentions,
  contactNotes,
  customAttributeDefinitions,
  customFilters,
} from "./collaboration";

// Phase 4 — Automation
export {
  automationRules,
  macros,
  slaPolicies,
  appliedSlas,
} from "./automation";

// Phase 6 — Campaigns
export { campaigns } from "./campaigns";

// Phase 7 — Help Center
export { portals, categories, articles } from "./help-center";

// Phase 8 — Integrations
export {
  webhooks,
  integrations,
  agentBots,
  apiTokens,
  videoCalls,
  dashboardApps,
} from "./integrations";

// CSAT
export { csatSurveyResponses } from "./csat";

// Audit Log
export { auditLogs } from "./audit-log";

// Custom Roles
export { customRoles } from "./custom-roles";

// Tickets & Kanban
export {
  kanbanBoards,
  kanbanStages,
  tickets,
  ticketConversations,
} from "./tickets";

// Phase 18+ — Workflows, Push, Slack Channel
export {
  conversationWorkflows,
  pushSubscriptions,
  channelSlack,
} from "./workflows";

// Phase 30+ — Calendar
export {
  calendarEventTypes,
  calendarSchedules,
  calendarBookings,
  calendarBlockedTimes,
  calendarExternalConns,
} from "./calendars";
