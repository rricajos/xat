import type { PageServerLoad } from "./$types";
import { db } from "@xat/db";
import { articles } from "@xat/db/schema";
import { eq, and, ilike, or } from "drizzle-orm";

export const load: PageServerLoad = async ({ url, parent }) => {
  const { portal } = await parent();
  const query = url.searchParams.get("q")?.trim() ?? "";

  if (!query) {
    return { query, results: [] };
  }

  const searchPattern = `%${query}%`;

  const results = await db
    .select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      description: articles.description,
      updatedAt: articles.updatedAt,
    })
    .from(articles)
    .where(
      and(
        eq(articles.portalId, portal.id),
        eq(articles.status, "published"),
        or(
          ilike(articles.title, searchPattern),
          ilike(articles.content, searchPattern),
          ilike(articles.description, searchPattern),
        ),
      ),
    )
    .limit(20);

  return { query, results };
};
