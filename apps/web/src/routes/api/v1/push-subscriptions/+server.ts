import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { requireAuth } from "$lib/server/api-auth";
import {
  subscribePush,
  unsubscribePush,
} from "$lib/server/services/push-notification.service";

export const POST: RequestHandler = async (event) => {
  const { user } = requireAuth(event);
  const body = await event.request.json();

  const { endpoint, keys } = body as {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return json(
      { error: "endpoint, keys.p256dh, and keys.auth are required" },
      { status: 400 },
    );
  }

  const subscription = await subscribePush({
    userId: user.id,
    endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
  });

  return json({ data: subscription }, { status: 201 });
};

export const DELETE: RequestHandler = async (event) => {
  const { user } = requireAuth(event);
  const body = await event.request.json();

  const { endpoint } = body as { endpoint?: string };
  if (!endpoint) {
    return json({ error: "endpoint is required" }, { status: 400 });
  }

  await unsubscribePush(user.id, endpoint);
  return new Response(null, { status: 204 });
};
