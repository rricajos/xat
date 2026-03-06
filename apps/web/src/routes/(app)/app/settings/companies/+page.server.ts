import type { PageServerLoad, Actions } from "./$types";
import { listCompanies, createCompany, deleteCompany } from "$lib/server/services/company.service";
import { fail } from "@sveltejs/kit";

export const load: PageServerLoad = async ({ locals, url }) => {
  const page = parseInt(url.searchParams.get("page") ?? "1");
  const search = url.searchParams.get("search") ?? undefined;
  const result = await listCompanies(locals.account!.id, { page, search });
  return { companies: result.data, total: result.total, page, search: search ?? "" };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    if (!name?.trim()) return fail(400, { error: "Name is required" });
    await createCompany({
      accountId: locals.account!.id,
      name: name.trim(),
      domain: (formData.get("domain") as string) || undefined,
      description: (formData.get("description") as string) || undefined,
    });
    return { success: true };
  },
  delete: async ({ request, locals }) => {
    const formData = await request.formData();
    const id = parseInt(formData.get("id") as string);
    if (!id) return fail(400, { error: "Company ID required" });
    await deleteCompany(locals.account!.id, id);
    return { success: true };
  },
};
