import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";
import { db } from "@xat/db";
import { labels, inboxes } from "@xat/db/schema";
import { eq } from "drizzle-orm";

export const load: LayoutServerLoad = async ({ locals }) => {
  if (!locals.user || !locals.account) {
    redirect(302, "/auth/login");
  }

  const [accountLabels, accountInboxes] = await Promise.all([
    db
      .select({ id: labels.id, title: labels.title, color: labels.color })
      .from(labels)
      .where(eq(labels.accountId, locals.account.id))
      .orderBy(labels.title),
    db
      .select({
        id: inboxes.id,
        name: inboxes.name,
        channelType: inboxes.channelType,
      })
      .from(inboxes)
      .where(eq(inboxes.accountId, locals.account.id))
      .orderBy(inboxes.name),
  ]);

  return {
    user: locals.user,
    account: locals.account,
    labels: accountLabels,
    inboxes: accountInboxes,
  };
};
