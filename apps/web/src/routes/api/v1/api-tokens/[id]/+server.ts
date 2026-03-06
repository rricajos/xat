import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { requireAuth } from "$lib/server/api-auth";
import { deleteApiToken } from "$lib/server/services/api-token.service";

export const DELETE: RequestHandler = async (event) => {
  const { user, account } = requireAuth(event);
  const tokenId = parseInt(event.params.id);

  await deleteApiToken(account.id, user.id, tokenId);
  return json({ success: true });
};
