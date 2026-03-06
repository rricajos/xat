import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { listCompanies, createCompany } from "$lib/server/services/company.service";

export const GET: RequestHandler = async ({ locals, url }) => {
  if (!locals.account) return json({ error: "Unauthorized" }, { status: 401 });
  const page = parseInt(url.searchParams.get("page") ?? "1");
  const search = url.searchParams.get("search") ?? undefined;
  const result = await listCompanies(locals.account.id, { page, search });
  return json({ data: result.data, meta: { total: result.total } });
};

export const POST: RequestHandler = async ({ locals, request }) => {
  if (!locals.account) return json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  if (!body.name?.trim()) return json({ error: "Name is required" }, { status: 400 });
  const company = await createCompany({ accountId: locals.account.id, name: body.name.trim(), domain: body.domain, description: body.description });
  return json({ data: company }, { status: 201 });
};
