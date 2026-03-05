import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { requireAuth, errorResponse } from "$lib/server/api-auth";
import {
  updateConversationStatus,
  assignConversation,
} from "$lib/server/services/conversation.service";
import { addLabelToConversation } from "$lib/server/services/label.service";

export const POST: RequestHandler = async (event) => {
  const { account } = requireAuth(event);
  const body = await event.request.json();

  const { conversationIds, action, params } = body as {
    conversationIds: number[];
    action: string;
    params?: Record<string, unknown>;
  };

  if (!conversationIds?.length) {
    return errorResponse("No conversations selected", 400);
  }

  let processed = 0;

  for (const convId of conversationIds) {
    try {
      switch (action) {
        case "resolve":
          await updateConversationStatus(account.id, convId, 1);
          processed++;
          break;
        case "reopen":
          await updateConversationStatus(account.id, convId, 0);
          processed++;
          break;
        case "pending":
          await updateConversationStatus(account.id, convId, 2);
          processed++;
          break;
        case "snooze":
          await updateConversationStatus(account.id, convId, 3);
          processed++;
          break;
        case "assign":
          if (params?.agentId != null) {
            await assignConversation(
              account.id,
              convId,
              params.agentId as number,
            );
            processed++;
          }
          break;
        case "unassign":
          await assignConversation(account.id, convId, null);
          processed++;
          break;
        case "add_label":
          if (params?.labelId) {
            await addLabelToConversation(account.id, convId, params.labelId as number);
            processed++;
          }
          break;
      }
    } catch {
      // Skip individual failures in bulk operations
    }
  }

  return json({ data: { processed, total: conversationIds.length } });
};
