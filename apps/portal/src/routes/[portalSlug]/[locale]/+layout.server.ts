import type { LayoutServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { db } from "@xat/db";
import { portals, categories } from "@xat/db/schema";
import { eq, and } from "drizzle-orm";

export const load: LayoutServerLoad = async ({ params }) => {
  const [portal] = await db
    .select()
    .from(portals)
    .where(eq(portals.slug, params.portalSlug))
    .limit(1);

  if (!portal || portal.archived) {
    error(404, "Portal not found");
  }

  const locale = params.locale;

  // Get categories for this locale
  const localeCats = await db
    .select()
    .from(categories)
    .where(
      and(eq(categories.portalId, portal.id), eq(categories.locale, locale)),
    )
    .orderBy(categories.position);

  // Get all available locales for this portal
  const allCats = await db
    .select({ locale: categories.locale })
    .from(categories)
    .where(eq(categories.portalId, portal.id));

  const availableLocales = [
    ...new Set(allCats.map((c) => c.locale).filter((l): l is string => !!l)),
  ].sort();

  return {
    portal,
    categories: localeCats,
    locale,
    availableLocales,
  };
};
