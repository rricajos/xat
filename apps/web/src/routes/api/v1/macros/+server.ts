import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { requireAuth, errorResponse } from "$lib/server/api-auth";
import { listMacros, createMacro, executeMacro } from "$lib/server/services/macro.service";

export const GET: RequestHandler = async (event) => {
  const { user, account } = requireAuth(event);
  const macroList = await listMacros(account.id, user.id);
  return json({ data: macroList });
};

export const POST: RequestHandler = async (event) => {
  const { user, account } = requireAuth(event);
  const body = await event.request.json();

  if (body.action === "execute") {
    const result = await executeMacro(account.id, body.macroId, body.conversationId);
    return json({ data: result });
  }

  if (!body.name?.trim()) {
    return errorResponse("Name is required", 400);
  }

  const macro = await createMacro({
    accountId: account.id,
    name: body.name.trim(),
    visibility: body.visibility ?? "personal",
    createdById: user.id,
    actions: body.actions ?? [],
  });

  return json({ data: macro }, { status: 201 });
};
