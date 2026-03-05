import type { PageServerLoad, Actions } from "./$types";
import { error, fail } from "@sveltejs/kit";
import {
  getArticle,
  updateArticle,
  listCategories,
} from "$lib/server/services/help-center.service";

export const load: PageServerLoad = async ({ locals, params }) => {
  const articleId = parseInt(params.articleId);
  const portalId = parseInt(params.portalId);
  const article = await getArticle(locals.account!.id, articleId);

  if (!article) error(404, "Article not found");

  const categories = await listCategories(portalId);

  return { article, categories, portalId };
};

export const actions: Actions = {
  save: async ({ request, locals, params }) => {
    const formData = await request.formData();
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const description = formData.get("description") as string;
    const categoryId = formData.get("categoryId") as string;
    const status = formData.get("status") as string;

    if (!title?.trim()) return fail(400, { error: "Title is required" });

    await updateArticle(locals.account!.id, parseInt(params.articleId), {
      title: title.trim(),
      content: content ?? undefined,
      description: description?.trim() || undefined,
      categoryId: categoryId ? parseInt(categoryId) : undefined,
      status: status || undefined,
    });

    return { success: true };
  },
};
