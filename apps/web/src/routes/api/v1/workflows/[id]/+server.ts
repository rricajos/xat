import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { requireAdmin } from "$lib/server/api-auth";
import {
  getWorkflow,
  updateWorkflow,
  deleteWorkflow,
} from "$lib/server/services/workflow.service";

export const GET: RequestHandler = async (event) => {
  const { account } = requireAdmin(event);
  const workflowId = parseInt(event.params.id);

  const workflow = await getWorkflow(account.id, workflowId);
  if (!workflow) {
    return json({ error: "Workflow not found" }, { status: 404 });
  }

  return json({ data: workflow });
};

export const PATCH: RequestHandler = async (event) => {
  const { account } = requireAdmin(event);
  const workflowId = parseInt(event.params.id);
  const body = await event.request.json();

  const updated = await updateWorkflow(account.id, workflowId, body as Parameters<typeof updateWorkflow>[2]);
  if (!updated) {
    return json({ error: "Workflow not found" }, { status: 404 });
  }

  return json({ data: updated });
};

export const DELETE: RequestHandler = async (event) => {
  const { account } = requireAdmin(event);
  const workflowId = parseInt(event.params.id);

  await deleteWorkflow(account.id, workflowId);
  return new Response(null, { status: 204 });
};
