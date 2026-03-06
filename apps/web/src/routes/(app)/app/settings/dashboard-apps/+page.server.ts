import type { PageServerLoad, Actions } from "./$types";
import { fail } from "@sveltejs/kit";
import {
  listDashboardApps,
  createDashboardApp,
  deleteDashboardApp,
} from "$lib/server/services/dashboard-app.service";

export const load: PageServerLoad = async ({ locals }) => {
  const apps = await listDashboardApps(locals.account!.id);
  return { dashboardApps: apps };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const formData = await request.formData();
    const title = formData.get("title") as string;
    const url = formData.get("url") as string;

    if (!title?.trim()) return fail(400, { error: "Title is required" });
    if (!url?.trim()) return fail(400, { error: "URL is required" });

    try {
      new URL(url);
    } catch {
      return fail(400, { error: "Invalid URL" });
    }

    await createDashboardApp({
      accountId: locals.account!.id,
      title: title.trim(),
      content: [{ type: "frame", url: url.trim() }],
    });

    return { success: true };
  },

  delete: async ({ request, locals }) => {
    const formData = await request.formData();
    const appId = parseInt(formData.get("appId") as string);

    if (isNaN(appId)) return fail(400, { error: "Invalid app" });

    await deleteDashboardApp(locals.account!.id, appId);
    return { success: true };
  },
};
