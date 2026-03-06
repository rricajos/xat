import { json } from "@sveltejs/kit";
import { requireAuth, errorResponse } from "$lib/server/api-auth";
import { db } from "@xat/db";
import { conversations } from "@xat/db/schema";
import { eq, and } from "drizzle-orm";
import type { RequestHandler } from "./$types";

export const PATCH: RequestHandler = async (event) => {
  const { account } = requireAuth(event);
  const id = parseInt(event.params.id);
  const body = await event.request.json();

  const { customAttributes } = body;
  if (typeof customAttributes !== "object" || customAttributes === null) {
    return errorResponse("customAttributes must be an object", 400);
  }

  const [updated] = await db
    .update(conversations)
    .set({ customAttributes, updatedAt: new Date() })
    .where(and(eq(conversations.id, id), eq(conversations.accountId, account.id)))
    .returning({ id: conversations.id, customAttributes: conversations.customAttributes });

  if (!updated) return errorResponse("Conversation not found", 404);
  return json({ data: updated });
};
