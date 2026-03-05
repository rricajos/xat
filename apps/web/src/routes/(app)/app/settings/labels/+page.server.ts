import type { PageServerLoad, Actions } from "./$types";
import { fail } from "@sveltejs/kit";
import {
  listLabels,
  createLabel,
  deleteLabel,
} from "$lib/server/services/label.service";

export const load: PageServerLoad = async ({ locals }) => {
  const allLabels = await listLabels(locals.account!.id);
  return { labels: allLabels };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const formData = await request.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const color = formData.get("color") as string;

    if (!title?.trim()) return fail(400, { error: "Title is required" });

    await createLabel({
      accountId: locals.account!.id,
      title: title.trim(),
      description: description || undefined,
      color: color || "#1f93ff",
    });

    return { success: true };
  },

  delete: async ({ request, locals }) => {
    const formData = await request.formData();
    const labelId = parseInt(formData.get("labelId") as string);
    await deleteLabel(locals.account!.id, labelId);
    return { success: true };
  },
};
