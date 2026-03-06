import { json, error } from "@sveltejs/kit";
import { requireAuth } from "$lib/server/api-auth.js";
import {
  listBlockedTimes,
  createBlockedTime,
} from "$lib/server/services/calendar.service.js";

export async function GET(event) {
  const { user, account } = requireAuth(event);
  const blockedTimes = await listBlockedTimes(account.id, user.id);
  return json({ data: blockedTimes });
}

export async function POST(event) {
  const { user, account } = requireAuth(event);
  const body = await event.request.json().catch(() => null);
  if (!body?.startAt || !body?.endAt) {
    error(400, { message: "startAt and endAt required" });
  }

  const blocked = await createBlockedTime(account.id, user.id, {
    startAt: new Date(body.startAt),
    endAt: new Date(body.endAt),
    reason: body.reason,
  });
  return json({ data: blocked }, { status: 201 });
}
