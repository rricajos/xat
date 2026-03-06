import { db } from "@xat/db";
import { notifications, users, accountUsers } from "@xat/db/schema";
import { eq, and, isNull, desc, count } from "drizzle-orm";
import { broadcastNotification } from "$lib/server/realtime/events";

export async function listNotifications(
  accountId: number,
  userId: number,
  options: { page?: number; limit?: number; type?: string } = {},
) {
  const { page = 1, limit = 20, type } = options;
  const offset = (page - 1) * limit;

  const conditions = [
    eq(notifications.accountId, accountId),
    eq(notifications.userId, userId),
  ];
  if (type) {
    conditions.push(eq(notifications.notificationType, type));
  }

  const [totalResult] = await db
    .select({ count: count() })
    .from(notifications)
    .where(and(...conditions));

  const rows = await db
    .select()
    .from(notifications)
    .where(and(...conditions))
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
  const [updated] = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.accountId, accountId),
        eq(notifications.userId, userId),
      ),
    )
    .returning();

  return updated;
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

export async function deleteNotification(
  accountId: number,
  userId: number,
  notificationId: number,
) {
  await db
    .delete(notifications)
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.accountId, accountId),
        eq(notifications.userId, userId),
      ),
    );
}

export async function snoozeNotification(
  accountId: number,
  userId: number,
  notificationId: number,
  snoozedUntil: Date,
) {
  const [updated] = await db
    .update(notifications)
    .set({ snoozedUntil })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.accountId, accountId),
        eq(notifications.userId, userId),
      ),
    )
    .returning();

  return updated;
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

  broadcastNotification(params.userId, notification);

  return notification;
}

export async function getUserNotificationPreferences(
  userId: number,
): Promise<Record<string, boolean>> {
  const [user] = await db
    .select({ uiSettings: users.uiSettings })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const settings = (user?.uiSettings ?? {}) as Record<string, unknown>;
  return (settings.notifications ?? {}) as Record<string, boolean>;
}

export async function createConversationAssignmentNotification(
  accountId: number,
  conversationId: number,
  assigneeId: number,
  assignerId?: number,
) {
  return createNotification({
    accountId,
    userId: assigneeId,
    notificationType: "conversation_assignment",
    primaryActorType: "Conversation",
    primaryActorId: conversationId,
    secondaryActorType: assignerId ? "User" : undefined,
    secondaryActorId: assignerId,
  });
}

export async function createMentionNotification(
  accountId: number,
  conversationId: number,
  mentionedUserId: number,
  mentionerUserId: number,
) {
  return createNotification({
    accountId,
    userId: mentionedUserId,
    notificationType: "conversation_mention",
    primaryActorType: "Conversation",
    primaryActorId: conversationId,
    secondaryActorType: "User",
    secondaryActorId: mentionerUserId,
  });
}

export async function createNewMessageNotification(
  accountId: number,
  conversationId: number,
  recipientUserId: number,
) {
  return createNotification({
    accountId,
    userId: recipientUserId,
    notificationType: "new_message",
    primaryActorType: "Conversation",
    primaryActorId: conversationId,
  });
}

export async function notifyConversationParticipants(
  accountId: number,
  conversationId: number,
  notificationType: string,
  excludeUserId?: number,
) {
  const agents = await db
    .select({ userId: accountUsers.userId })
    .from(accountUsers)
    .where(eq(accountUsers.accountId, accountId));

  for (const agent of agents) {
    if (agent.userId === excludeUserId) continue;

    const prefs = await getUserNotificationPreferences(agent.userId);

    if (notificationType === "new_message" && prefs.emailOnNewConversation === false) {
      continue;
    }

    await createNotification({
      accountId,
      userId: agent.userId,
      notificationType,
      primaryActorType: "Conversation",
      primaryActorId: conversationId,
    });
  }
}

export function extractMentions(content: string): number[] {
  const mentionRegex = /@\[([^\]]+)\]\((\d+)\)/g;
  const userIds: number[] = [];
  let match: RegExpExecArray | null;
  while ((match = mentionRegex.exec(content)) !== null) {
    const id = match[2];
    if (id) userIds.push(parseInt(id, 10));
  }
  return userIds;
}
