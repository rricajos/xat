import type { Handle } from "@sveltejs/kit";
import { db } from "@xat/db";
import { portals } from "@xat/db/schema";
import { eq } from "drizzle-orm";

export const handle: Handle = async ({ event, resolve }) => {
  // Resolve portal from the first path segment: /portal-slug/...
  const slug = event.params.portalSlug;

  if (slug) {
    const [portal] = await db
      .select({
        id: portals.id,
        accountId: portals.accountId,
        name: portals.name,
        slug: portals.slug,
        color: portals.color,
        headerText: portals.headerText,
        pageTitle: portals.pageTitle,
      })
      .from(portals)
      .where(eq(portals.slug, slug))
      .limit(1);

    event.locals.portal = portal ?? null;
  } else {
    event.locals.portal = null;
  }

  return resolve(event);
};
