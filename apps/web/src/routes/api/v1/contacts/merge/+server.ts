import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { requireAuth, errorResponse } from "$lib/server/api-auth";
import { mergeContacts } from "$lib/server/services/contact-merge.service";

export const POST: RequestHandler = async (event) => {
  const { account } = requireAuth(event);
  const body = await event.request.json();

  const { primaryContactId, secondaryContactId } = body;

  if (!primaryContactId || !secondaryContactId) {
    return errorResponse("Both primaryContactId and secondaryContactId are required", 400);
  }

  if (primaryContactId === secondaryContactId) {
    return errorResponse("Cannot merge a contact with itself", 400);
  }

  const result = await mergeContacts(account.id, primaryContactId, secondaryContactId);

  return json({ data: result });
};
