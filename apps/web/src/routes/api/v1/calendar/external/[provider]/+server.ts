import { json } from "@sveltejs/kit";
import { requireAuth } from "$lib/server/api-auth.js";
import {
  getExternalConnections,
  disconnectExternalCalendar,
} from "$lib/server/services/calendar.service.js";

export async function GET(event) {
  const { user, account } = requireAuth(event);
  const connections = await getExternalConnections(account.id, user.id);
  return json({ data: connections });
}

export async function DELETE(event) {
  const { user, account } = requireAuth(event);
  const provider = event.params.provider.toUpperCase();
  await disconnectExternalCalendar(account.id, user.id, provider);
  return new Response(null, { status: 204 });
}
