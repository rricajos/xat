import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { requireAuth, errorResponse } from "$lib/server/api-auth";
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "$lib/server/services/help-center.service";

export const GET: RequestHandler = async (event) => {
  const { account } = requireAuth(event);
  const portalId = parseInt(event.url.searchParams.get("portalId") ?? "0");

  if (!portalId) return errorResponse("portalId is required", 400);

  const cats = await listCategories(portalId);
  return json({ data: cats });
};

export const POST: RequestHandler = async (event) => {
  const { account } = requireAuth(event);
  const body = await event.request.json();

  if (!body.portalId || !body.name?.trim()) {
    return errorResponse("portalId and name are required", 400);
  }

  const slug = body.slug?.trim() || body.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");

  const category = await createCategory({
    accountId: account.id,
    portalId: body.portalId,
    name: body.name.trim(),
    slug,
    description: body.description,
    locale: body.locale,
  });

  return json({ data: category }, { status: 201 });
};

export const PUT: RequestHandler = async (event) => {
  const { account } = requireAuth(event);
  const body = await event.request.json();

  if (!body.id) return errorResponse("id is required", 400);

  const updated = await updateCategory(account.id, body.id, {
    name: body.name,
    slug: body.slug,
    description: body.description,
    position: body.position,
    locale: body.locale,
  });

  if (!updated) return errorResponse("Category not found", 404);
  return json({ data: updated });
};

export const DELETE: RequestHandler = async (event) => {
  const { account } = requireAuth(event);
  const categoryId = parseInt(event.url.searchParams.get("id") ?? "0");

  if (!categoryId) return errorResponse("id is required", 400);

  const deleted = await deleteCategory(account.id, categoryId);
  if (!deleted) return errorResponse("Category not found", 404);

  return json({ data: { success: true } });
};
