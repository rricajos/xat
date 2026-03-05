import type { PageServerLoad, Actions } from "./$types";
import { fail, error, redirect } from "@sveltejs/kit";
import {
  getPortal,
  listCategories,
  createCategory,
  listArticles,
  createArticle,
  updateArticle,
  updatePortal,
  deletePortal,
  deleteArticle,
  deleteCategory,
} from "$lib/server/services/help-center.service";

export const load: PageServerLoad = async ({ locals, params }) => {
  const portalId = parseInt(params.portalId);
  const portal = await getPortal(locals.account!.id, portalId);

  if (!portal) error(404, "Portal not found");

  const [categories, articles] = await Promise.all([
    listCategories(portalId),
    listArticles(portalId),
  ]);

  return { portal, categories, articles };
};

export const actions: Actions = {
  createCategory: async ({ request, locals, params }) => {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    if (!name?.trim()) return fail(400, { error: "Name is required" });

    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    await createCategory({
      accountId: locals.account!.id,
      portalId: parseInt(params.portalId),
      name: name.trim(),
      slug,
      description: description?.trim() || undefined,
    });

    return { success: true };
  },

  createArticle: async ({ request, locals, params }) => {
    const formData = await request.formData();
    const title = formData.get("title") as string;
    const categoryId = formData.get("categoryId") as string;
    const content = formData.get("content") as string;

    if (!title?.trim()) return fail(400, { error: "Title is required" });

    const slug = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    await createArticle({
      accountId: locals.account!.id,
      portalId: parseInt(params.portalId),
      authorId: locals.user!.id,
      title: title.trim(),
      slug,
      content: content?.trim() || undefined,
      categoryId: categoryId ? parseInt(categoryId) : undefined,
      status: "draft",
    });

    return { success: true };
  },

  publishArticle: async ({ request, locals }) => {
    const formData = await request.formData();
    const articleId = parseInt(formData.get("articleId") as string);

    await updateArticle(locals.account!.id, articleId, { status: "published" });
    return { success: true };
  },

  unpublishArticle: async ({ request, locals }) => {
    const formData = await request.formData();
    const articleId = parseInt(formData.get("articleId") as string);

    await updateArticle(locals.account!.id, articleId, { status: "draft" });
    return { success: true };
  },

  updatePortal: async ({ request, locals, params }) => {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const headerText = formData.get("headerText") as string;
    const pageTitle = formData.get("pageTitle") as string;
    const color = formData.get("color") as string;
    const customDomain = formData.get("customDomain") as string;

    if (!name?.trim()) return fail(400, { error: "Name is required" });

    await updatePortal(locals.account!.id, parseInt(params.portalId), {
      name: name.trim(),
      headerText: headerText?.trim() || undefined,
      pageTitle: pageTitle?.trim() || undefined,
      color: color?.trim() || undefined,
      customDomain: customDomain?.trim() || undefined,
    });

    return { success: true };
  },

  deletePortal: async ({ locals, params }) => {
    await deletePortal(locals.account!.id, parseInt(params.portalId));
    redirect(303, "/app/help-center");
  },

  deleteArticle: async ({ request, locals }) => {
    const formData = await request.formData();
    const articleId = parseInt(formData.get("articleId") as string);

    await deleteArticle(locals.account!.id, articleId);
    return { success: true };
  },

  deleteCategory: async ({ request, locals }) => {
    const formData = await request.formData();
    const categoryId = parseInt(formData.get("categoryId") as string);

    await deleteCategory(locals.account!.id, categoryId);
    return { success: true };
  },
};
