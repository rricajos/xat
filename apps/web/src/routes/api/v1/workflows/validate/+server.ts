import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { requireAuth } from "$lib/server/api-auth";
import { validateWorkflow } from "$lib/server/services/workflow.service";

export const POST: RequestHandler = async (event) => {
  const { account } = requireAuth(event);
  const body = await event.request.json();

  const { inboxId, triggerAction, conversationAttributes, contactAttributes } =
    body as {
      inboxId: number;
      triggerAction: string;
      conversationAttributes?: Record<string, unknown>;
      contactAttributes?: Record<string, unknown>;
    };

  if (!inboxId || !triggerAction) {
    return json(
      { error: "inboxId and triggerAction are required" },
      { status: 400 },
    );
  }

  const result = await validateWorkflow({
    accountId: account.id,
    inboxId,
    triggerAction,
    conversationAttributes: conversationAttributes ?? {},
    contactAttributes: contactAttributes ?? {},
  });

  return json({ data: result });
};
