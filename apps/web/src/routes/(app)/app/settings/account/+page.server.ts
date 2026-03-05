import type { PageServerLoad, Actions } from "./$types";
import { fail, redirect } from "@sveltejs/kit";
import { db } from "@xat/db";
import { accounts } from "@xat/db/schema";
import { eq } from "drizzle-orm";

export const load: PageServerLoad = async ({ locals }) => {
  const [account] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.id, locals.account!.id))
    .limit(1);

  return { accountDetails: account };
};

export const actions: Actions = {
  updateAccount: async ({ request, locals }) => {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const locale = formData.get("locale") as string;
    const domain = formData.get("domain") as string;
    const autoResolveEnabled = formData.get("autoResolveEnabled") === "true";
    const autoResolveDays = parseInt(
      (formData.get("autoResolveDays") as string) || "30",
      10,
    );

    if (!name?.trim()) {
      return fail(400, { error: "Name is required" });
    }

    const [current] = await db
      .select({ settings: accounts.settings })
      .from(accounts)
      .where(eq(accounts.id, locals.account!.id))
      .limit(1);

    const settings = {
      ...((current?.settings as Record<string, unknown>) ?? {}),
      autoResolve: {
        enabled: autoResolveEnabled,
        days: Math.max(1, Math.min(999, autoResolveDays)),
      },
    };

    await db
      .update(accounts)
      .set({
        name: name.trim(),
        locale: locale || "en",
        domain: domain || null,
        settings,
        updatedAt: new Date(),
      })
      .where(eq(accounts.id, locals.account!.id));

    return { success: true };
  },

  deleteAccount: async ({ request, locals }) => {
    const formData = await request.formData();
    const confirmText = formData.get("confirmText") as string;

    if (confirmText !== "DELETE") {
      return fail(400, { error: "Please type DELETE to confirm" });
    }

    await db.delete(accounts).where(eq(accounts.id, locals.account!.id));

    redirect(303, "/login");
  },
};
