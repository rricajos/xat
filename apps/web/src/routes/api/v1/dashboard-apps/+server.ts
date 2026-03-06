import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import {
  listDashboardApps,
  createDashboardApp,
} from "$lib/server/services/dashboard-app.service";

export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.account) return json({ error: "Unauthorized" }, { status: 401 });
  const apps = await listDashboardApps(locals.account.id);
  return json({ data: apps });
};

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.account) return json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { title, content } = body;

  if (!title?.trim()) return json({ error: "Title is required" }, { status: 400 });

  const app = await createDashboardApp({
    accountId: locals.account.id,
    title: title.trim(),
    content: content ?? [],
  });

  return json({ data: app }, { status: 201 });
};
