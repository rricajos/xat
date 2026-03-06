import { fail, redirect } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";
import { createContact } from "$lib/server/services/contact.service";
import { db } from "@xat/db";
import { companies } from "@xat/db/schema";
import { eq } from "drizzle-orm";

export const load: PageServerLoad = async ({ locals }) => {
  const accountCompanies = await db
    .select({ id: companies.id, name: companies.name })
    .from(companies)
    .where(eq(companies.accountId, locals.account!.id))
    .orderBy(companies.name);

  return { companies: accountCompanies };
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phoneNumber = formData.get("phoneNumber") as string;
    const companyId = formData.get("companyId") as string;

    if (!name?.trim() && !email?.trim()) {
      return fail(400, { error: "Name or email is required" });
    }

    const contact = await createContact({
      accountId: locals.account!.id,
      name: name?.trim() || undefined,
      email: email?.trim() || undefined,
      phoneNumber: phoneNumber?.trim() || undefined,
      companyId: companyId ? parseInt(companyId) : undefined,
    });

    redirect(302, `/app/contacts/${contact!.id}`);
  },
};
