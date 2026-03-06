import { json, error } from "@sveltejs/kit";
import { requireAuth } from "$lib/server/api-auth.js";
import {
  getEventTypeById,
  updateEventType,
  deleteEventType,
} from "$lib/server/services/calendar.service.js";

export async function GET(event) {
  const { account } = requireAuth(event);
  const id = Number(event.params.id);
  const et = await getEventTypeById(account.id, id);
  if (!et) error(404, { message: "Event type not found" });
  return json({ data: et });
}

export async function PATCH(event) {
  const { account } = requireAuth(event);
  const id = Number(event.params.id);
  const body = await event.request.json().catch(() => ({}));

  const et = await updateEventType(account.id, id, body);
  if (!et) error(404, { message: "Event type not found" });
  return json({ data: et });
}

export async function DELETE(event) {
  const { account } = requireAuth(event);
  const id = Number(event.params.id);
  await deleteEventType(account.id, id);
  return new Response(null, { status: 204 });
}
