import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { requireAuth } from "$lib/server/api-auth";
import {
  updateCustomFilter,
  deleteCustomFilter,
} from "$lib/server/services/custom-filter.service";

export const PATCH: RequestHandler = async (event) => {
  const { user, account } = requireAuth(event);
  const filterId = parseInt(event.params.id);

  const body = await event.request.json();
  const updated = await updateCustomFilter(account.id, user.id, filterId, {
    name: body.name,
    query: body.query,
  });

  if (!updated) return json({ error: "Not found" }, { status: 404 });
  return json({ data: updated });
};

export const DELETE: RequestHandler = async (event) => {
  const { user, account } = requireAuth(event);
  const filterId = parseInt(event.params.id);

  await deleteCustomFilter(account.id, user.id, filterId);
  return json({ success: true });
};
