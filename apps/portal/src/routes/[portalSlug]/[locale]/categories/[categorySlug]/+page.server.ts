import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { db } from "@xat/db";
import { portals, categories, articles } from "@xat/db/schema";
import { eq, and, desc } from "drizzle-orm";

export const load: PageServerLoad = async ({ params, parent }) => {
  const { portal } = await parent();

  const [category] = await db
    .select()
    .from(categories)
    .where(
      and(
        eq(categories.portalId, portal.id),
        eq(categories.slug, params.categorySlug),
        eq(categories.locale, params.locale),
      ),
    )
    .limit(1);

  if (!category) {
    error(404, "Category not found");
  }

  const categoryArticles = await db
    .select()
    .from(articles)
    .where(
      and(
        eq(articles.portalId, portal.id),
        eq(articles.categoryId, category.id),
        eq(articles.status, "published"),
      ),
    )
    .orderBy(desc(articles.updatedAt));

  return { category, articles: categoryArticles };
};
