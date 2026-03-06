import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { requireAuth } from "$lib/server/api-auth";
import {
  addParticipant,
  startVideoCall,
  endVideoCall,
} from "$lib/server/services/video-call.service";

export const PATCH: RequestHandler = async (event) => {
  const { user, account } = requireAuth(event);
  const callId = parseInt(event.params.id);
  const body = await event.request.json();

  if (body.action === "join") {
    const { token } = await addParticipant({
      accountId: account.id,
      callId,
      name: user.displayName ?? user.name,
      preset: "host",
    });

    await startVideoCall(account.id, callId);

    return json({ data: { token } });
  }

  if (body.action === "end") {
    await endVideoCall(account.id, callId);
    return json({ data: { success: true } });
  }

  return json({ error: "Invalid action" }, { status: 400 });
};
