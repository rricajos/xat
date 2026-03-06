import { db } from "@xat/db";
import { portals, categories, articles } from "@xat/db/schema";
import { eq, and, desc } from "drizzle-orm";

// Portals
export async function listPortals(accountId: number) {
  return db
    .select()
    .from(portals)
    .where(eq(portals.accountId, accountId))
    .orderBy(portals.name);
}

export async function createPortal(params: {
  accountId: number;
  name: string;
  slug: string;
  headerText?: string;
  pageTitle?: string;
  color?: string;
  customDomain?: string;
}) {
  const [portal] = await db.insert(portals).values(params).returning();
  return portal;
}

export async function getPortal(accountId: number, portalId: number) {
  const [portal] = await db
    .select()
    .from(portals)
    .where(and(eq(portals.id, portalId), eq(portals.accountId, accountId)))
    .limit(1);
  return portal ?? null;
}

export async function getPortalBySlug(slug: string) {
  const [portal] = await db
    .select()
    .from(portals)
    .where(eq(portals.slug, slug))
    .limit(1);
  return portal ?? null;
}

// Categories
export async function listCategories(portalId: number) {
  return db
    .select()
    .from(categories)
    .where(eq(categories.portalId, portalId))
    .orderBy(categories.position);
}

export async function createCategory(params: {
  accountId: number;
  portalId: number;
  name: string;
  slug: string;
  description?: string;
  locale?: string;
}) {
  const [category] = await db.insert(categories).values(params).returning();
  return category;
}

// Articles
export async function listArticles(
  portalId: number,
  options: { categoryId?: number; status?: string } = {},
) {
  const conditions = [eq(articles.portalId, portalId)];

  if (options.categoryId) {
    conditions.push(eq(articles.categoryId, options.categoryId));
  }
  if (options.status) {
    conditions.push(eq(articles.status, options.status));
  }

  return db
    .select()
    .from(articles)
    .where(and(...conditions))
    .orderBy(desc(articles.updatedAt));
}

export async function createArticle(params: {
  accountId: number;
  portalId: number;
  categoryId?: number;
  authorId: number;
  title: string;
  slug: string;
  content?: string;
  description?: string;
  status?: string;
}) {
  const [article] = await db.insert(articles).values(params).returning();
  return article;
}

export async function updateArticle(
  accountId: number,
  articleId: number,
  data: {
    title?: string;
    content?: string;
    description?: string;
    status?: string;
    categoryId?: number;
  },
) {
  const [updated] = await db
    .update(articles)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(eq(articles.id, articleId), eq(articles.accountId, accountId)),
    )
    .returning();

  return updated;
}

export async function getArticle(accountId: number, articleId: number) {
  const [article] = await db
    .select()
    .from(articles)
    .where(
      and(eq(articles.id, articleId), eq(articles.accountId, accountId)),
    )
    .limit(1);
  return article ?? null;
}

// Portal CRUD
export async function updatePortal(
  accountId: number,
  portalId: number,
  data: {
    name?: string;
    slug?: string;
    headerText?: string;
    pageTitle?: string;
    color?: string;
    customDomain?: string;
    archived?: boolean;
  },
) {
  const [updated] = await db
    .update(portals)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(eq(portals.id, portalId), eq(portals.accountId, accountId)),
    )
    .returning();
  return updated;
}

export async function deletePortal(accountId: number, portalId: number) {
  const [deleted] = await db
    .delete(portals)
    .where(
      and(eq(portals.id, portalId), eq(portals.accountId, accountId)),
    )
    .returning();
  return deleted;
}

// Category CRUD
export async function getCategory(portalId: number, categoryId: number) {
  const [category] = await db
    .select()
    .from(categories)
    .where(
      and(eq(categories.id, categoryId), eq(categories.portalId, portalId)),
    )
    .limit(1);
  return category ?? null;
}

export async function updateCategory(
  accountId: number,
  categoryId: number,
  data: {
    name?: string;
    slug?: string;
    description?: string;
    position?: number;
    locale?: string;
  },
) {
  const [updated] = await db
    .update(categories)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(eq(categories.id, categoryId), eq(categories.accountId, accountId)),
    )
    .returning();
  return updated;
}

export async function deleteCategory(accountId: number, categoryId: number) {
  const [deleted] = await db
    .delete(categories)
    .where(
      and(eq(categories.id, categoryId), eq(categories.accountId, accountId)),
    )
    .returning();
  return deleted;
}

// Article deletion
export async function deleteArticle(accountId: number, articleId: number) {
  const [deleted] = await db
    .delete(articles)
    .where(
      and(eq(articles.id, articleId), eq(articles.accountId, accountId)),
    )
    .returning();
  return deleted;
}

export async function getPortalByCustomDomain(domain: string) {
  const [portal] = await db
    .select()
    .from(portals)
    .where(eq(portals.customDomain, domain))
    .limit(1);
  return portal ?? null;
}

export async function listArticlesByLocale(
  portalId: number,
  locale: string,
  options: { categoryId?: number } = {},
) {
  const conditions = [
    eq(articles.portalId, portalId),
    eq(articles.status, "published"),
  ];

  if (options.categoryId) {
    conditions.push(eq(articles.categoryId, options.categoryId));
  }

  // Filter categories by locale, then get articles in those categories
  const localeCategories = await db
    .select()
    .from(categories)
    .where(
      and(eq(categories.portalId, portalId), eq(categories.locale, locale)),
    );

  if (localeCategories.length === 0) {
    return [];
  }

  const categoryIds = localeCategories.map((c) => c.id);

  const allArticles = await db
    .select()
    .from(articles)
    .where(and(...conditions))
    .orderBy(desc(articles.updatedAt));

  // Filter by locale categories
  return allArticles.filter(
    (a) => a.categoryId && categoryIds.includes(a.categoryId),
  );
}

export async function listCategoriesByLocale(
  portalId: number,
  locale: string,
) {
  return db
    .select()
    .from(categories)
    .where(
      and(eq(categories.portalId, portalId), eq(categories.locale, locale)),
    )
    .orderBy(categories.position);
}

export async function getAvailableLocales(portalId: number): Promise<string[]> {
  const cats = await db
    .select({ locale: categories.locale })
    .from(categories)
    .where(eq(categories.portalId, portalId));

  const locales = new Set(
    cats.map((c) => c.locale).filter((l): l is string => !!l),
  );

  return Array.from(locales).sort();
}

export async function getPublishedArticle(portalId: number, slug: string) {
  const [article] = await db
    .select()
    .from(articles)
    .where(
      and(
        eq(articles.portalId, portalId),
        eq(articles.slug, slug),
        eq(articles.status, "published"),
      ),
    )
    .limit(1);

  if (article) {
    // Increment views
    await db
      .update(articles)
      .set({ views: (article.views ?? 0) + 1 })
      .where(eq(articles.id, article.id));
  }

  return article ?? null;
}
