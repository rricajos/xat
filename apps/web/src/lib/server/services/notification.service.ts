import { db } from "@xat/db";
import { notifications } from "@xat/db/schema";
import { eq, and, isNull, desc, count } from "drizzle-orm";

export async function listNotifications(
  accountId: number,
  userId: number,
  options: { page?: number; limit?: number } = {},
) {
  const { page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;

  const [totalResult] = await db
    .select({ count: count() })
    .from(notifications)
    .where(
      and(
        eq(notifications.accountId, accountId),
        eq(notifications.userId, userId),
      ),
    );

  const rows = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.accountId, accountId),
        eq(notifications.userId, userId),
      ),
    )
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
    .offset(offset);

  return { data: rows, total: totalResult?.count ?? 0 };
}

export async function getUnreadCount(
  accountId: number,
  userId: number,
): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(notifications)
    .where(
      and(
        eq(notifications.accountId, accountId),
        eq(notifications.userId, userId),
        isNull(notifications.readAt),
      ),
    );

  return result?.count ?? 0;
}

export async function markAsRead(
  accountId: number,
  userId: number,
  notificationId: number,
) {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.accountId, accountId),
        eq(notifications.userId, userId),
      ),
    );
}

export async function markAllAsRead(accountId: number, userId: number) {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.accountId, accountId),
        eq(notifications.userId, userId),
        isNull(notifications.readAt),
      ),
    );
}

export async function createNotification(params: {
  accountId: number;
  userId: number;
  notificationType: string;
  primaryActorType?: string;
  primaryActorId?: number;
  secondaryActorType?: string;
  secondaryActorId?: number;
}) {
  const [notification] = await db
    .insert(notifications)
    .values(params)
    .returning();

  return notification;
}
