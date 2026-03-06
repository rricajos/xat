import { json } from "@sveltejs/kit";
import { requireAuth, errorResponse } from "$lib/server/api-auth";
import { db } from "@xat/db";
import { conversationParticipants, users } from "@xat/db/schema";
import { eq, and } from "drizzle-orm";
import type { RequestHandler } from "./$types";

// GET — list participants of a conversation
export const GET: RequestHandler = async (event) => {
  requireAuth(event);
  const conversationId = parseInt(event.params.id);
  if (isNaN(conversationId)) return errorResponse("Invalid conversation ID", 400);

  const participants = await db
    .select({
      id: conversationParticipants.id,
      userId: conversationParticipants.userId,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
      createdAt: conversationParticipants.createdAt,
    })
    .from(conversationParticipants)
    .innerJoin(users, eq(conversationParticipants.userId, users.id))
    .where(eq(conversationParticipants.conversationId, conversationId));

  return json({ data: participants });
};

// POST — add participant
export const POST: RequestHandler = async (event) => {
  const { account } = requireAuth(event);
  const conversationId = parseInt(event.params.id);
  if (isNaN(conversationId)) return errorResponse("Invalid conversation ID", 400);

  const body = await event.request.json().catch(() => ({}));
  const userIds: number[] = Array.isArray(body.userIds) ? body.userIds : [body.userId].filter(Boolean);

  if (userIds.length === 0) return errorResponse("userIds is required", 400);

  for (const uid of userIds) {
    await db
      .insert(conversationParticipants)
      .values({
        accountId: account.id,
        conversationId,
        userId: uid,
      })
      .onConflictDoNothing();
  }

  return json({ data: { added: userIds } });
};

// DELETE — remove participant
export const DELETE: RequestHandler = async (event) => {
  requireAuth(event);
  const conversationId = parseInt(event.params.id);
  if (isNaN(conversationId)) return errorResponse("Invalid conversation ID", 400);

  const body = await event.request.json().catch(() => ({}));
  const userId = parseInt(body.userId);
  if (isNaN(userId)) return errorResponse("userId is required", 400);

  await db
    .delete(conversationParticipants)
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, userId),
      ),
    );

  return json({ data: { removed: userId } });
};
