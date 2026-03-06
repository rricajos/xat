import { listEventTypes } from "$lib/server/services/calendar.service.js";
import { db } from "@xat/db";
import { inboxes } from "@xat/db/schema";
import { eq } from "drizzle-orm";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user!;
  const account = locals.account!;

  const [eventTypes, accountInboxes] = await Promise.all([
    listEventTypes(account.id, { userId: user.id }),
    db.select({ id: inboxes.id, name: inboxes.name }).from(inboxes).where(eq(inboxes.accountId, account.id)),
  ]);

  return { eventTypes, inboxes: accountInboxes };
};
