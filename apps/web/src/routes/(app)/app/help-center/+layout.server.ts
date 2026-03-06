import type { LayoutServerLoad } from "./$types";
import { listPortals } from "$lib/server/services/help-center.service";

export const load: LayoutServerLoad = async ({ locals }) => {
  const portals = await listPortals(locals.account!.id);
  return { portals };
};
