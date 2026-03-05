import { db } from "@xat/db";
import { auditLogs, users } from "@xat/db/schema";
import { eq, and, desc, count } from "drizzle-orm";

export async function createAuditLog(params: {
  accountId: number;
  userId?: number;
  action: string;
  auditableType?: string;
  auditableId?: number;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}) {
  const [log] = await db.insert(auditLogs).values(params).returning();
  return log;
}

export async function listAuditLogs(
  accountId: number,
  options: {
    auditableType?: string;
    userId?: number;
    page?: number;
    limit?: number;
  } = {},
) {
  const { page = 1, limit = 50 } = options;
  const offset = (page - 1) * limit;

  const conditions = [eq(auditLogs.accountId, accountId)];

  if (options.auditableType) {
    conditions.push(eq(auditLogs.auditableType, options.auditableType));
  }
  if (options.userId) {
    conditions.push(eq(auditLogs.userId, options.userId));
  }

  const where = and(...conditions);

  const [totalResult] = await db
    .select({ count: count() })
    .from(auditLogs)
    .where(where);

  const logs = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      auditableType: auditLogs.auditableType,
      auditableId: auditLogs.auditableId,
      changes: auditLogs.changes,
      ipAddress: auditLogs.ipAddress,
      createdAt: auditLogs.createdAt,
      userId: auditLogs.userId,
      userName: users.name,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .where(where)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset(offset);

  return { data: logs, total: totalResult?.count ?? 0 };
}
