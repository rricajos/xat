import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { requireAdmin } from "$lib/server/api-auth";
import {
  listWorkflows,
  createWorkflow,
} from "$lib/server/services/workflow.service";

export const GET: RequestHandler = async (event) => {
  const { account } = requireAdmin(event);
  const data = await listWorkflows(account.id);
  return json({ data });
};

export const POST: RequestHandler = async (event) => {
  const { account } = requireAdmin(event);
  const body = await event.request.json();

  const { name, description, triggerAction, requiredAttributes, validationMessage, inboxIds } =
    body as {
      name?: string;
      description?: string;
      triggerAction?: string;
      requiredAttributes?: Array<{ attributeKey: string; attributeType: string; required: boolean }>;
      validationMessage?: string;
      inboxIds?: number[];
    };

  if (!name || !triggerAction) {
    return json(
      { error: "name and triggerAction are required" },
      { status: 400 },
    );
  }

  const validTriggers = ["resolve", "pending", "handoff"];
  if (!validTriggers.includes(triggerAction)) {
    return json(
      { error: `Invalid triggerAction. Must be one of: ${validTriggers.join(", ")}` },
      { status: 400 },
    );
  }

  const workflow = await createWorkflow({
    accountId: account.id,
    name,
    description,
    triggerAction,
    requiredAttributes: requiredAttributes as Parameters<typeof createWorkflow>[0]["requiredAttributes"],
    validationMessage,
    inboxIds,
  });

  return json({ data: workflow }, { status: 201 });
};
