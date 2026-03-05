import type { LayoutServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { db } from "@xat/db";
import { portals, categories } from "@xat/db/schema";
import { eq } from "drizzle-orm";

export const load: LayoutServerLoad = async ({ params }) => {
  const [portal] = await db
    .select()
    .from(portals)
    .where(eq(portals.slug, params.portalSlug))
    .limit(1);

  if (!portal || portal.archived) {
    error(404, "Portal not found");
  }

  const cats = await db
    .select()
    .from(categories)
    .where(eq(categories.portalId, portal.id))
    .orderBy(categories.position);

  return { portal, categories: cats };
};
