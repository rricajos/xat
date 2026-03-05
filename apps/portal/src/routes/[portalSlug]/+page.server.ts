import type { PageServerLoad } from "./$types";
import { db } from "@xat/db";
import { categories, articles } from "@xat/db/schema";
import { eq, and, count, sql } from "drizzle-orm";

export const load: PageServerLoad = async ({ parent }) => {
  const { portal, categories: cats } = await parent();

  // Get article counts per category
  const articleCounts = await db
    .select({
      categoryId: articles.categoryId,
      count: count(),
    })
    .from(articles)
    .where(
      and(
        eq(articles.portalId, portal.id),
        eq(articles.status, "published"),
      ),
    )
    .groupBy(articles.categoryId);

  const countMap = new Map(articleCounts.map((r) => [r.categoryId, r.count]));

  const categoriesWithCount = cats.map((cat) => ({
    ...cat,
    articleCount: countMap.get(cat.id) ?? 0,
  }));

  return { categories: categoriesWithCount };
};
