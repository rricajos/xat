import { json, error } from "@sveltejs/kit";
import {
  createBooking,
  getPublicEventType,
  resolveAgent,
} from "$lib/server/services/calendar.service.js";

export async function POST(event) {
  const body = await event.request.json().catch(() => null);
  if (
    !body?.eventTypeId ||
    !body?.contactName ||
    !body?.contactEmail ||
    !body?.startAt
  ) {
    error(400, { message: "eventTypeId, contactName, contactEmail, startAt required" });
  }

  // Resolve event type (must be active and found by ID)
  const { db } = await import("@xat/db");
  const { calendarEventTypes } = await import("@xat/db/schema");
  const { eq } = await import("drizzle-orm");

  const [eventType] = await db
    .select()
    .from(calendarEventTypes)
    .where(eq(calendarEventTypes.id, Number(body.eventTypeId)))
    .limit(1);

  if (!eventType || !eventType.isActive) {
    error(404, { message: "Event type not found" });
  }

  const startAt = new Date(body.startAt);
  const endAt = new Date(startAt.getTime() + eventType.duration * 60_000);

  const assignedUserId = await resolveAgent(eventType, startAt, endAt);
  if (!assignedUserId) {
    error(409, { message: "No available agent for the selected time" });
  }

  const booking = await createBooking({
    accountId: eventType.accountId,
    eventTypeId: eventType.id,
    assignedUserId,
    contactName: body.contactName,
    contactEmail: body.contactEmail,
    contactPhone: body.contactPhone,
    startAt,
    endAt,
    notes: body.notes,
    metadata: body.metadata,
  });

  return json({ data: { id: booking.id, cancelToken: booking.cancelToken, startAt, endAt } }, { status: 201 });
}
