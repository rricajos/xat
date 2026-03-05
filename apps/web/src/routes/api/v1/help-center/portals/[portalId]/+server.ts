import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { requireAuth, errorResponse } from "$lib/server/api-auth";
import {
  getPortal,
  updatePortal,
  deletePortal,
} from "$lib/server/services/help-center.service";

export const GET: RequestHandler = async (event) => {
  const { account } = requireAuth(event);
  const portalId = parseInt(event.params.portalId);

  const portal = await getPortal(account.id, portalId);
  if (!portal) return errorResponse("Portal not found", 404);

  return json({ data: portal });
};

export const PUT: RequestHandler = async (event) => {
  const { account } = requireAuth(event);
  const portalId = parseInt(event.params.portalId);
  const body = await event.request.json();

  const updated = await updatePortal(account.id, portalId, {
    name: body.name,
    slug: body.slug,
    headerText: body.headerText,
    pageTitle: body.pageTitle,
    color: body.color,
    customDomain: body.customDomain,
    archived: body.archived,
  });

  if (!updated) return errorResponse("Portal not found", 404);
  return json({ data: updated });
};

export const DELETE: RequestHandler = async (event) => {
  const { account } = requireAuth(event);
  const portalId = parseInt(event.params.portalId);

  const deleted = await deletePortal(account.id, portalId);
  if (!deleted) return errorResponse("Portal not found", 404);

  return json({ data: { success: true } });
};
