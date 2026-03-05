import type { PageServerLoad, Actions } from "./$types";
import { fail } from "@sveltejs/kit";
import { db } from "@xat/db";
import { accounts, accountUsers, conversations, contacts } from "@xat/db/schema";
import { count, eq } from "drizzle-orm";

export const load: PageServerLoad = async () => {
  const allAccounts = await db
    .select({
      id: accounts.id,
      name: accounts.name,
      locale: accounts.locale,
      domain: accounts.domain,
      createdAt: accounts.createdAt,
    })
    .from(accounts)
    .orderBy(accounts.id);

  const accountsWithCounts = [];
  for (const acc of allAccounts) {
    const [[agentCount], [convCount], [contactCount]] = await Promise.all([
      db
        .select({ count: count() })
        .from(accountUsers)
        .where(eq(accountUsers.accountId, acc.id)),
      db
        .select({ count: count() })
        .from(conversations)
        .where(eq(conversations.accountId, acc.id)),
      db
        .select({ count: count() })
        .from(contacts)
        .where(eq(contacts.accountId, acc.id)),
    ]);

    accountsWithCounts.push({
      ...acc,
      agentCount: agentCount?.count ?? 0,
      conversationCount: convCount?.count ?? 0,
      contactCount: contactCount?.count ?? 0,
    });
  }

  return { accounts: accountsWithCounts };
};

export const actions: Actions = {
  create: async ({ request }) => {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const locale = (formData.get("locale") as string) || "en";

    if (!name?.trim()) return fail(400, { error: "Name is required" });

    await db.insert(accounts).values({
      name: name.trim(),
      locale,
    });

    return { success: true };
  },

  delete: async ({ request }) => {
    const formData = await request.formData();
    const accountId = parseInt(formData.get("accountId") as string);

    if (isNaN(accountId)) return fail(400, { error: "Invalid account" });

    await db.delete(accounts).where(eq(accounts.id, accountId));

    return { success: true };
  },
};
