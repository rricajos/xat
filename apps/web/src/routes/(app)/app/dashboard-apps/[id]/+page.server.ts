import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { getDashboardApp } from "$lib/server/services/dashboard-app.service";

export const load: PageServerLoad = async ({ params, locals }) => {
  const app = await getDashboardApp(locals.account!.id, parseInt(params.id));
  if (!app) throw error(404, "Dashboard app not found");
  return { app };
};
