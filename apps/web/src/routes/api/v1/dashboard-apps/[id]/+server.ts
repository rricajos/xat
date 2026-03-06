import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import {
  getDashboardApp,
  updateDashboardApp,
  deleteDashboardApp,
} from "$lib/server/services/dashboard-app.service";

export const GET: RequestHandler = async ({ params, locals }) => {
  if (!locals.account) return json({ error: "Unauthorized" }, { status: 401 });
  const app = await getDashboardApp(locals.account.id, parseInt(params.id));
  if (!app) return json({ error: "Not found" }, { status: 404 });
  return json({ data: app });
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
  if (!locals.account) return json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const app = await updateDashboardApp(locals.account.id, parseInt(params.id), body);
  if (!app) return json({ error: "Not found" }, { status: 404 });
  return json({ data: app });
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
  if (!locals.account) return json({ error: "Unauthorized" }, { status: 401 });
  await deleteDashboardApp(locals.account.id, parseInt(params.id));
  return json({ data: { success: true } });
};
