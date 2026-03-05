import type { PageServerLoad, Actions } from "./$types";
import { fail } from "@sveltejs/kit";
import {
  listPortals,
  createPortal,
} from "$lib/server/services/help-center.service";

export const load: PageServerLoad = async ({ locals }) => {
  const allPortals = await listPortals(locals.account!.id);
  return { portals: allPortals };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;

    if (!name?.trim() || !slug?.trim()) {
      return fail(400, { error: "Name and slug are required" });
    }

    await createPortal({
      accountId: locals.account!.id,
      name: name.trim(),
      slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"),
    });

    return { success: true };
  },
};
