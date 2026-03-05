import type { RequestHandler } from "./$types";
import { requireAuth, jsonResponse, errorResponse } from "$lib/server/api-auth";
import {
  listLabels,
  createLabel,
} from "$lib/server/services/label.service";

export const GET: RequestHandler = async (event) => {
  const { account } = requireAuth(event);
  const data = await listLabels(account.id);
  return jsonResponse(data);
};

export const POST: RequestHandler = async (event) => {
  const { account } = requireAuth(event);
  const body = await event.request.json();

  if (!body.title) return errorResponse("Title is required");

  const label = await createLabel({
    accountId: account.id,
    title: body.title,
    description: body.description,
    color: body.color,
    showOnSidebar: body.show_on_sidebar,
  });

  return jsonResponse(label, 201);
};
