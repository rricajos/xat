import { db } from "@xat/db";
import { csatSurveyResponses } from "@xat/db/schema";
import { eq, and, gte, lte, count, avg, sql, desc } from "drizzle-orm";

export async function createSurveyResponse(params: {
  accountId: number;
  conversationId: number;
  contactId: number;
  assignedAgentId?: number;
  messageId?: number;
  rating: number;
  feedbackText?: string;
}) {
  const [response] = await db
    .insert(csatSurveyResponses)
    .values(params)
    .returning();
  return response;
}

export async function getSurveyResponse(
  accountId: number,
  conversationId: number,
) {
  const [response] = await db
    .select()
    .from(csatSurveyResponses)
    .where(
      and(
        eq(csatSurveyResponses.accountId, accountId),
        eq(csatSurveyResponses.conversationId, conversationId),
      ),
    )
    .limit(1);
  return response ?? null;
}

export async function listSurveyResponses(
  accountId: number,
  options: {
    since?: Date;
    until?: Date;
    agentId?: number;
    page?: number;
    limit?: number;
  } = {},
) {
  const { page = 1, limit = 25 } = options;
  const offset = (page - 1) * limit;

  const conditions = [eq(csatSurveyResponses.accountId, accountId)];

  if (options.since) {
    conditions.push(gte(csatSurveyResponses.createdAt, options.since));
  }
  if (options.until) {
    conditions.push(lte(csatSurveyResponses.createdAt, options.until));
  }
  if (options.agentId) {
    conditions.push(eq(csatSurveyResponses.assignedAgentId, options.agentId));
  }

  const where = and(...conditions);

  const [totalResult] = await db
    .select({ count: count() })
    .from(csatSurveyResponses)
    .where(where);

  const responses = await db
    .select()
    .from(csatSurveyResponses)
    .where(where)
    .orderBy(desc(csatSurveyResponses.createdAt))
    .limit(limit)
    .offset(offset);

  return { data: responses, total: totalResult?.count ?? 0 };
}

export async function getCsatMetrics(
  accountId: number,
  since: Date,
  until: Date,
) {
  const conditions = [
    eq(csatSurveyResponses.accountId, accountId),
    gte(csatSurveyResponses.createdAt, since),
    lte(csatSurveyResponses.createdAt, until),
  ];

  const where = and(...conditions);

  const [metrics] = await db
    .select({
      totalResponses: count(),
      averageRating: avg(csatSurveyResponses.rating),
    })
    .from(csatSurveyResponses)
    .where(where);

  // Rating distribution
  const distribution = await db
    .select({
      rating: csatSurveyResponses.rating,
      count: count(),
    })
    .from(csatSurveyResponses)
    .where(where)
    .groupBy(csatSurveyResponses.rating);

  const ratingMap: Record<number, number> = {};
  for (const d of distribution) {
    ratingMap[d.rating] = d.count;
  }

  // Satisfaction score: percentage of ratings >= 4
  const satisfied = (ratingMap[4] ?? 0) + (ratingMap[5] ?? 0);
  const total = metrics?.totalResponses ?? 0;
  const satisfactionScore = total > 0 ? Math.round((satisfied / total) * 100) : null;

  return {
    totalResponses: total,
    averageRating: metrics?.averageRating ? parseFloat(String(metrics.averageRating)) : null,
    satisfactionScore,
    ratingDistribution: ratingMap,
  };
}
