import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { requireAuth, errorResponse } from "$lib/server/api-auth";
import { listPortals, createPortal } from "$lib/server/services/help-center.service";

export const GET: RequestHandler = async (event) => {
  const { account } = requireAuth(event);
  const portals = await listPortals(account.id);
  return json({ data: portals });
};

export const POST: RequestHandler = async (event) => {
  const { account } = requireAuth(event);
  const body = await event.request.json();

  if (!body.name?.trim() || !body.slug?.trim()) {
    return errorResponse("Name and slug are required", 400);
  }

  const portal = await createPortal({
    accountId: account.id,
    name: body.name.trim(),
    slug: body.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"),
    headerText: body.headerText,
    pageTitle: body.pageTitle,
    color: body.color,
    customDomain: body.customDomain,
  });

  return json({ data: portal }, { status: 201 });
};
