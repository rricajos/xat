import { json } from "@sveltejs/kit";
import { requireAuth, errorResponse } from "$lib/server/api-auth";
import { db } from "@xat/db";
import { conversations, messages, contactNotes, users, inboxes } from "@xat/db/schema";
import { eq, and, desc } from "drizzle-orm";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async (event) => {
  const { account } = requireAuth(event);
  const contactId = parseInt(event.params.id);
  if (isNaN(contactId)) return errorResponse("Invalid contact ID", 400);

  const accountId = account.id;

  // Load conversations for this contact
  const convs = await db
    .select({
      id: conversations.id,
      status: conversations.status,
      createdAt: conversations.createdAt,
      updatedAt: conversations.updatedAt,
      inboxName: inboxes.name,
    })
    .from(conversations)
    .leftJoin(inboxes, eq(conversations.inboxId, inboxes.id))
    .where(
      and(
        eq(conversations.accountId, accountId),
        eq(conversations.contactId, contactId),
      ),
    )
    .orderBy(desc(conversations.createdAt))
    .limit(50);

  // Load notes for this contact
  const notes = await db
    .select({
      id: contactNotes.id,
      content: contactNotes.content,
      createdAt: contactNotes.createdAt,
      userName: users.name,
    })
    .from(contactNotes)
    .leftJoin(users, eq(contactNotes.userId, users.id))
    .where(
      and(
        eq(contactNotes.accountId, accountId),
        eq(contactNotes.contactId, contactId),
      ),
    )
    .orderBy(desc(contactNotes.createdAt))
    .limit(50);

  // For each conversation, get last message preview
  const convIds = convs.map((c) => c.id);
  const lastMessages: Record<number, string> = {};
  for (const convId of convIds) {
    const [msg] = await db
      .select({ content: messages.content })
      .from(messages)
      .where(eq(messages.conversationId, convId))
      .orderBy(desc(messages.createdAt))
      .limit(1);
    if (msg?.content) lastMessages[convId] = msg.content;
  }

  // Build unified timeline
  const timeline: Array<{
    type: "conversation" | "note";
    id: number;
    createdAt: Date;
    data: Record<string, unknown>;
  }> = [];

  for (const conv of convs) {
    timeline.push({
      type: "conversation",
      id: conv.id,
      createdAt: conv.createdAt,
      data: {
        id: conv.id,
        status: conv.status,
        inboxName: conv.inboxName,
        lastMessage: lastMessages[conv.id] ?? null,
        updatedAt: conv.updatedAt,
      },
    });
  }

  for (const note of notes) {
    timeline.push({
      type: "note",
      id: note.id,
      createdAt: note.createdAt,
      data: {
        content: note.content,
        userName: note.userName,
      },
    });
  }

  // Sort by date descending
  timeline.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return json({ data: timeline });
};
