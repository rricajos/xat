import type { PageServerLoad, Actions } from "./$types";
import { fail } from "@sveltejs/kit";
import {
  listMacros,
  createMacro,
  deleteMacro,
} from "$lib/server/services/macro.service";

export const load: PageServerLoad = async ({ locals }) => {
  const allMacros = await listMacros(locals.account!.id, locals.user!.id);
  return { macros: allMacros };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const visibility = formData.get("visibility") as string;

    if (!name?.trim()) return fail(400, { error: "Name is required" });

    await createMacro({
      accountId: locals.account!.id,
      name: name.trim(),
      visibility: visibility || "personal",
      createdById: locals.user!.id,
      actions: [],
    });

    return { success: true };
  },

  delete: async ({ request, locals }) => {
    const formData = await request.formData();
    const macroId = parseInt(formData.get("macroId") as string);

    await deleteMacro(locals.account!.id, macroId);
    return { success: true };
  },
};
