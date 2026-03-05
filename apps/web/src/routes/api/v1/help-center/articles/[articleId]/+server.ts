import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { requireAuth, errorResponse } from "$lib/server/api-auth";
import {
  getArticle,
  updateArticle,
  deleteArticle,
} from "$lib/server/services/help-center.service";

export const GET: RequestHandler = async (event) => {
  const { account } = requireAuth(event);
  const articleId = parseInt(event.params.articleId);

  const article = await getArticle(account.id, articleId);
  if (!article) return errorResponse("Article not found", 404);

  return json({ data: article });
};

export const PUT: RequestHandler = async (event) => {
  const { account } = requireAuth(event);
  const articleId = parseInt(event.params.articleId);
  const body = await event.request.json();

  const updated = await updateArticle(account.id, articleId, {
    title: body.title,
    content: body.content,
    description: body.description,
    status: body.status,
    categoryId: body.categoryId,
  });

  if (!updated) return errorResponse("Article not found", 404);
  return json({ data: updated });
};

export const DELETE: RequestHandler = async (event) => {
  const { account } = requireAuth(event);
  const articleId = parseInt(event.params.articleId);

  const deleted = await deleteArticle(account.id, articleId);
  if (!deleted) return errorResponse("Article not found", 404);

  return json({ data: { success: true } });
};
