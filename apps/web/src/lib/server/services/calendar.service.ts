import { db } from "@xat/db";
import {
  calendarEventTypes,
  calendarSchedules,
  calendarBookings,
  calendarBlockedTimes,
  calendarExternalConns,
  users,
  teams,
  teamMembers,
} from "@xat/db/schema";
import { eq, and, gte, lte, ne, inArray, asc, desc, sql } from "drizzle-orm";
import { randomBytes, createHmac } from "node:crypto";
import { enqueueEmail } from "../jobs/queue.js";
import { broadcastToAccount } from "../realtime/events.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AvailabilityPeriod {
  start: string; // "09:00"
  end: string;   // "17:00"
}

export interface AvailabilityDay {
  dayOfWeek: number; // 0=Sun, 1=Mon … 6=Sat
  periods: AvailabilityPeriod[];
}

export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
}

export interface BookingSettings {
  bufferMinutes?: number;
  minNoticeHours?: number;
  maxBookingsPerDay?: number;
  notificationInboxIds?: number[];
  customQuestions?: Array<{ id: string; label: string; required: boolean }>;
}

// ─── Event Types ──────────────────────────────────────────────────────────────

export async function listEventTypes(
  accountId: number,
  params?: { userId?: number; teamId?: number; scope?: string },
) {
  const conditions = [eq(calendarEventTypes.accountId, accountId)];
  if (params?.userId !== undefined) conditions.push(eq(calendarEventTypes.userId, params.userId));
  if (params?.teamId !== undefined) conditions.push(eq(calendarEventTypes.teamId, params.teamId));
  if (params?.scope !== undefined) conditions.push(eq(calendarEventTypes.scope, params.scope));

  return db
    .select()
    .from(calendarEventTypes)
    .where(and(...conditions))
    .orderBy(asc(calendarEventTypes.name));
}

export async function getEventTypeById(accountId: number, id: number) {
  const [et] = await db
    .select()
    .from(calendarEventTypes)
    .where(and(eq(calendarEventTypes.accountId, accountId), eq(calendarEventTypes.id, id)))
    .limit(1);
  return et ?? null;
}

// Resolve event type from public URL context (no auth)
export async function getPublicEventType(params: {
  slug: string;
  username?: string;   // for USER scope
  teamSlug?: string;   // for TEAM scope
  isGlobal?: boolean;  // for GLOBAL scope
}) {
  if (params.username) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.calendarUsername, params.username))
      .limit(1);
    if (!user) return null;

    const [et] = await db
      .select()
      .from(calendarEventTypes)
      .where(
        and(
          eq(calendarEventTypes.userId, user.id),
          eq(calendarEventTypes.slug, params.slug),
          eq(calendarEventTypes.scope, "USER"),
          eq(calendarEventTypes.isActive, true),
        ),
      )
      .limit(1);
    return et ? { eventType: et, agent: user } : null;
  }

  if (params.teamSlug) {
    const [team] = await db
      .select()
      .from(teams)
      .where(sql`lower(${teams.name}) = lower(${params.teamSlug})`)
      .limit(1);
    if (!team) return null;

    const [et] = await db
      .select()
      .from(calendarEventTypes)
      .where(
        and(
          eq(calendarEventTypes.teamId, team.id),
          eq(calendarEventTypes.slug, params.slug),
          eq(calendarEventTypes.scope, "TEAM"),
          eq(calendarEventTypes.isActive, true),
        ),
      )
      .limit(1);
    return et ? { eventType: et, team } : null;
  }

  if (params.isGlobal) {
    const [et] = await db
      .select()
      .from(calendarEventTypes)
      .where(
        and(
          eq(calendarEventTypes.slug, params.slug),
          eq(calendarEventTypes.scope, "GLOBAL"),
          eq(calendarEventTypes.isActive, true),
        ),
      )
      .limit(1);
    return et ? { eventType: et } : null;
  }

  return null;
}

export async function getPublicAgentProfile(username: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.calendarUsername, username))
    .limit(1);
  if (!user) return null;

  const eventTypes = await db
    .select()
    .from(calendarEventTypes)
    .where(
      and(
        eq(calendarEventTypes.userId, user.id),
        eq(calendarEventTypes.scope, "USER"),
        eq(calendarEventTypes.isActive, true),
      ),
    )
    .orderBy(asc(calendarEventTypes.name));

  return { user, eventTypes };
}

export async function createEventType(
  accountId: number,
  data: {
    userId?: number;
    teamId?: number;
    scope: "USER" | "TEAM" | "GLOBAL";
    name: string;
    slug: string;
    description?: string;
    duration?: number;
    locationType?: string;
    color?: string;
    inboxId?: number;
    settings?: BookingSettings;
  },
) {
  const [et] = await db
    .insert(calendarEventTypes)
    .values({
      accountId,
      userId: data.userId ?? null,
      teamId: data.teamId ?? null,
      scope: data.scope,
      name: data.name,
      slug: data.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      description: data.description,
      duration: data.duration ?? 30,
      locationType: data.locationType ?? "VIDEO_DYTE",
      color: data.color ?? "#3B82F6",
      inboxId: data.inboxId ?? null,
      settings: data.settings ?? {},
    })
    .returning();
  return et!;
}

export async function updateEventType(
  accountId: number,
  id: number,
  data: Partial<{
    name: string;
    slug: string;
    description: string;
    duration: number;
    locationType: string;
    color: string;
    isActive: boolean;
    inboxId: number | null;
    settings: BookingSettings;
  }>,
) {
  const [et] = await db
    .update(calendarEventTypes)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(calendarEventTypes.accountId, accountId), eq(calendarEventTypes.id, id)))
    .returning();
  return et ?? null;
}

export async function deleteEventType(accountId: number, id: number) {
  await db
    .delete(calendarEventTypes)
    .where(and(eq(calendarEventTypes.accountId, accountId), eq(calendarEventTypes.id, id)));
}

// ─── Schedules ────────────────────────────────────────────────────────────────

export async function getSchedule(accountId: number, userId: number) {
  const [schedule] = await db
    .select()
    .from(calendarSchedules)
    .where(
      and(
        eq(calendarSchedules.accountId, accountId),
        eq(calendarSchedules.userId, userId),
        eq(calendarSchedules.isDefault, true),
      ),
    )
    .limit(1);
  return schedule ?? null;
}

export async function upsertSchedule(
  accountId: number,
  userId: number,
  data: {
    name?: string;
    timezone: string;
    availability: AvailabilityDay[];
  },
) {
  const existing = await getSchedule(accountId, userId);
  if (existing) {
    const [updated] = await db
      .update(calendarSchedules)
      .set({
        name: data.name ?? existing.name,
        timezone: data.timezone,
        availability: data.availability,
        updatedAt: new Date(),
      })
      .where(eq(calendarSchedules.id, existing.id))
      .returning();
    return updated!;
  }

  const [created] = await db
    .insert(calendarSchedules)
    .values({
      accountId,
      userId,
      name: data.name ?? "Working Hours",
      timezone: data.timezone,
      availability: data.availability,
      isDefault: true,
    })
    .returning();
  return created!;
}

// ─── Slot Calculation ─────────────────────────────────────────────────────────

function parseTime(timeStr: string, baseDate: Date): Date {
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date(baseDate);
  d.setHours(h!, m!, 0, 0);
  return d;
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && aEnd > bStart;
}

export async function getAvailableSlots(
  eventTypeId: number,
  dateStr: string, // "2026-03-15"
  agentUserId: number,
): Promise<TimeSlot[]> {
  const [eventType] = await db
    .select()
    .from(calendarEventTypes)
    .where(eq(calendarEventTypes.id, eventTypeId))
    .limit(1);
  if (!eventType) return [];

  const [schedule] = await db
    .select()
    .from(calendarSchedules)
    .where(
      and(
        eq(calendarSchedules.userId, agentUserId),
        eq(calendarSchedules.isDefault, true),
      ),
    )
    .limit(1);
  if (!schedule) return [];

  const targetDate = new Date(dateStr + "T00:00:00");
  const dayOfWeek = targetDate.getDay();

  const availability = (schedule.availability ?? []) as AvailabilityDay[];
  const dayAvailability = availability.find((d) => d.dayOfWeek === dayOfWeek);
  if (!dayAvailability || !dayAvailability.periods.length) return [];

  const settings = (eventType.settings ?? {}) as BookingSettings;
  const duration = eventType.duration;
  const bufferMinutes = settings.bufferMinutes ?? 0;
  const minNoticeHours = settings.minNoticeHours ?? 1;

  // Generate raw slots from schedule periods
  const rawSlots: TimeSlot[] = [];
  for (const period of dayAvailability.periods) {
    const periodStart = parseTime(period.start, targetDate);
    const periodEnd = parseTime(period.end, targetDate);
    let slotStart = new Date(periodStart);

    while (slotStart.getTime() + duration * 60_000 <= periodEnd.getTime()) {
      const slotEnd = new Date(slotStart.getTime() + duration * 60_000);
      rawSlots.push({ start: new Date(slotStart), end: slotEnd, available: true });
      slotStart = new Date(slotStart.getTime() + duration * 60_000);
    }
  }

  if (!rawSlots.length) return [];

  const dayStart = new Date(targetDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(targetDate);
  dayEnd.setHours(23, 59, 59, 999);

  // Fetch existing bookings for this agent on this day
  const existingBookings = await db
    .select()
    .from(calendarBookings)
    .where(
      and(
        eq(calendarBookings.assignedUserId, agentUserId),
        gte(calendarBookings.startAt, dayStart),
        lte(calendarBookings.endAt, dayEnd),
        ne(calendarBookings.status, "CANCELLED"),
      ),
    );

  // Fetch blocked times
  const blockedTimes = await db
    .select()
    .from(calendarBlockedTimes)
    .where(
      and(
        eq(calendarBlockedTimes.userId, agentUserId),
        gte(calendarBlockedTimes.startAt, dayStart),
        lte(calendarBlockedTimes.endAt, dayEnd),
      ),
    );

  const now = new Date();
  const minNoticeMs = minNoticeHours * 3_600_000;

  // Mark slots as unavailable
  return rawSlots.map((slot) => {
    // Too soon
    if (slot.start.getTime() - now.getTime() < minNoticeMs) {
      return { ...slot, available: false };
    }

    // Overlaps an existing booking (+ buffer)
    for (const booking of existingBookings) {
      const bufferedStart = new Date(booking.startAt.getTime() - bufferMinutes * 60_000);
      const bufferedEnd = new Date(booking.endAt.getTime() + bufferMinutes * 60_000);
      if (overlaps(slot.start, slot.end, bufferedStart, bufferedEnd)) {
        return { ...slot, available: false };
      }
    }

    // Overlaps a blocked time
    for (const block of blockedTimes) {
      if (overlaps(slot.start, slot.end, block.startAt, block.endAt)) {
        return { ...slot, available: false };
      }
    }

    return slot;
  });
}

// ─── Round-Robin Agent Selection ─────────────────────────────────────────────

async function pickAvailableAgent(
  candidateUserIds: number[],
  eventTypeId: number,
  startAt: Date,
  endAt: Date,
): Promise<number | null> {
  if (!candidateUserIds.length) return null;

  // Count confirmed bookings in next 7 days per agent
  const oneWeekLater = new Date(Date.now() + 7 * 24 * 3_600_000);

  const bookingCounts = await db
    .select({
      userId: calendarBookings.assignedUserId,
      count: sql<number>`count(*)::int`,
    })
    .from(calendarBookings)
    .where(
      and(
        inArray(calendarBookings.assignedUserId, candidateUserIds),
        gte(calendarBookings.startAt, new Date()),
        lte(calendarBookings.startAt, oneWeekLater),
        ne(calendarBookings.status, "CANCELLED"),
      ),
    )
    .groupBy(calendarBookings.assignedUserId);

  const countMap = new Map(bookingCounts.map((r) => [r.userId, r.count]));

  // Filter agents who have the requested slot available
  const dateStr = startAt.toISOString().split("T")[0]!;
  for (const userId of candidateUserIds.sort(
    (a, b) => (countMap.get(a) ?? 0) - (countMap.get(b) ?? 0),
  )) {
    const slots = await getAvailableSlots(eventTypeId, dateStr, userId);
    const hasSlot = slots.some(
      (s) => s.available && s.start.getTime() === startAt.getTime(),
    );
    if (hasSlot) return userId;
  }

  return null;
}

export async function resolveAgent(
  eventType: typeof calendarEventTypes.$inferSelect,
  startAt: Date,
  endAt: Date,
): Promise<number | null> {
  if (eventType.scope === "USER" && eventType.userId) {
    return eventType.userId;
  }

  if (eventType.scope === "TEAM" && eventType.teamId) {
    const members = await db
      .select({ userId: teamMembers.userId })
      .from(teamMembers)
      .where(eq(teamMembers.teamId, eventType.teamId));
    return pickAvailableAgent(
      members.map((m) => m.userId),
      eventType.id,
      startAt,
      endAt,
    );
  }

  if (eventType.scope === "GLOBAL") {
    // All users in the account
    const accountUsers = await db
      .select({ userId: calendarSchedules.userId })
      .from(calendarSchedules)
      .where(eq(calendarSchedules.accountId, eventType.accountId));
    return pickAvailableAgent(
      accountUsers.map((u) => u.userId),
      eventType.id,
      startAt,
      endAt,
    );
  }

  return null;
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

export async function createBooking(params: {
  accountId: number;
  eventTypeId: number;
  assignedUserId: number;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  startAt: Date;
  endAt: Date;
  notes?: string;
  metadata?: Record<string, unknown>;
}) {
  const cancelToken = randomBytes(32).toString("hex");
  const rescheduleToken = randomBytes(32).toString("hex");

  const [booking] = await db
    .insert(calendarBookings)
    .values({
      accountId: params.accountId,
      eventTypeId: params.eventTypeId,
      assignedUserId: params.assignedUserId,
      contactName: params.contactName,
      contactEmail: params.contactEmail,
      contactPhone: params.contactPhone ?? null,
      startAt: params.startAt,
      endAt: params.endAt,
      status: "CONFIRMED",
      notes: params.notes ?? null,
      cancelToken,
      rescheduleToken,
      metadata: params.metadata ?? {},
    })
    .returning();

  if (!booking) throw new Error("Failed to create booking");

  // Enqueue confirmation emails
  const eventType = await getEventTypeById(params.accountId, params.eventTypeId);
  const agent = await db
    .select()
    .from(users)
    .where(eq(users.id, params.assignedUserId))
    .limit(1)
    .then((r) => r[0]);

  const subject = `Booking confirmed: ${eventType?.name ?? "Meeting"}`;
  const appUrl = process.env.PUBLIC_APP_URL ?? "";
  const cancelUrl = `${appUrl}/booking/cancel/${cancelToken}`;
  const rescheduleUrl = `${appUrl}/booking/reschedule/${rescheduleToken}`;
  const body = [
    `Hi ${params.contactName},`,
    ``,
    `Your booking has been confirmed.`,
    ``,
    `Event: ${eventType?.name}`,
    `With: ${agent?.name}`,
    `Date: ${params.startAt.toLocaleString()}`,
    booking.meetingUrl ? `Meeting link: ${booking.meetingUrl}` : "",
    ``,
    `To reschedule: ${rescheduleUrl}`,
    `To cancel: ${cancelUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  await enqueueEmail({
    type: "send_notification",
    to: params.contactEmail,
    subject,
    body,
    accountId: params.accountId,
  });

  if (agent?.email) {
    await enqueueEmail({
      type: "send_notification",
      to: agent.email,
      subject: `New booking: ${params.contactName}`,
      body: [
        `New booking from ${params.contactName} (${params.contactEmail})`,
        ``,
        `Event: ${eventType?.name}`,
        `Date: ${params.startAt.toLocaleString()}`,
      ].join("\n"),
      accountId: params.accountId,
    });
  }

  // Real-time broadcast
  broadcastToAccount(params.accountId, "booking:created", {
    bookingId: booking.id,
    assignedUserId: params.assignedUserId,
    startAt: params.startAt,
  });

  return booking;
}

export async function getBooking(accountId: number, id: number) {
  const [booking] = await db
    .select()
    .from(calendarBookings)
    .where(and(eq(calendarBookings.accountId, accountId), eq(calendarBookings.id, id)))
    .limit(1);
  return booking ?? null;
}

export async function listBookings(
  accountId: number,
  params?: {
    userId?: number;
    status?: string;
    from?: Date;
    to?: Date;
  },
) {
  const conditions = [eq(calendarBookings.accountId, accountId)];
  if (params?.userId) conditions.push(eq(calendarBookings.assignedUserId, params.userId));
  if (params?.status) conditions.push(eq(calendarBookings.status, params.status));
  if (params?.from) conditions.push(gte(calendarBookings.startAt, params.from));
  if (params?.to) conditions.push(lte(calendarBookings.endAt, params.to));

  return db
    .select()
    .from(calendarBookings)
    .where(and(...conditions))
    .orderBy(asc(calendarBookings.startAt));
}

export async function updateBookingStatus(
  accountId: number,
  id: number,
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW",
) {
  const extra: Partial<typeof calendarBookings.$inferInsert> = {};
  if (status === "CANCELLED") extra.cancelledAt = new Date();

  const [booking] = await db
    .update(calendarBookings)
    .set({ status, ...extra, updatedAt: new Date() })
    .where(and(eq(calendarBookings.accountId, accountId), eq(calendarBookings.id, id)))
    .returning();

  if (booking) {
    broadcastToAccount(accountId, "booking:status_updated", {
      bookingId: id,
      status,
    });
  }

  return booking ?? null;
}

export async function getBookingByCancelToken(cancelToken: string) {
  const [booking] = await db
    .select()
    .from(calendarBookings)
    .where(eq(calendarBookings.cancelToken, cancelToken))
    .limit(1);
  return booking ?? null;
}

export async function cancelBookingByToken(cancelToken: string) {
  const [booking] = await db
    .select()
    .from(calendarBookings)
    .where(eq(calendarBookings.cancelToken, cancelToken))
    .limit(1);

  if (!booking || booking.status === "CANCELLED") return null;

  const [updated] = await db
    .update(calendarBookings)
    .set({ status: "CANCELLED", cancelledAt: new Date(), updatedAt: new Date() })
    .where(eq(calendarBookings.id, booking.id))
    .returning();

  if (updated) {
    broadcastToAccount(booking.accountId, "booking:cancelled", {
      bookingId: booking.id,
    });

    // Notify contact
    await enqueueEmail({
      type: "send_notification",
      to: booking.contactEmail,
      subject: "Booking cancelled",
      body: `Your booking on ${booking.startAt.toLocaleString()} has been cancelled.`,
      accountId: booking.accountId,
    });
  }

  return updated ?? null;
}

export async function getBookingByRescheduleToken(rescheduleToken: string) {
  const [booking] = await db
    .select()
    .from(calendarBookings)
    .where(eq(calendarBookings.rescheduleToken, rescheduleToken))
    .limit(1);
  return booking ?? null;
}

export async function rescheduleBooking(
  rescheduleToken: string,
  newStartAt: Date,
  newEndAt: Date,
) {
  const booking = await getBookingByRescheduleToken(rescheduleToken);
  if (!booking || booking.status === "CANCELLED") return null;

  const [updated] = await db
    .update(calendarBookings)
    .set({ startAt: newStartAt, endAt: newEndAt, updatedAt: new Date() })
    .where(eq(calendarBookings.id, booking.id))
    .returning();

  if (updated) {
    broadcastToAccount(booking.accountId, "booking:rescheduled", {
      bookingId: booking.id,
      startAt: newStartAt,
      endAt: newEndAt,
    });

    await enqueueEmail({
      type: "send_notification",
      to: booking.contactEmail,
      subject: "Booking rescheduled",
      body: `Your booking has been rescheduled to ${newStartAt.toLocaleString()}.`,
      accountId: booking.accountId,
    });
  }

  return updated ?? null;
}

// ─── Blocked Times ────────────────────────────────────────────────────────────

export async function createBlockedTime(
  accountId: number,
  userId: number,
  data: { startAt: Date; endAt: Date; reason?: string },
) {
  const [blocked] = await db
    .insert(calendarBlockedTimes)
    .values({ accountId, userId, ...data })
    .returning();
  return blocked!;
}

export async function deleteBlockedTime(accountId: number, userId: number, id: number) {
  await db
    .delete(calendarBlockedTimes)
    .where(
      and(
        eq(calendarBlockedTimes.accountId, accountId),
        eq(calendarBlockedTimes.userId, userId),
        eq(calendarBlockedTimes.id, id),
      ),
    );
}

export async function listBlockedTimes(accountId: number, userId: number) {
  return db
    .select()
    .from(calendarBlockedTimes)
    .where(
      and(
        eq(calendarBlockedTimes.accountId, accountId),
        eq(calendarBlockedTimes.userId, userId),
        gte(calendarBlockedTimes.endAt, new Date()),
      ),
    )
    .orderBy(asc(calendarBlockedTimes.startAt));
}

// ─── External Connections ─────────────────────────────────────────────────────

export async function getExternalConnections(accountId: number, userId: number) {
  return db
    .select()
    .from(calendarExternalConns)
    .where(
      and(
        eq(calendarExternalConns.accountId, accountId),
        eq(calendarExternalConns.userId, userId),
      ),
    );
}

export async function saveExternalConnection(
  accountId: number,
  userId: number,
  provider: string,
  credentials: Record<string, unknown>,
  externalCalendarId?: string,
) {
  const existing = await db
    .select()
    .from(calendarExternalConns)
    .where(
      and(
        eq(calendarExternalConns.userId, userId),
        eq(calendarExternalConns.provider, provider),
      ),
    )
    .limit(1);

  if (existing.length) {
    const [updated] = await db
      .update(calendarExternalConns)
      .set({ credentials, externalCalendarId: externalCalendarId ?? null, updatedAt: new Date() })
      .where(eq(calendarExternalConns.id, existing[0]!.id))
      .returning();
    return updated!;
  }

  const [created] = await db
    .insert(calendarExternalConns)
    .values({ accountId, userId, provider, credentials, externalCalendarId: externalCalendarId ?? null })
    .returning();
  return created!;
}

export async function disconnectExternalCalendar(
  accountId: number,
  userId: number,
  provider: string,
) {
  await db
    .delete(calendarExternalConns)
    .where(
      and(
        eq(calendarExternalConns.accountId, accountId),
        eq(calendarExternalConns.userId, userId),
        eq(calendarExternalConns.provider, provider),
      ),
    );
}

// ─── iCal Feed ────────────────────────────────────────────────────────────────

export function generateIcalFeedToken(userId: number): string {
  const secret = process.env.SECRET_KEY_BASE ?? "xat-secret";
  return createHmac("sha256", secret).update(`ical:${userId}`).digest("hex");
}

export async function generateIcalFeed(userId: number): Promise<string> {
  const bookings = await db
    .select()
    .from(calendarBookings)
    .where(
      and(
        eq(calendarBookings.assignedUserId, userId),
        ne(calendarBookings.status, "CANCELLED"),
        gte(calendarBookings.startAt, new Date(Date.now() - 30 * 24 * 3_600_000)), // last 30 days
      ),
    )
    .orderBy(asc(calendarBookings.startAt));

  const formatDate = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");

  const events = bookings
    .map(
      (b) =>
        [
          "BEGIN:VEVENT",
          `UID:xat-booking-${b.id}@xat`,
          `DTSTART:${formatDate(b.startAt)}`,
          `DTEND:${formatDate(b.endAt)}`,
          `SUMMARY:${b.contactName}`,
          b.location ? `LOCATION:${b.location}` : "",
          b.meetingUrl ? `URL:${b.meetingUrl}` : "",
          `STATUS:${b.status === "CONFIRMED" ? "CONFIRMED" : "TENTATIVE"}`,
          "END:VEVENT",
        ]
          .filter(Boolean)
          .join("\r\n"),
    )
    .join("\r\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Xat//Calendar//EN",
    "CALSCALE:GREGORIAN",
    events,
    "END:VCALENDAR",
  ].join("\r\n");
}
