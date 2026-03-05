import type { PageServerLoad } from "./$types";
import { listContacts } from "$lib/server/services/contact.service";

export const load: PageServerLoad = async ({ locals, url }) => {
  const page = parseInt(url.searchParams.get("page") ?? "1");
  const search = url.searchParams.get("search") ?? undefined;

  const result = await listContacts(locals.account!.id, {
    page,
    search,
    limit: 25,
  });

  return {
    contacts: result.data,
    total: result.total,
    currentPage: page,
    search: search ?? "",
  };
};
