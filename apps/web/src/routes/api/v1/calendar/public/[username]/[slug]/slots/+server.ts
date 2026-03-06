import { json, error } from "@sveltejs/kit";
import {
  getPublicEventType,
  getAvailableSlots,
} from "$lib/server/services/calendar.service.js";

export async function GET(event) {
  const { username, slug } = event.params;
  const url = new URL(event.request.url);
  const date = url.searchParams.get("date"); // "2026-03-15"
  if (!date) error(400, { message: "date query param required" });

  const result = await getPublicEventType({ slug, username });
  if (!result) error(404, { message: "Event type not found" });

  const { eventType, agent } = result as { eventType: { id: number; duration: number }; agent?: { id: number } };
  if (!agent) error(404, { message: "Agent not found" });

  const slots = await getAvailableSlots(eventType.id, date, agent.id);
  return json({ data: slots.filter((s) => s.available) });
}
