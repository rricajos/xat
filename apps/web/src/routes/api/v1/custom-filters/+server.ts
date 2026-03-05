import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { requireAuth, errorResponse } from "$lib/server/api-auth";
import {
  listCustomFilters,
  createCustomFilter,
} from "$lib/server/services/custom-filter.service";

export const GET: RequestHandler = async (event) => {
  const { user, account } = requireAuth(event);

  const filterType = event.url.searchParams.get("filterType") ?? "conversation";
  const filters = await listCustomFilters(account.id, user.id, filterType);

  return json({ data: filters });
};

export const POST: RequestHandler = async (event) => {
  const { user, account } = requireAuth(event);

  const body = await event.request.json();
  const { name, filterType, query } = body;

  if (!name?.trim()) {
    return errorResponse("Name is required", 400);
  }

  const filter = await createCustomFilter({
    accountId: account.id,
    userId: user.id,
    name: name.trim(),
    filterType: filterType ?? "conversation",
    query: query ?? {},
  });

  return json({ data: filter }, { status: 201 });
};
