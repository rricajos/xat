import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { requireAuth, errorResponse } from "$lib/server/api-auth";
import { listArticles, createArticle } from "$lib/server/services/help-center.service";

export const GET: RequestHandler = async (event) => {
  const { account } = requireAuth(event);
  const portalId = event.url.searchParams.get("portalId");
  const status = event.url.searchParams.get("status") ?? undefined;
  const categoryId = event.url.searchParams.get("categoryId")
    ? parseInt(event.url.searchParams.get("categoryId")!)
    : undefined;

  if (!portalId) {
    return errorResponse("portalId is required", 400);
  }

  const articles = await listArticles(parseInt(portalId), { status, categoryId });
  return json({ data: articles });
};

export const POST: RequestHandler = async (event) => {
  const { user, account } = requireAuth(event);
  const body = await event.request.json();

  if (!body.portalId || !body.title?.trim()) {
    return errorResponse("portalId and title are required", 400);
  }

  const slug = body.slug?.trim() ||
    body.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const article = await createArticle({
    accountId: account.id,
    portalId: body.portalId,
    authorId: user.id,
    title: body.title.trim(),
    slug,
    content: body.content,
    description: body.description,
    categoryId: body.categoryId,
    status: body.status ?? "draft",
  });

  return json({ data: article }, { status: 201 });
};
