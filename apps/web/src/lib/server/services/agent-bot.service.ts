import { db } from "@xat/db";
import { agentBots, inboxes } from "@xat/db/schema";
import { eq, and } from "drizzle-orm";
import { createHmac } from "node:crypto";

export async function listAgentBots(accountId: number) {
  return db
    .select()
    .from(agentBots)
    .where(eq(agentBots.accountId, accountId));
}

export async function getAgentBot(accountId: number, botId: number) {
  const [bot] = await db
    .select()
    .from(agentBots)
    .where(and(eq(agentBots.id, botId), eq(agentBots.accountId, accountId)))
    .limit(1);

  return bot ?? null;
}

export async function createAgentBot(params: {
  accountId: number;
  name: string;
  description?: string;
  outgoingUrl?: string;
}) {
  const accessToken = Array.from(
    { length: 32 },
    () => Math.random().toString(36)[2],
  ).join("");

  const [bot] = await db
    .insert(agentBots)
    .values({
      accountId: params.accountId,
      name: params.name,
      description: params.description,
      outgoingUrl: params.outgoingUrl,
      accessToken,
    })
    .returning();

  return bot;
}

export async function updateAgentBot(
  accountId: number,
  botId: number,
  params: {
    name?: string;
    description?: string;
    outgoingUrl?: string;
  },
) {
  const [updated] = await db
    .update(agentBots)
    .set({ ...params, updatedAt: new Date() })
    .where(and(eq(agentBots.id, botId), eq(agentBots.accountId, accountId)))
    .returning();

  return updated;
}

export async function deleteAgentBot(accountId: number, botId: number) {
  await db
    .delete(agentBots)
    .where(and(eq(agentBots.id, botId), eq(agentBots.accountId, accountId)));
}

/**
 * Routes a message to the agent bot associated with an inbox.
 * The bot receives the message payload and can respond via API.
 */
export async function routeMessageToBot(params: {
  accountId: number;
  botId: number;
  event: string;
  conversationId: number;
  messageId?: number;
  content?: string;
  contactName?: string;
  contactEmail?: string;
}) {
  const bot = await getAgentBot(params.accountId, params.botId);
  if (!bot?.outgoingUrl) return null;

  const payload = JSON.stringify({
    event: params.event,
    conversationId: params.conversationId,
    messageId: params.messageId,
    content: params.content,
    contact: {
      name: params.contactName,
      email: params.contactEmail,
    },
    accountId: params.accountId,
  });

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Xat-Bot-Event": params.event,
  };

  if (bot.accessToken) {
    headers["X-Xat-Bot-Signature"] = createHmac(
      "sha256",
      bot.accessToken,
    )
      .update(payload)
      .digest("hex");
  }

  try {
    const response = await fetch(bot.outgoingUrl, {
      method: "POST",
      headers,
      body: payload,
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return null;

    const result = (await response.json()) as BotResponse;
    return result;
  } catch {
    return null;
  }
}

interface BotResponse {
  reply?: string;
  handoff?: boolean;
  assigneeId?: number;
  status?: "open" | "resolved" | "pending";
  labels?: string[];
}

/**
 * Processes a bot response and applies the actions to the conversation.
 */
export async function processBotResponse(params: {
  accountId: number;
  conversationId: number;
  response: BotResponse;
}) {
  const actions: Array<{ action: string; value: unknown }> = [];

  if (params.response.reply) {
    actions.push({ action: "send_reply", value: params.response.reply });
  }

  if (params.response.handoff) {
    actions.push({ action: "handoff_to_agent", value: params.response.assigneeId });
  }

  if (params.response.status) {
    const statusMap: Record<string, number> = {
      open: 0,
      resolved: 1,
      pending: 2,
    };
    actions.push({
      action: "change_status",
      value: statusMap[params.response.status] ?? 0,
    });
  }

  return actions;
}
