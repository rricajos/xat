import { json, error } from "@sveltejs/kit";
import { getPublicEventType, getAvailableSlots, resolveAgent } from "$lib/server/services/calendar.service.js";

// Global event slots — returns first available time across all agents
export async function GET(event) {
  const { slug } = event.params;
  const url = new URL(event.request.url);
  const date = url.searchParams.get("date");
  if (!date) error(400, { message: "date query param required" });

  const result = await getPublicEventType({ slug, isGlobal: true });
  if (!result) error(404, { message: "Event type not found" });

  const { eventType } = result as { eventType: { id: number; duration: number; accountId: number } };

  // We return slots from the perspective of the event type (checking all agents)
  // For display purposes we just need to know which dates have ANY availability
  const dayStart = new Date(date + "T00:00:00");
  const dayEnd = new Date(dayStart.getTime() + 24 * 3_600_000);

  const assignedUserId = await resolveAgent(eventType as Parameters<typeof resolveAgent>[0], dayStart, dayEnd);
  if (!assignedUserId) return json({ data: [] });

  const slots = await getAvailableSlots(eventType.id, date, assignedUserId);
  return json({ data: slots.filter((s) => s.available) });
}
