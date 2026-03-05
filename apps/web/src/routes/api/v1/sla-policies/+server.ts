import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { requireAuth, errorResponse } from "$lib/server/api-auth";
import { listSlaPolicies, createSlaPolicy } from "$lib/server/services/sla.service";

export const GET: RequestHandler = async (event) => {
  const { account } = requireAuth(event);
  const policies = await listSlaPolicies(account.id);
  return json({ data: policies });
};

export const POST: RequestHandler = async (event) => {
  const { account } = requireAuth(event);
  const body = await event.request.json();

  if (!body.name?.trim()) {
    return errorResponse("Name is required", 400);
  }

  const policy = await createSlaPolicy({
    accountId: account.id,
    name: body.name.trim(),
    description: body.description,
    firstResponseTimeThreshold: body.firstResponseTimeThreshold,
    nextResponseTimeThreshold: body.nextResponseTimeThreshold,
    resolutionTimeThreshold: body.resolutionTimeThreshold,
    onlyDuringBusinessHours: body.onlyDuringBusinessHours,
  });

  return json({ data: policy }, { status: 201 });
};
