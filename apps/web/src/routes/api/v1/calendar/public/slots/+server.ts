import { json, error } from "@sveltejs/kit";
import { getAvailableSlots } from "$lib/server/services/calendar.service.js";
import type { RequestHandler } from "./$types";

// GET /api/v1/calendar/public/slots?eventTypeId=X&date=YYYY-MM-DD&tz=...
export const GET: RequestHandler = async ({ url }) => {
  const eventTypeId = parseInt(url.searchParams.get("eventTypeId") ?? "");
  const date = url.searchParams.get("date");
  const tz = url.searchParams.get("tz") ?? "UTC";

  if (!eventTypeId || !date) {
    return json({ error: "eventTypeId and date are required" }, { status: 400 });
  }

  const slots = await getAvailableSlots(eventTypeId, date, tz).catch(() => []);
  return json({ data: slots });
};
