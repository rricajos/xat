export const CONVERSATION_STATUS = {
  OPEN: 0,
  RESOLVED: 1,
  PENDING: 2,
  SNOOZED: 3,
} as const;

export const CONVERSATION_PRIORITY = {
  NONE: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  URGENT: 4,
} as const;

export const MESSAGE_TYPE = {
  INCOMING: 0,
  OUTGOING: 1,
  ACTIVITY: 2,
  TEMPLATE: 3,
} as const;

export const AVAILABILITY = {
  ONLINE: 0,
  BUSY: 1,
  OFFLINE: 2,
} as const;

export const FILE_TYPE = {
  IMAGE: 0,
  AUDIO: 1,
  VIDEO: 2,
  FILE: 3,
  LOCATION: 4,
  FALLBACK: 5,
} as const;

export const ACCOUNT_ROLE = {
  OWNER: "owner",
  ADMINISTRATOR: "administrator",
  AGENT: "agent",
} as const;

export const USER_TYPE = {
  USER: "user",
  SUPER_ADMIN: "super_admin",
} as const;

export const CHANNEL_TYPE = {
  WEB_WIDGET: "web_widget",
  EMAIL: "email",
  API: "api",
  WHATSAPP: "whatsapp",
  FACEBOOK: "facebook",
  INSTAGRAM: "instagram",
  TELEGRAM: "telegram",
  TWITTER: "twitter",
  LINE: "line",
  SMS: "sms",
} as const;

export type ConversationStatus =
  (typeof CONVERSATION_STATUS)[keyof typeof CONVERSATION_STATUS];
export type ConversationPriority =
  (typeof CONVERSATION_PRIORITY)[keyof typeof CONVERSATION_PRIORITY];
export type MessageType = (typeof MESSAGE_TYPE)[keyof typeof MESSAGE_TYPE];
export type Availability = (typeof AVAILABILITY)[keyof typeof AVAILABILITY];
export type FileType = (typeof FILE_TYPE)[keyof typeof FILE_TYPE];
export type AccountRole = (typeof ACCOUNT_ROLE)[keyof typeof ACCOUNT_ROLE];
export type UserType = (typeof USER_TYPE)[keyof typeof USER_TYPE];
export type ChannelType = (typeof CHANNEL_TYPE)[keyof typeof CHANNEL_TYPE];
