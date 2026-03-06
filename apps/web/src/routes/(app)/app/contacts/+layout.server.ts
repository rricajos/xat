import type { LayoutServerLoad } from "./$types";
import { listCustomFilters } from "$lib/server/services/custom-filter.service";

export const load: LayoutServerLoad = async ({ locals }) => {
  const segments = await listCustomFilters(locals.account!.id, locals.user!.id, "contact");
  return { segments };
};
