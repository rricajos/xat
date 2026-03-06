import { db } from "@xat/db";
import { dashboardApps } from "@xat/db/schema";
import { eq, and } from "drizzle-orm";

export async function listDashboardApps(accountId: number) {
  return db
    .select()
    .from(dashboardApps)
    .where(eq(dashboardApps.accountId, accountId))
    .orderBy(dashboardApps.createdAt);
}

export async function getDashboardApp(accountId: number, appId: number) {
  const [app] = await db
    .select()
    .from(dashboardApps)
    .where(
      and(
        eq(dashboardApps.id, appId),
        eq(dashboardApps.accountId, accountId),
      ),
    )
    .limit(1);
  return app ?? null;
}

export async function createDashboardApp(data: {
  accountId: number;
  title: string;
  content: Array<{ type: string; url: string }>;
}) {
  const [app] = await db
    .insert(dashboardApps)
    .values({
      accountId: data.accountId,
      title: data.title,
      content: data.content,
    })
    .returning();
  return app;
}

export async function updateDashboardApp(
  accountId: number,
  appId: number,
  data: { title?: string; content?: Array<{ type: string; url: string }> },
) {
  const [app] = await db
    .update(dashboardApps)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(
        eq(dashboardApps.id, appId),
        eq(dashboardApps.accountId, accountId),
      ),
    )
    .returning();
  return app;
}

export async function deleteDashboardApp(accountId: number, appId: number) {
  await db
    .delete(dashboardApps)
    .where(
      and(
        eq(dashboardApps.id, appId),
        eq(dashboardApps.accountId, accountId),
      ),
    );
}
