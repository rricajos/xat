import type { RequestHandler } from "./$types";
import { requireAuth, jsonResponse, errorResponse } from "$lib/server/api-auth";
import {
  listCannedResponses,
  createCannedResponse,
} from "$lib/server/services/canned-response.service";

export const GET: RequestHandler = async (event) => {
  const { account } = requireAuth(event);
  const search = event.url.searchParams.get("search") ?? undefined;
  const data = await listCannedResponses(account.id, search);
  return jsonResponse(data);
};

export const POST: RequestHandler = async (event) => {
  const { account } = requireAuth(event);
  const body = await event.request.json();

  if (!body.short_code || !body.content) {
    return errorResponse("Short code and content are required");
  }

  const response = await createCannedResponse({
    accountId: account.id,
    shortCode: body.short_code,
    content: body.content,
  });

  return jsonResponse(response, 201);
};
