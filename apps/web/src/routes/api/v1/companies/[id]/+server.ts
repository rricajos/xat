import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getCompany, updateCompany, deleteCompany } from "$lib/server/services/company.service";

export const GET: RequestHandler = async ({ locals, params }) => {
  if (!locals.account) return json({ error: "Unauthorized" }, { status: 401 });
  const company = await getCompany(locals.account.id, parseInt(params.id));
  if (!company) return json({ error: "Not found" }, { status: 404 });
  return json({ data: company });
};

export const PATCH: RequestHandler = async ({ locals, params, request }) => {
  if (!locals.account) return json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const updated = await updateCompany(locals.account.id, parseInt(params.id), body);
  if (!updated) return json({ error: "Not found" }, { status: 404 });
  return json({ data: updated });
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
  if (!locals.account) return json({ error: "Unauthorized" }, { status: 401 });
  await deleteCompany(locals.account.id, parseInt(params.id));
  return json({ success: true });
};
