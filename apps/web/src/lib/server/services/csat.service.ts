import { db } from "@xat/db";
import { csatSurveyResponses } from "@xat/db/schema";
import { eq, and, gte, lte, count, avg, isNotNull, desc } from "drizzle-orm";
import { randomBytes } from "node:crypto";

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

// Create a pending survey (no rating yet) and return the token for email link
export async function createPendingSurvey(params: {
  accountId: number;
  conversationId: number;
  contactId: number;
  assignedAgentId?: number;
}) {
  // Check if a survey already exists for this conversation
  const [existing] = await db
    .select({ id: csatSurveyResponses.id })
    .from(csatSurveyResponses)
    .where(eq(csatSurveyResponses.conversationId, params.conversationId))
    .limit(1);
  if (existing) return null;

  const token = randomBytes(32).toString("hex");
  const [survey] = await db
    .insert(csatSurveyResponses)
    .values({ ...params, token, surveyEmailSentAt: new Date() })
    .returning();
  return survey;
}

export async function getSurveyByToken(token: string) {
  const [survey] = await db
    .select()
    .from(csatSurveyResponses)
    .where(eq(csatSurveyResponses.token, token))
    .limit(1);
  return survey ?? null;
}

export async function submitSurveyByToken(
  token: string,
  rating: number,
  feedbackText?: string,
) {
  const [updated] = await db
    .update(csatSurveyResponses)
    .set({ rating, feedbackText: feedbackText ?? null, updatedAt: new Date() })
    .where(and(eq(csatSurveyResponses.token, token)))
    .returning();
  return updated ?? null;
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

  // Only return surveys that have been submitted (rating is not null)
  const conditions = [
    eq(csatSurveyResponses.accountId, accountId),
    isNotNull(csatSurveyResponses.rating),
  ];

  if (options.since) conditions.push(gte(csatSurveyResponses.createdAt, options.since));
  if (options.until) conditions.push(lte(csatSurveyResponses.createdAt, options.until));
  if (options.agentId) conditions.push(eq(csatSurveyResponses.assignedAgentId, options.agentId));

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
    isNotNull(csatSurveyResponses.rating),
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

  const distribution = await db
    .select({ rating: csatSurveyResponses.rating, count: count() })
    .from(csatSurveyResponses)
    .where(where)
    .groupBy(csatSurveyResponses.rating);

  const ratingMap: Record<number, number> = {};
  for (const d of distribution) {
    if (d.rating !== null) ratingMap[d.rating] = d.count;
  }

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
