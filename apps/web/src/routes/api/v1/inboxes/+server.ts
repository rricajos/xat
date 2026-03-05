import type { RequestHandler } from "./$types";
import { requireAuth, jsonResponse } from "$lib/server/api-auth";
import {
  listInboxes,
  createWebWidgetInbox,
} from "$lib/server/services/inbox.service";

export const GET: RequestHandler = async (event) => {
  const { account } = requireAuth(event);
  const data = await listInboxes(account.id);
  return jsonResponse(data);
};

export const POST: RequestHandler = async (event) => {
  const { account } = requireAuth(event);
  const body = await event.request.json();

  const result = await createWebWidgetInbox({
    accountId: account.id,
    name: body.name,
    websiteUrl: body.website_url,
    welcomeTitle: body.welcome_title,
    welcomeTagline: body.welcome_tagline,
    widgetColor: body.widget_color,
  });

  return jsonResponse(result, 201);
};
