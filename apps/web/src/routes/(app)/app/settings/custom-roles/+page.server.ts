import type { PageServerLoad, Actions } from "./$types";
import { fail } from "@sveltejs/kit";
import {
  listCustomRoles,
  createCustomRole,
  updateCustomRole,
  deleteCustomRole,
  PERMISSIONS,
} from "$lib/server/services/custom-role.service";

export const load: PageServerLoad = async ({ locals }) => {
  const roles = await listCustomRoles(locals.account!.id);
  return { roles, permissions: PERMISSIONS };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const permissions = formData.getAll("permissions") as string[];

    if (!name?.trim()) return fail(400, { error: "Name is required" });

    await createCustomRole({
      accountId: locals.account!.id,
      name: name.trim(),
      permissions,
    });

    return { success: true };
  },

  update: async ({ request, locals }) => {
    const formData = await request.formData();
    const roleId = parseInt(formData.get("roleId") as string);
    const name = formData.get("name") as string;
    const permissions = formData.getAll("permissions") as string[];

    if (!name?.trim()) return fail(400, { error: "Name is required" });

    await updateCustomRole(locals.account!.id, roleId, {
      name: name.trim(),
      permissions,
    });

    return { success: true };
  },

  delete: async ({ request, locals }) => {
    const formData = await request.formData();
    const roleId = parseInt(formData.get("roleId") as string);
    await deleteCustomRole(locals.account!.id, roleId);
    return { success: true };
  },
};
