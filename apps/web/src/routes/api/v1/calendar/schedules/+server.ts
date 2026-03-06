import { json, error } from "@sveltejs/kit";
import { requireAuth } from "$lib/server/api-auth.js";
import {
  getSchedule,
  upsertSchedule,
} from "$lib/server/services/calendar.service.js";

export async function GET(event) {
  const { user, account } = requireAuth(event);
  const schedule = await getSchedule(account.id, user.id);
  return json({ data: schedule });
}

export async function PUT(event) {
  const { user, account } = requireAuth(event);
  const body = await event.request.json().catch(() => null);
  if (!body?.timezone || !Array.isArray(body?.availability)) {
    error(400, { message: "timezone and availability are required" });
  }

  const schedule = await upsertSchedule(account.id, user.id, {
    name: body.name,
    timezone: body.timezone,
    availability: body.availability,
  });
  return json({ data: schedule });
}
