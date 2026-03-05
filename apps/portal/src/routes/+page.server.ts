import type { PageServerLoad } from "./$types";
import { db } from "@xat/db";
import { portals } from "@xat/db/schema";
import { eq } from "drizzle-orm";

export const load: PageServerLoad = async () => {
  const allPortals = await db
    .select({
      id: portals.id,
      name: portals.name,
      slug: portals.slug,
      headerText: portals.headerText,
    })
    .from(portals)
    .where(eq(portals.archived, false));

  return { portals: allPortals };
};
