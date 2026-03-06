import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { requireAdmin } from "$lib/server/api-auth";
import {
  listIntegrations,
  upsertIntegration,
} from "$lib/server/services/integration.service";

export const GET: RequestHandler = async (event) => {
  const { account } = requireAdmin(event);
  const data = await listIntegrations(account.id);
  return json({ data });
};

export const POST: RequestHandler = async (event) => {
  const { account } = requireAdmin(event);
  const body = await event.request.json();

  const { appId, settings, enabled } = body as {
    appId: string;
    settings: Record<string, unknown>;
    enabled?: boolean;
  };

  if (!appId || !settings) {
    return json({ error: "appId and settings are required" }, { status: 400 });
  }

  const validApps = ["slack", "dialogflow", "linear", "google_translate"];
  if (!validApps.includes(appId)) {
    return json({ error: `Invalid appId. Must be one of: ${validApps.join(", ")}` }, { status: 400 });
  }

  const integration = await upsertIntegration({
    accountId: account.id,
    appId: appId as "slack" | "dialogflow" | "linear" | "google_translate",
    settings: settings as Parameters<typeof upsertIntegration>[0]["settings"],
    enabled,
  });

  return json({ data: integration }, { status: 201 });
};
