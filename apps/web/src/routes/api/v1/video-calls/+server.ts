import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { requireAuth } from "$lib/server/api-auth";
import {
  createVideoCall,
  listCallHistory,
  getActiveCall,
} from "$lib/server/services/video-call.service";

export const GET: RequestHandler = async (event) => {
  const { account } = requireAuth(event);

  const conversationId = parseInt(
    event.url.searchParams.get("conversationId") ?? "0",
  );
  if (!conversationId) {
    return json({ error: "conversationId is required" }, { status: 400 });
  }

  const active = await getActiveCall(account.id, conversationId);
  const history = await listCallHistory(account.id, conversationId);

  return json({ data: { active, history } });
};

export const POST: RequestHandler = async (event) => {
  const { user, account } = requireAuth(event);

  const body = await event.request.json();
  const { conversationId } = body;

  if (!conversationId) {
    return json({ error: "conversationId is required" }, { status: 400 });
  }

  const existing = await getActiveCall(account.id, conversationId);
  if (existing) {
    return json({ data: existing });
  }

  const call = await createVideoCall({
    accountId: account.id,
    conversationId,
    initiatedById: user.id,
  });

  return json({ data: call }, { status: 201 });
};
