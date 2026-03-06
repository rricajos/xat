import { json, error } from "@sveltejs/kit";
import { requireAuth } from "$lib/server/api-auth.js";
import {
  listEventTypes,
  createEventType,
} from "$lib/server/services/calendar.service.js";

export async function GET(event) {
  const { user, account } = requireAuth(event);
  const url = new URL(event.request.url);
  const scope = url.searchParams.get("scope") ?? undefined;

  const eventTypes = await listEventTypes(account.id, {
    userId: scope === "USER" ? user.id : undefined,
    scope,
  });

  return json({ data: eventTypes });
}

export async function POST(event) {
  const { user, account } = requireAuth(event);
  const body = await event.request.json().catch(() => null);
  if (!body?.name || !body?.slug) {
    error(400, { message: "name and slug are required" });
  }

  const scope = body.scope ?? "USER";
  const et = await createEventType(account.id, {
    userId: scope === "USER" ? user.id : undefined,
    teamId: scope === "TEAM" ? body.teamId : undefined,
    scope,
    name: body.name,
    slug: body.slug,
    description: body.description,
    duration: body.duration,
    locationType: body.locationType,
    color: body.color,
    inboxId: body.inboxId,
    settings: body.settings,
  });

  return json({ data: et }, { status: 201 });
}
