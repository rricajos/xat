import type { PageServerLoad, Actions } from "./$types";
import { fail } from "@sveltejs/kit";
import {
  listApiTokens,
  createApiToken,
  deleteApiToken,
} from "$lib/server/services/api-token.service";

export const load: PageServerLoad = async ({ locals }) => {
  const tokens = await listApiTokens(locals.account!.id, locals.user!.id);
  // Mask tokens
  const masked = tokens.map((t) => ({
    ...t,
    token: `xat_${"*".repeat(40)}${t.token.slice(-8)}`,
  }));
  return { tokens: masked };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const formData = await request.formData();
    const label = formData.get("label") as string;

    if (!label?.trim()) return fail(400, { error: "Label is required" });

    const token = await createApiToken({
      accountId: locals.account!.id,
      userId: locals.user!.id,
      label: label.trim(),
    });

    return { success: true, newToken: token!.token };
  },

  delete: async ({ request, locals }) => {
    const formData = await request.formData();
    const tokenId = parseInt(formData.get("tokenId") as string);

    await deleteApiToken(locals.account!.id, locals.user!.id, tokenId);
    return { success: true };
  },
};
