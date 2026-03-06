import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { requireAdmin } from "$lib/server/api-auth";
import {
  listAgentBots,
  createAgentBot,
} from "$lib/server/services/agent-bot.service";

export const GET: RequestHandler = async (event) => {
  const { account } = requireAdmin(event);
  const data = await listAgentBots(account.id);
  return json({ data });
};

export const POST: RequestHandler = async (event) => {
  const { account } = requireAdmin(event);
  const body = await event.request.json();

  const { name, description, outgoingUrl } = body as {
    name?: string;
    description?: string;
    outgoingUrl?: string;
  };

  if (!name) {
    return json({ error: "name is required" }, { status: 400 });
  }

  const bot = await createAgentBot({
    accountId: account.id,
    name,
    description,
    outgoingUrl,
  });

  return json({ data: bot }, { status: 201 });
};
