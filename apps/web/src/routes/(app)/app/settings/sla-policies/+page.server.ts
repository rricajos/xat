import type { PageServerLoad, Actions } from "./$types";
import { fail } from "@sveltejs/kit";
import {
  listSlaPolicies,
  createSlaPolicy,
  deleteSlaPolicy,
  updateSlaPolicy,
} from "$lib/server/services/sla.service";

export const load: PageServerLoad = async ({ locals }) => {
  const policies = await listSlaPolicies(locals.account!.id);
  return { policies };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const firstResponseTime = formData.get("firstResponseTime") as string;
    const nextResponseTime = formData.get("nextResponseTime") as string;
    const resolutionTime = formData.get("resolutionTime") as string;

    if (!name?.trim()) return fail(400, { error: "Name is required" });

    await createSlaPolicy({
      accountId: locals.account!.id,
      name: name.trim(),
      description: description?.trim() || undefined,
      firstResponseTimeThreshold: firstResponseTime
        ? parseInt(firstResponseTime) * 60
        : undefined,
      nextResponseTimeThreshold: nextResponseTime
        ? parseInt(nextResponseTime) * 60
        : undefined,
      resolutionTimeThreshold: resolutionTime
        ? parseInt(resolutionTime) * 60
        : undefined,
    });

    return { success: true };
  },

  toggle: async ({ request, locals }) => {
    const formData = await request.formData();
    const slaId = parseInt(formData.get("slaId") as string);
    const active = formData.get("active") === "true";

    await updateSlaPolicy(locals.account!.id, slaId, { active: !active });
    return { success: true };
  },

  delete: async ({ request, locals }) => {
    const formData = await request.formData();
    const slaId = parseInt(formData.get("slaId") as string);

    await deleteSlaPolicy(locals.account!.id, slaId);
    return { success: true };
  },
};
