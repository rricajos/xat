import type { RequestHandler } from "./$types";
import { requireAuth, jsonResponse } from "$lib/server/api-auth";
import {
  listConversations,
  createConversation,
} from "$lib/server/services/conversation.service";

export const GET: RequestHandler = async (event) => {
  const { account } = requireAuth(event);
  const url = event.url;

  const status = parseInt(url.searchParams.get("status") ?? "0");
  const page = parseInt(url.searchParams.get("page") ?? "1");
  const inboxId = url.searchParams.get("inbox_id")
    ? parseInt(url.searchParams.get("inbox_id")!)
    : undefined;
  const assigneeId = url.searchParams.get("assignee_id")
    ? parseInt(url.searchParams.get("assignee_id")!)
    : undefined;

  const result = await listConversations(account.id, {
    status,
    page,
    inboxId,
    assigneeId,
  });

  return jsonResponse({
    conversations: result.data,
    meta: { total: result.total, page },
  });
};

export const POST: RequestHandler = async (event) => {
  const { account } = requireAuth(event);
  const body = await event.request.json();

  const conversation = await createConversation({
    accountId: account.id,
    inboxId: body.inbox_id,
    contactId: body.contact_id,
    assigneeId: body.assignee_id,
    status: body.status,
  });

  return jsonResponse(conversation, 201);
};
