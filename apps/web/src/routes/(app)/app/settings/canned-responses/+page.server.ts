import type { PageServerLoad, Actions } from "./$types";
import { fail } from "@sveltejs/kit";
import {
  listCannedResponses,
  createCannedResponse,
  deleteCannedResponse,
} from "$lib/server/services/canned-response.service";

export const load: PageServerLoad = async ({ locals }) => {
  const responses = await listCannedResponses(locals.account!.id);
  return { cannedResponses: responses };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const formData = await request.formData();
    const shortCode = formData.get("shortCode") as string;
    const content = formData.get("content") as string;

    if (!shortCode?.trim() || !content?.trim()) {
      return fail(400, { error: "Short code and content are required" });
    }

    await createCannedResponse({
      accountId: locals.account!.id,
      shortCode: shortCode.trim(),
      content: content.trim(),
    });

    return { success: true };
  },

  delete: async ({ request, locals }) => {
    const formData = await request.formData();
    const id = parseInt(formData.get("id") as string);
    await deleteCannedResponse(locals.account!.id, id);
    return { success: true };
  },
};
