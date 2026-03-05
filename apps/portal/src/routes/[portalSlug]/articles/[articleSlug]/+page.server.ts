import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { db } from "@xat/db";
import { articles, categories } from "@xat/db/schema";
import { eq, and, sql } from "drizzle-orm";

export const load: PageServerLoad = async ({ params, parent }) => {
  const { portal } = await parent();

  const [article] = await db
    .select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      content: articles.content,
      description: articles.description,
      views: articles.views,
      categoryId: articles.categoryId,
      createdAt: articles.createdAt,
      updatedAt: articles.updatedAt,
      meta: articles.meta,
    })
    .from(articles)
    .where(
      and(
        eq(articles.portalId, portal.id),
        eq(articles.slug, params.articleSlug),
        eq(articles.status, "published"),
      ),
    )
    .limit(1);

  if (!article) {
    error(404, "Article not found");
  }

  // Increment views
  await db
    .update(articles)
    .set({ views: sql`${articles.views} + 1` })
    .where(eq(articles.id, article.id));

  // Get category
  let category = null;
  if (article.categoryId) {
    const [cat] = await db
      .select({ id: categories.id, name: categories.name, slug: categories.slug })
      .from(categories)
      .where(eq(categories.id, article.categoryId))
      .limit(1);
    category = cat ?? null;
  }

  return { article, category };
};
