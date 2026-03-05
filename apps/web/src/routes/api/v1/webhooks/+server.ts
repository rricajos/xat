import type { RequestHandler } from "./$types";
import { requireAuth, jsonResponse, errorResponse } from "$lib/server/api-auth";
import {
  listWebhooks,
  createWebhook,
} from "$lib/server/services/webhook.service";

export const GET: RequestHandler = async (event) => {
  const { account } = requireAuth(event);
  const data = await listWebhooks(account.id);
  return jsonResponse(data);
};

export const POST: RequestHandler = async (event) => {
  const { account } = requireAuth(event);
  const body = await event.request.json();

  if (!body.url) return errorResponse("URL is required");

  const webhook = await createWebhook({
    accountId: account.id,
    url: body.url,
    subscriptions: body.subscriptions,
  });

  return jsonResponse(webhook, 201);
};
