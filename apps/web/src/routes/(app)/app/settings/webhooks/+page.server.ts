import type { PageServerLoad, Actions } from "./$types";
import { fail } from "@sveltejs/kit";
import {
  listWebhooks,
  createWebhook,
  deleteWebhook,
} from "$lib/server/services/webhook.service";

export const load: PageServerLoad = async ({ locals }) => {
  const allWebhooks = await listWebhooks(locals.account!.id);
  return { webhooks: allWebhooks };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const formData = await request.formData();
    const url = formData.get("url") as string;
    const subscriptions = (formData.get("subscriptions") as string)
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];

    if (!url?.trim()) return fail(400, { error: "URL is required" });

    try {
      new URL(url);
    } catch {
      return fail(400, { error: "Invalid URL" });
    }

    await createWebhook({
      accountId: locals.account!.id,
      url: url.trim(),
      subscriptions,
    });

    return { success: true };
  },

  delete: async ({ request, locals }) => {
    const formData = await request.formData();
    const webhookId = parseInt(formData.get("webhookId") as string);

    await deleteWebhook(locals.account!.id, webhookId);
    return { success: true };
  },
};
