import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { requireAdmin } from "$lib/server/api-auth";
import {
  getAgentBot,
  updateAgentBot,
  deleteAgentBot,
} from "$lib/server/services/agent-bot.service";

export const GET: RequestHandler = async (event) => {
  const { account } = requireAdmin(event);
  const botId = parseInt(event.params.id);

  const bot = await getAgentBot(account.id, botId);
  if (!bot) {
    return json({ error: "Agent bot not found" }, { status: 404 });
  }

  return json({ data: bot });
};

export const PATCH: RequestHandler = async (event) => {
  const { account } = requireAdmin(event);
  const botId = parseInt(event.params.id);
  const body = await event.request.json();

  const { name, description, outgoingUrl } = body as {
    name?: string;
    description?: string;
    outgoingUrl?: string;
  };

  const updated = await updateAgentBot(account.id, botId, {
    name,
    description,
    outgoingUrl,
  });

  if (!updated) {
    return json({ error: "Agent bot not found" }, { status: 404 });
  }

  return json({ data: updated });
};

export const DELETE: RequestHandler = async (event) => {
  const { account } = requireAdmin(event);
  const botId = parseInt(event.params.id);

  await deleteAgentBot(account.id, botId);
  return new Response(null, { status: 204 });
};
