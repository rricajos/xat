import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { requireAuth } from "$lib/server/api-auth";
import { listNotifications } from "$lib/server/services/notification.service";

export const GET: RequestHandler = async (event) => {
  const { user, account } = requireAuth(event);

  const { data } = await listNotifications(account.id, user.id, {
    limit: 20,
  });

  return json({ data });
};
