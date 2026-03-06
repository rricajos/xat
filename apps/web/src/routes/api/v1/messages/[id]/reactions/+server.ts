import { json } from "@sveltejs/kit";
import { requireAuth, errorResponse } from "$lib/server/api-auth";
import { db } from "@xat/db";
import { messageReactions, messages } from "@xat/db/schema";
import { eq, and } from "drizzle-orm";
import type { RequestHandler } from "./$types";

// GET — list reactions for a message
export const GET: RequestHandler = async (event) => {
  requireAuth(event);
  const messageId = parseInt(event.params.id);
  if (isNaN(messageId)) return errorResponse("Invalid message ID", 400);

  const reactions = await db
    .select()
    .from(messageReactions)
    .where(eq(messageReactions.messageId, messageId));

  // Group by emoji
  const grouped: Record<string, { emoji: string; count: number; userIds: number[] }> = {};
  for (const r of reactions) {
    if (!grouped[r.emoji]) {
      grouped[r.emoji] = { emoji: r.emoji, count: 0, userIds: [] };
    }
    grouped[r.emoji].count++;
    grouped[r.emoji].userIds.push(r.userId);
  }

  return json({ data: Object.values(grouped) });
};

// POST — toggle reaction (add if absent, remove if present)
export const POST: RequestHandler = async (event) => {
  const { user } = requireAuth(event);
  const messageId = parseInt(event.params.id);
  if (isNaN(messageId)) return errorResponse("Invalid message ID", 400);

  const body = await event.request.json().catch(() => ({}));
  const emoji = String(body.emoji ?? "").trim();
  if (!emoji) return errorResponse("emoji is required", 400);

  // Verify message exists
  const [msg] = await db.select({ id: messages.id, accountId: messages.accountId })
    .from(messages).where(eq(messages.id, messageId)).limit(1);
  if (!msg) return errorResponse("Message not found", 404);

  // Check if reaction already exists
  const [existing] = await db
    .select()
    .from(messageReactions)
    .where(
      and(
        eq(messageReactions.messageId, messageId),
        eq(messageReactions.userId, user.id),
        eq(messageReactions.emoji, emoji),
      ),
    )
    .limit(1);

  if (existing) {
    // Remove reaction
    await db.delete(messageReactions).where(eq(messageReactions.id, existing.id));
    return json({ data: { action: "removed", emoji } });
  } else {
    // Add reaction
    await db.insert(messageReactions).values({
      accountId: msg.accountId,
      messageId,
      userId: user.id,
      emoji,
    });
    return json({ data: { action: "added", emoji } });
  }
};
