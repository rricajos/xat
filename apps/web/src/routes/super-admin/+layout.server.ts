import type { LayoutServerLoad } from "./$types";
import { db } from "@xat/db";
import { accounts, users, accountUsers } from "@xat/db/schema";
import { count } from "drizzle-orm";

export const load: LayoutServerLoad = async () => {
  const [accountCount] = await db.select({ count: count() }).from(accounts);
  const [userCount] = await db.select({ count: count() }).from(users);
  const [agentCount] = await db.select({ count: count() }).from(accountUsers);

  return {
    stats: {
      accounts: accountCount?.count ?? 0,
      users: userCount?.count ?? 0,
      agents: agentCount?.count ?? 0,
    },
  };
};
