import { db } from "@xat/db";
import { pushSubscriptions } from "@xat/db/schema";
import { eq } from "drizzle-orm";

export async function subscribePush(params: {
  userId: number;
  endpoint: string;
  p256dh: string;
  auth: string;
}) {
  const [subscription] = await db
    .insert(pushSubscriptions)
    .values(params)
    .returning();

  return subscription;
}

export async function unsubscribePush(userId: number, endpoint: string) {
  await db
    .delete(pushSubscriptions)
    .where(
      eq(pushSubscriptions.userId, userId),
    );
}

export async function getUserSubscriptions(userId: number) {
  return db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));
}

export async function sendPushNotification(
  userId: number,
  payload: {
    title: string;
    body: string;
    icon?: string;
    url?: string;
    tag?: string;
  },
) {
  const subscriptions = await getUserSubscriptions(userId);
  if (subscriptions.length === 0) return;

  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT ?? "mailto:admin@xat.app";

  if (!vapidPublicKey || !vapidPrivateKey) {
    return;
  }

  let webpush: typeof import("web-push");
  try {
    webpush = await import("web-push");
  } catch {
    return;
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  const payloadStr = JSON.stringify(payload);

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        payloadStr,
      );
    } catch (err: unknown) {
      // Remove expired/invalid subscriptions
      const statusCode = (err as { statusCode?: number })?.statusCode;
      if (statusCode === 410 || statusCode === 404) {
        await db
          .delete(pushSubscriptions)
          .where(eq(pushSubscriptions.id, sub.id));
      }
    }
  }
}
