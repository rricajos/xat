import { db } from "@xat/db";
import { customFilters } from "@xat/db/schema";
import { eq, and } from "drizzle-orm";

export async function listCustomFilters(
  accountId: number,
  userId: number,
  filterType: string = "conversation",
) {
  return db
    .select()
    .from(customFilters)
    .where(
      and(
        eq(customFilters.accountId, accountId),
        eq(customFilters.userId, userId),
        eq(customFilters.filterType, filterType),
      ),
    )
    .orderBy(customFilters.name);
}

export async function createCustomFilter(params: {
  accountId: number;
  userId: number;
  name: string;
  filterType: string;
  query: Record<string, unknown>;
}) {
  const [filter] = await db.insert(customFilters).values(params).returning();
  return filter;
}

export async function updateCustomFilter(
  accountId: number,
  userId: number,
  filterId: number,
  data: { name?: string; query?: Record<string, unknown> },
) {
  const [updated] = await db
    .update(customFilters)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(
        eq(customFilters.id, filterId),
        eq(customFilters.accountId, accountId),
        eq(customFilters.userId, userId),
      ),
    )
    .returning();
  return updated;
}

export async function deleteCustomFilter(
  accountId: number,
  userId: number,
  filterId: number,
) {
  await db
    .delete(customFilters)
    .where(
      and(
        eq(customFilters.id, filterId),
        eq(customFilters.accountId, accountId),
        eq(customFilters.userId, userId),
      ),
    );
}
