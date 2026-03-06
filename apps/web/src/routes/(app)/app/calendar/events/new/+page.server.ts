import { db } from "@xat/db";
import { inboxes, users, teams } from "@xat/db/schema";
import { eq } from "drizzle-orm";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const account = locals.account!;
  const [accountInboxes, userRow, accountTeams] = await Promise.all([
    db.select({ id: inboxes.id, name: inboxes.name }).from(inboxes).where(eq(inboxes.accountId, account.id)),
    db.select({ calendarUsername: users.calendarUsername }).from(users).where(eq(users.id, locals.user!.id)).limit(1),
    db.select({ id: teams.id, name: teams.name }).from(teams).where(eq(teams.accountId, account.id)),
  ]);
  return { inboxes: accountInboxes, calendarUsername: userRow[0]?.calendarUsername ?? null, teams: accountTeams };
};
