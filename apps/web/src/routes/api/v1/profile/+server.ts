import type { RequestHandler } from "./$types";
import { requireAuth, jsonResponse } from "$lib/server/api-auth";

export const GET: RequestHandler = async (event) => {
  const { user, account } = requireAuth(event);
  return jsonResponse({ user, account });
};
