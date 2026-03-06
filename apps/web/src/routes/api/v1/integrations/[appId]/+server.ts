import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { requireAdmin } from "$lib/server/api-auth";
import {
  getIntegration,
  deleteIntegration,
  toggleIntegration,
} from "$lib/server/services/integration.service";

export const GET: RequestHandler = async (event) => {
  const { account } = requireAdmin(event);
  const { appId } = event.params;

  const integration = await getIntegration(account.id, appId);
  if (!integration) {
    return json({ error: "Integration not found" }, { status: 404 });
  }

  return json({ data: integration });
};

export const PATCH: RequestHandler = async (event) => {
  const { account } = requireAdmin(event);
  const { appId } = event.params;
  const body = await event.request.json();

  const { enabled } = body as { enabled?: boolean };

  if (typeof enabled !== "boolean") {
    return json({ error: "enabled (boolean) is required" }, { status: 400 });
  }

  const updated = await toggleIntegration(account.id, appId, enabled);
  if (!updated) {
    return json({ error: "Integration not found" }, { status: 404 });
  }

  return json({ data: updated });
};

export const DELETE: RequestHandler = async (event) => {
  const { account } = requireAdmin(event);
  const { appId } = event.params;

  await deleteIntegration(account.id, appId);
  return new Response(null, { status: 204 });
};
