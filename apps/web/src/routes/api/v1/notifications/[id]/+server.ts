import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { requireAuth } from "$lib/server/api-auth";
import {
  markAsRead,
  deleteNotification,
  snoozeNotification,
} from "$lib/server/services/notification.service";

export const PATCH: RequestHandler = async (event) => {
  const { user, account } = requireAuth(event);
  const notificationId = parseInt(event.params.id);

  const body = await event.request.json();

  if (body.readAt !== undefined) {
    const updated = await markAsRead(account.id, user.id, notificationId);
    return json({ data: updated });
  }

  if (body.snoozedUntil) {
    const updated = await snoozeNotification(
      account.id,
      user.id,
      notificationId,
      new Date(body.snoozedUntil),
    );
    return json({ data: updated });
  }

  return json({ error: "No valid update field provided" }, { status: 400 });
};

export const DELETE: RequestHandler = async (event) => {
  const { user, account } = requireAuth(event);
  const notificationId = parseInt(event.params.id);

  await deleteNotification(account.id, user.id, notificationId);
  return json({ success: true });
};
