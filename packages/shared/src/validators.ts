import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  accountName: z.string().min(1, "Account name is required").max(255),
});

export const createAccountSchema = z.object({
  name: z.string().min(1).max(255),
  locale: z.string().max(10).default("en"),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  displayName: z.string().max(255).optional(),
  availability: z.number().min(0).max(2).optional(),
});

export const createContactSchema = z.object({
  name: z.string().max(255).optional(),
  email: z.string().email().max(255).optional(),
  phoneNumber: z.string().max(50).optional(),
  identifier: z.string().max(255).optional(),
  companyId: z.number().int().positive().optional(),
});

export const createCompanySchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  domain: z.string().max(255).optional(),
  description: z.string().max(2000).optional(),
});

export const createLabelSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid color").default("#1f93ff"),
  showOnSidebar: z.boolean().default(true),
});

export const createCannedResponseSchema = z.object({
  shortCode: z.string().min(1, "Short code is required").max(100),
  content: z.string().min(1, "Content is required").max(5000),
});

export const createInboxSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  channelType: z.enum([
    "web_widget", "email", "api", "whatsapp", "facebook",
    "instagram", "telegram", "twitter", "line", "sms",
    "slack", "voice",
  ]),
});

export const conversationFilterSchema = z.object({
  status: z.number().min(0).max(3).optional(),
  inboxId: z.number().int().positive().optional(),
  assigneeId: z.number().int().positive().optional(),
  teamId: z.number().int().positive().optional(),
  labelId: z.number().int().positive().optional(),
  page: z.number().int().positive().default(1),
});

export const contactFilterSchema = z.object({
  search: z.string().optional(),
  companyId: z.number().int().positive().optional(),
  labelId: z.number().int().positive().optional(),
  page: z.number().int().positive().default(1),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateContactInput = z.infer<typeof createContactSchema>;
export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type CreateLabelInput = z.infer<typeof createLabelSchema>;
export type CreateCannedResponseInput = z.infer<typeof createCannedResponseSchema>;
export type CreateInboxInput = z.infer<typeof createInboxSchema>;
export type ConversationFilterInput = z.infer<typeof conversationFilterSchema>;
export type ContactFilterInput = z.infer<typeof contactFilterSchema>;

// ─── Calendar ─────────────────────────────────────────────────────────────────

const LOCATION_TYPES = [
  "VIDEO_DYTE",
  "VIDEO_GOOGLE_MEET",
  "VIDEO_ZOOM",
  "PHONE",
  "IN_PERSON",
  "CUSTOM",
] as const;

const CALENDAR_SCOPES = ["USER", "TEAM", "GLOBAL"] as const;

export const createEventTypeSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers and hyphens"),
  description: z.string().max(2000).optional(),
  duration: z.number().int().min(5).max(480).default(30),
  locationType: z.enum(LOCATION_TYPES).default("VIDEO_DYTE"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  scope: z.enum(CALENDAR_SCOPES).default("USER"),
  teamId: z.number().int().positive().optional(),
  inboxId: z.number().int().positive().optional(),
  settings: z
    .object({
      bufferMinutes: z.number().int().min(0).max(120).optional(),
      minNoticeHours: z.number().int().min(0).max(168).optional(),
      maxBookingsPerDay: z.number().int().min(1).max(100).optional(),
    })
    .optional(),
});

export const upsertScheduleSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  timezone: z.string().min(1),
  availability: z.array(
    z.object({
      dayOfWeek: z.number().int().min(0).max(6),
      periods: z.array(
        z.object({
          start: z.string().regex(/^\d{2}:\d{2}$/),
          end: z.string().regex(/^\d{2}:\d{2}$/),
        }),
      ),
    }),
  ),
});

export const createBookingSchema = z.object({
  eventTypeId: z.number().int().positive(),
  contactName: z.string().min(1).max(255),
  contactEmail: z.string().email(),
  contactPhone: z.string().max(50).optional(),
  startAt: z.string().datetime(),
  notes: z.string().max(2000).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateEventTypeInput = z.infer<typeof createEventTypeSchema>;
export type UpsertScheduleInput = z.infer<typeof upsertScheduleSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
