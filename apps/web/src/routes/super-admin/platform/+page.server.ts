import type { PageServerLoad, Actions } from "./$types";
import { db } from "@xat/db";
import { sessions } from "@xat/db/schema";
import { count, lt } from "drizzle-orm";

export const load: PageServerLoad = async () => {
  const [sessionCount] = await db.select({ count: count() }).from(sessions);
  const [expiredSessionCount] = await db
    .select({ count: count() })
    .from(sessions)
    .where(lt(sessions.expiresAt, new Date()));

  return {
    platform: {
      activeSessions: (sessionCount?.count ?? 0) - (expiredSessionCount?.count ?? 0),
      expiredSessions: expiredSessionCount?.count ?? 0,
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    },
  };
};

export const actions: Actions = {
  cleanupSessions: async () => {
    await db
      .delete(sessions)
      .where(lt(sessions.expiresAt, new Date()));

    return { success: true, message: "Expired sessions cleaned up" };
  },
};
