import type { RequestHandler } from "./$types";
import { requireAuth, jsonResponse, errorResponse } from "$lib/server/api-auth";
import {
  getConversation,
  getConversationMessages,
  createMessage,
} from "$lib/server/services/conversation.service";
import { MESSAGE_TYPE } from "@xat/shared";

export const GET: RequestHandler = async (event) => {
  const { account } = requireAuth(event);
  const displayId = parseInt(event.params.id);

  const conversation = await getConversation(account.id, displayId);
  if (!conversation) return errorResponse("Conversation not found", 404);

  const before = event.url.searchParams.get("before")
    ? parseInt(event.url.searchParams.get("before")!)
    : undefined;

  const msgs = await getConversationMessages(account.id, conversation.id, {
    before,
  });

  return jsonResponse(msgs);
};

export const POST: RequestHandler = async (event) => {
  const { account, user } = requireAuth(event);
  const displayId = parseInt(event.params.id);

  const conversation = await getConversation(account.id, displayId);
  if (!conversation) return errorResponse("Conversation not found", 404);

  const body = await event.request.json();

  if (!body.content?.trim()) {
    return errorResponse("Content is required");
  }

  const message = await createMessage({
    accountId: account.id,
    conversationId: conversation.id,
    content: body.content.trim(),
    messageType: body.message_type ?? MESSAGE_TYPE.OUTGOING,
    senderType: "User",
    senderId: user.id,
    private: body.private ?? false,
  });

  return jsonResponse(message, 201);
};
