import { db } from "@xat/db";
import { slaPolicies, appliedSlas, conversations, messages } from "@xat/db/schema";
import { eq, and, desc, count, sql, gte, lte } from "drizzle-orm";

export async function listSlaPolicies(accountId: number) {
  return db
    .select()
    .from(slaPolicies)
    .where(eq(slaPolicies.accountId, accountId))
    .orderBy(slaPolicies.name);
}

export async function getSlaPolicy(accountId: number, slaId: number) {
  const [policy] = await db
    .select()
    .from(slaPolicies)
    .where(
      and(eq(slaPolicies.id, slaId), eq(slaPolicies.accountId, accountId)),
    )
    .limit(1);
  return policy ?? null;
}

export async function createSlaPolicy(params: {
  accountId: number;
  name: string;
  description?: string;
  firstResponseTimeThreshold?: number;
  nextResponseTimeThreshold?: number;
  resolutionTimeThreshold?: number;
  onlyDuringBusinessHours?: boolean;
}) {
  const [policy] = await db.insert(slaPolicies).values(params).returning();
  return policy;
}

export async function updateSlaPolicy(
  accountId: number,
  slaId: number,
  data: {
    name?: string;
    description?: string;
    firstResponseTimeThreshold?: number;
    nextResponseTimeThreshold?: number;
    resolutionTimeThreshold?: number;
    onlyDuringBusinessHours?: boolean;
    active?: boolean;
  },
) {
  const [updated] = await db
    .update(slaPolicies)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(eq(slaPolicies.id, slaId), eq(slaPolicies.accountId, accountId)),
    )
    .returning();
  return updated;
}

export async function deleteSlaPolicy(accountId: number, slaId: number) {
  await db
    .delete(slaPolicies)
    .where(
      and(eq(slaPolicies.id, slaId), eq(slaPolicies.accountId, accountId)),
    );
}

export async function applySlaToConversation(params: {
  accountId: number;
  slaPolicyId: number;
  conversationId: number;
}) {
  const [applied] = await db.insert(appliedSlas).values(params).returning();
  return applied;
}

export async function checkSlaBreaches(accountId: number) {
  const activeSlas = await db
    .select()
    .from(appliedSlas)
    .innerJoin(slaPolicies, eq(appliedSlas.slaPolicyId, slaPolicies.id))
    .where(
      and(
        eq(appliedSlas.accountId, accountId),
        eq(appliedSlas.slaStatus, "active"),
      ),
    );

  const breaches: {
    conversationId: number;
    policyName: string;
    breachType: string;
  }[] = [];

  for (const row of activeSlas) {
    const conv = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, row.applied_slas.conversationId))
      .limit(1);

    if (!conv[0]) continue;

    const now = new Date();
    const createdAt = new Date(conv[0].createdAt);
    const elapsedSeconds = Math.floor(
      (now.getTime() - createdAt.getTime()) / 1000,
    );

    // Check first response time
    if (row.sla_policies.firstResponseTimeThreshold) {
      const [firstOutgoing] = await db
        .select({ createdAt: messages.createdAt })
        .from(messages)
        .where(
          and(
            eq(messages.conversationId, conv[0].id),
            eq(messages.messageType, 1),
          ),
        )
        .orderBy(messages.createdAt)
        .limit(1);

      if (!firstOutgoing && elapsedSeconds > row.sla_policies.firstResponseTimeThreshold) {
        breaches.push({
          conversationId: conv[0].id,
          policyName: row.sla_policies.name,
          breachType: "first_response_time",
        });
      }
    }

    // Check resolution time
    if (
      row.sla_policies.resolutionTimeThreshold &&
      conv[0].status !== 1 &&
      elapsedSeconds > row.sla_policies.resolutionTimeThreshold
    ) {
      breaches.push({
        conversationId: conv[0].id,
        policyName: row.sla_policies.name,
        breachType: "resolution_time",
      });
    }
  }

  return breaches;
}

export async function getSlaMetrics(
  accountId: number,
  since: Date,
  until: Date,
) {
  const [totalApplied] = await db
    .select({ count: count() })
    .from(appliedSlas)
    .where(
      and(
        eq(appliedSlas.accountId, accountId),
        gte(appliedSlas.createdAt, since),
        lte(appliedSlas.createdAt, until),
      ),
    );

  const [hitCount] = await db
    .select({ count: count() })
    .from(appliedSlas)
    .where(
      and(
        eq(appliedSlas.accountId, accountId),
        eq(appliedSlas.slaStatus, "hit"),
        gte(appliedSlas.createdAt, since),
        lte(appliedSlas.createdAt, until),
      ),
    );

  const [missCount] = await db
    .select({ count: count() })
    .from(appliedSlas)
    .where(
      and(
        eq(appliedSlas.accountId, accountId),
        eq(appliedSlas.slaStatus, "missed"),
        gte(appliedSlas.createdAt, since),
        lte(appliedSlas.createdAt, until),
      ),
    );

  const total = totalApplied?.count ?? 0;
  const hits = hitCount?.count ?? 0;
  const misses = missCount?.count ?? 0;

  return {
    totalApplied: total,
    hits,
    misses,
    hitRate: total > 0 ? Math.round((hits / total) * 100) : null,
  };
}
