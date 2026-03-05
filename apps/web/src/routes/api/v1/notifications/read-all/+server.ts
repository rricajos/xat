import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { requireAuth } from "$lib/server/api-auth";
import { markAllAsRead } from "$lib/server/services/notification.service";

export const POST: RequestHandler = async (event) => {
  const { user, account } = requireAuth(event);

  await markAllAsRead(account.id, user.id);

  return json({ data: { success: true } });
};
