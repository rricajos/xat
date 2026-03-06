import { db } from "@xat/db";
import {
  conversations,
  messages,
  attachments,
  contacts,
  inboxes,
  users,
} from "@xat/db/schema";
import { eq, and, desc, sql, count } from "drizzle-orm";
import {
  broadcastMessageCreated,
  broadcastConversationStatusChanged,
  broadcastConversationAssigned,
  broadcastConversationCreated,
} from "$lib/server/realtime/events";
import { createPendingSurvey } from "./csat.service.js";
import { enqueueEmail } from "../jobs/queue.js";

export interface ConversationListItem {
  id: number;
  displayId: number;
  status: number;
  priority: number | null;
  lastActivityAt: Date;
  createdAt: Date;
  contact: {
    id: number;
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
  };
  inbox: {
    id: number;
    name: string;
    channelType: string;
  };
  assignee: {
    id: number;
    name: string;
    avatarUrl: string | null;
  } | null;
  lastMessage: {
    content: string | null;
    messageType: number;
    createdAt: Date;
  } | null;
  unreadCount: number;
}

export async function listConversations(
  accountId: number,
  options: {
    status?: number;
    inboxId?: number;
    assigneeId?: number;
    page?: number;
    limit?: number;
  } = {},
): Promise<{ data: ConversationListItem[]; total: number }> {
  const { status = 0, page = 1, limit = 25 } = options;
  const offset = (page - 1) * limit;

  const conditions = [eq(conversations.accountId, accountId)];
  if (status !== undefined) conditions.push(eq(conversations.status, status));
  if (options.inboxId)
    conditions.push(eq(conversations.inboxId, options.inboxId));
  if (options.assigneeId)
    conditions.push(eq(conversations.assigneeId, options.assigneeId));

  const where = and(...conditions);

  const [totalResult] = await db
    .select({ count: count() })
    .from(conversations)
    .where(where);

  const rows = await db
    .select({
      id: conversations.id,
      displayId: conversations.displayId,
      status: conversations.status,
      priority: conversations.priority,
      lastActivityAt: conversations.lastActivityAt,
      createdAt: conversations.createdAt,
      contactId: conversations.contactId,
      contactName: contacts.name,
      contactEmail: contacts.email,
      contactAvatar: contacts.avatarUrl,
      inboxId: inboxes.id,
      inboxName: inboxes.name,
      inboxChannelType: inboxes.channelType,
      assigneeId: users.id,
      assigneeName: users.name,
      assigneeAvatar: users.avatarUrl,
    })
    .from(conversations)
    .leftJoin(contacts, eq(conversations.contactId, contacts.id))
    .leftJoin(inboxes, eq(conversations.inboxId, inboxes.id))
    .leftJoin(users, eq(conversations.assigneeId, users.id))
    .where(where)
    .orderBy(desc(conversations.lastActivityAt))
    .limit(limit)
    .offset(offset);

  const data: ConversationListItem[] = [];

  for (const row of rows) {
    // Get last message
    const [lastMsg] = await db
      .select({
        content: messages.content,
        messageType: messages.messageType,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(eq(messages.conversationId, row.id))
      .orderBy(desc(messages.createdAt))
      .limit(1);

    data.push({
      id: row.id,
      displayId: row.displayId,
      status: row.status,
      priority: row.priority,
      lastActivityAt: row.lastActivityAt,
      createdAt: row.createdAt,
      contact: {
        id: row.contactId,
        name: row.contactName,
        email: row.contactEmail,
        avatarUrl: row.contactAvatar,
      },
      inbox: {
        id: row.inboxId!,
        name: row.inboxName!,
        channelType: row.inboxChannelType!,
      },
      assignee: row.assigneeId
        ? {
            id: row.assigneeId,
            name: row.assigneeName!,
            avatarUrl: row.assigneeAvatar,
          }
        : null,
      lastMessage: lastMsg
        ? {
            content: lastMsg.content,
            messageType: lastMsg.messageType,
            createdAt: lastMsg.createdAt,
          }
        : null,
      unreadCount: 0,
    });
  }

  return { data, total: totalResult?.count ?? 0 };
}

export async function listConversationsByStatus(
  accountId: number,
  options: { inboxId?: number; assigneeId?: number; limit?: number } = {},
): Promise<Record<number, ConversationListItem[]>> {
  const { limit = 20 } = options;
  const statuses = [0, 2, 3, 1]; // open, pending, snoozed, resolved

  const result: Record<number, ConversationListItem[]> = {};

  for (const status of statuses) {
    const { data } = await listConversations(accountId, {
      status,
      limit,
      inboxId: options.inboxId,
      assigneeId: options.assigneeId,
    });
    result[status] = data;
  }

  return result;
}

export async function getConversation(accountId: number, displayId: number) {
  const [row] = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.accountId, accountId),
        eq(conversations.displayId, displayId),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function getConversationMessages(
  accountId: number,
  conversationId: number,
  options: { before?: number; limit?: number } = {},
) {
  const { limit = 50 } = options;

  const conditions = [
    eq(messages.accountId, accountId),
    eq(messages.conversationId, conversationId),
  ];

  if (options.before) {
    conditions.push(
      sql`${messages.id} < ${options.before}` as ReturnType<typeof eq>,
    );
  }

  const rows = await db
    .select()
    .from(messages)
    .where(and(...conditions))
    .orderBy(desc(messages.createdAt))
    .limit(limit);

  // Fetch attachments for all messages
  const messageIds = rows.map((r) => r.id);
  const allAttachments =
    messageIds.length > 0
      ? await db
          .select()
          .from(attachments)
          .where(sql`${attachments.messageId} IN (${sql.join(messageIds.map((id) => sql`${id}`), sql`, `)})`)
      : [];

  const attachmentMap = new Map<number, typeof allAttachments>();
  for (const att of allAttachments) {
    const list = attachmentMap.get(att.messageId) ?? [];
    list.push(att);
    attachmentMap.set(att.messageId, list);
  }

  return rows.reverse().map((msg) => ({
    ...msg,
    attachments: attachmentMap.get(msg.id) ?? [],
  }));
}

export async function createMessage(params: {
  accountId: number;
  conversationId: number;
  content: string;
  messageType: number;
  senderType: string;
  senderId: number | null;
  private?: boolean;
  contentType?: string;
}) {
  const [message] = await db
    .insert(messages)
    .values({
      accountId: params.accountId,
      conversationId: params.conversationId,
      content: params.content,
      messageType: params.messageType,
      senderType: params.senderType,
      senderId: params.senderId,
      private: params.private ?? false,
      contentType: params.contentType ?? "text",
    })
    .returning();

  // Update conversation last_activity_at
  await db
    .update(conversations)
    .set({ lastActivityAt: new Date(), updatedAt: new Date() })
    .where(eq(conversations.id, params.conversationId));

  // Broadcast real-time event
  broadcastMessageCreated(params.accountId, params.conversationId, message);

  return message;
}

export async function updateConversationStatus(
  accountId: number,
  conversationId: number,
  status: number,
) {
  const [updated] = await db
    .update(conversations)
    .set({ status, updatedAt: new Date(), lastActivityAt: new Date() })
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.accountId, accountId),
      ),
    )
    .returning();

  if (updated) {
    broadcastConversationStatusChanged(accountId, conversationId, status);

    // Trigger CSAT survey email when conversation is resolved (status = 1)
    if (status === 1 && updated.contactId) {
      const [contactRow] = await db
        .select({ id: contacts.id, email: contacts.email })
        .from(contacts)
        .where(eq(contacts.id, updated.contactId))
        .limit(1);

      if (contactRow?.email) {
        const survey = await createPendingSurvey({
          accountId,
          conversationId,
          contactId: contactRow.id,
          assignedAgentId: updated.assigneeId ?? undefined,
        });
        if (survey?.token) {
          await enqueueEmail({
            type: "send_csat_survey",
            to: contactRow.email,
            subject: "How was your support experience?",
            body: survey.token, // worker uses this as the token to build the URL
            accountId,
            conversationId,
          });
        }
      }
    }
  }

  return updated;
}

export async function assignConversation(
  accountId: number,
  conversationId: number,
  assigneeId: number | null,
) {
  const [updated] = await db
    .update(conversations)
    .set({
      assigneeId,
      updatedAt: new Date(),
      lastActivityAt: new Date(),
    })
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.accountId, accountId),
      ),
    )
    .returning();

  if (updated) {
    broadcastConversationAssigned(accountId, conversationId, assigneeId);
  }

  return updated;
}

export async function setConversationPriority(
  accountId: number,
  conversationId: number,
  priority: number | null,
) {
  const [updated] = await db
    .update(conversations)
    .set({ priority, updatedAt: new Date() })
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.accountId, accountId),
      ),
    )
    .returning();

  return updated;
}

export async function getContactConversations(accountId: number, contactId: number) {
  return db
    .select({
      id: conversations.id,
      displayId: conversations.displayId,
      status: conversations.status,
      lastActivityAt: conversations.lastActivityAt,
    })
    .from(conversations)
    .where(
      and(eq(conversations.accountId, accountId), eq(conversations.contactId, contactId)),
    )
    .orderBy(desc(conversations.lastActivityAt))
    .limit(10);
}

export async function getNextDisplayId(accountId: number): Promise<number> {
  const [result] = await db
    .select({ maxId: sql<number>`COALESCE(MAX(${conversations.displayId}), 0)` })
    .from(conversations)
    .where(eq(conversations.accountId, accountId));

  return (result?.maxId ?? 0) + 1;
}

export async function createConversation(params: {
  accountId: number;
  inboxId: number;
  contactId: number;
  assigneeId?: number;
  status?: number;
}) {
  const displayId = await getNextDisplayId(params.accountId);

  const [conversation] = await db
    .insert(conversations)
    .values({
      accountId: params.accountId,
      inboxId: params.inboxId,
      contactId: params.contactId,
      assigneeId: params.assigneeId ?? null,
      displayId,
      status: params.status ?? 0,
    })
    .returning();

  broadcastConversationCreated(params.accountId, conversation);

  return conversation;
}
