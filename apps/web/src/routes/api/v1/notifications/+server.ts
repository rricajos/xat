import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { requireAuth } from "$lib/server/api-auth";
import {
  listNotifications,
  getUnreadCount,
} from "$lib/server/services/notification.service";

export const GET: RequestHandler = async (event) => {
  const { user, account } = requireAuth(event);

  const type = event.url.searchParams.get("type") ?? undefined;
  const page = parseInt(event.url.searchParams.get("page") ?? "1");
  const limit = parseInt(event.url.searchParams.get("limit") ?? "20");

  const { data, total } = await listNotifications(account.id, user.id, {
    page,
    limit,
    type,
  });

  const unreadCount = await getUnreadCount(account.id, user.id);

  return json({ data, meta: { total, unreadCount, page, limit } });
};
