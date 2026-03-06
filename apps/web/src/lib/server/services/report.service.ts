import { db } from "@xat/db";
import {
  conversations,
  messages,
  users,
  accountUsers,
  inboxes,
  teams,
  labels,
  labelTaggings,
} from "@xat/db/schema";
import { eq, and, gte, lte, count, sql, avg } from "drizzle-orm";

export interface ReportMetrics {
  conversationsCount: number;
  incomingMessagesCount: number;
  outgoingMessagesCount: number;
  firstResponseTime: number | null;
  resolutionTime: number | null;
  resolutionCount: number;
}

export async function getOverviewReport(
  accountId: number,
  since: Date,
  until: Date,
): Promise<ReportMetrics> {
  const [convCount] = await db
    .select({ count: count() })
    .from(conversations)
    .where(
      and(
        eq(conversations.accountId, accountId),
        gte(conversations.createdAt, since),
        lte(conversations.createdAt, until),
      ),
    );

  const [incomingCount] = await db
    .select({ count: count() })
    .from(messages)
    .where(
      and(
        eq(messages.accountId, accountId),
        eq(messages.messageType, 0),
        gte(messages.createdAt, since),
        lte(messages.createdAt, until),
      ),
    );

  const [outgoingCount] = await db
    .select({ count: count() })
    .from(messages)
    .where(
      and(
        eq(messages.accountId, accountId),
        eq(messages.messageType, 1),
        gte(messages.createdAt, since),
        lte(messages.createdAt, until),
      ),
    );

  const [resolutions] = await db
    .select({ count: count() })
    .from(conversations)
    .where(
      and(
        eq(conversations.accountId, accountId),
        eq(conversations.status, 1),
        gte(conversations.updatedAt, since),
        lte(conversations.updatedAt, until),
      ),
    );

  // First response time (avg seconds between conversation creation and first outgoing message)
  // Simplified: skip FRT calculation if no conversations exist
  let avgFrt: number | null = null;
  try {
    const frtResult = await db.execute<{ avg_frt: string | null }>(sql`
      SELECT AVG(EXTRACT(EPOCH FROM (m.created_at - c.created_at)))::numeric as avg_frt
      FROM conversations c
      INNER JOIN LATERAL (
        SELECT created_at FROM messages
        WHERE conversation_id = c.id AND message_type = 1
        ORDER BY created_at ASC LIMIT 1
      ) m ON true
      WHERE c.account_id = ${accountId}
        AND c.created_at >= ${since.toISOString()}
        AND c.created_at <= ${until.toISOString()}
    `);
    const row = Array.isArray(frtResult) ? frtResult[0] : null;
    avgFrt = row?.avg_frt ? parseFloat(row.avg_frt) : null;
  } catch {
    // FRT query may fail if schema uses different date handling; gracefully fallback
    avgFrt = null;
  }

  // Resolution time: average seconds from creation to resolution (status=1)
  let avgResolutionTime: number | null = null;
  try {
    const rtResult = await db.execute<{ avg_rt: string | null }>(sql`
      SELECT AVG(EXTRACT(EPOCH FROM (c.updated_at - c.created_at)))::numeric as avg_rt
      FROM conversations c
      WHERE c.account_id = ${accountId}
        AND c.status = 1
        AND c.updated_at >= ${since.toISOString()}
        AND c.updated_at <= ${until.toISOString()}
    `);
    const rtRow = Array.isArray(rtResult) ? rtResult[0] : null;
    avgResolutionTime = rtRow?.avg_rt ? Math.round(parseFloat(rtRow.avg_rt)) : null;
  } catch {
    avgResolutionTime = null;
  }

  return {
    conversationsCount: convCount?.count ?? 0,
    incomingMessagesCount: incomingCount?.count ?? 0,
    outgoingMessagesCount: outgoingCount?.count ?? 0,
    firstResponseTime: avgFrt ? Math.round(avgFrt) : null,
    resolutionTime: avgResolutionTime,
    resolutionCount: resolutions?.count ?? 0,
  };
}

export async function getConversationsByDay(
  accountId: number,
  since: Date,
  until: Date,
) {
  const result = await db
    .select({
      date: sql<string>`${conversations.createdAt}::date`,
      count: count(),
    })
    .from(conversations)
    .where(
      and(
        eq(conversations.accountId, accountId),
        gte(conversations.createdAt, since),
        lte(conversations.createdAt, until),
      ),
    )
    .groupBy(sql`${conversations.createdAt}::date`)
    .orderBy(sql`${conversations.createdAt}::date`);

  return result.map((r) => ({ date: String(r.date), count: r.count }));
}

export async function getAgentReport(
  accountId: number,
  since: Date,
  until: Date,
) {
  const agents = await db
    .select({
      id: users.id,
      name: users.name,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .innerJoin(
      accountUsers,
      and(eq(users.id, accountUsers.userId), eq(accountUsers.accountId, accountId)),
    );

  const results = [];

  for (const agent of agents) {
    const [convCount] = await db
      .select({ count: count() })
      .from(conversations)
      .where(
        and(
          eq(conversations.accountId, accountId),
          eq(conversations.assigneeId, agent.id),
          gte(conversations.createdAt, since),
          lte(conversations.createdAt, until),
        ),
      );

    const [resolved] = await db
      .select({ count: count() })
      .from(conversations)
      .where(
        and(
          eq(conversations.accountId, accountId),
          eq(conversations.assigneeId, agent.id),
          eq(conversations.status, 1),
          gte(conversations.updatedAt, since),
          lte(conversations.updatedAt, until),
        ),
      );

    results.push({
      agent: { id: agent.id, name: agent.name, avatarUrl: agent.avatarUrl },
      conversationsCount: convCount?.count ?? 0,
      resolutionCount: resolved?.count ?? 0,
    });
  }

  return results;
}

export async function getInboxReport(
  accountId: number,
  since: Date,
  until: Date,
) {
  const allInboxes = await db
    .select({ id: inboxes.id, name: inboxes.name, channelType: inboxes.channelType })
    .from(inboxes)
    .where(eq(inboxes.accountId, accountId));

  const results = [];

  for (const inbox of allInboxes) {
    const [convCount] = await db
      .select({ count: count() })
      .from(conversations)
      .where(
        and(
          eq(conversations.accountId, accountId),
          eq(conversations.inboxId, inbox.id),
          gte(conversations.createdAt, since),
          lte(conversations.createdAt, until),
        ),
      );

    results.push({
      inbox: { id: inbox.id, name: inbox.name, channelType: inbox.channelType },
      conversationsCount: convCount?.count ?? 0,
    });
  }

  return results;
}

export async function getTeamReport(
  accountId: number,
  since: Date,
  until: Date,
) {
  const allTeams = await db
    .select({ id: teams.id, name: teams.name })
    .from(teams)
    .where(eq(teams.accountId, accountId));

  const results = [];

  for (const team of allTeams) {
    const [convCount] = await db
      .select({ count: count() })
      .from(conversations)
      .where(
        and(
          eq(conversations.accountId, accountId),
          eq(conversations.teamId, team.id),
          gte(conversations.createdAt, since),
          lte(conversations.createdAt, until),
        ),
      );

    results.push({
      team: { id: team.id, name: team.name },
      conversationsCount: convCount?.count ?? 0,
    });
  }

  return results;
}

export async function getLabelReport(
  accountId: number,
  since: Date,
  until: Date,
) {
  const allLabels = await db
    .select({ id: labels.id, title: labels.title, color: labels.color })
    .from(labels)
    .where(eq(labels.accountId, accountId));

  const results = [];

  for (const label of allLabels) {
    const tagged = await db
      .select({ taggableId: labelTaggings.taggableId })
      .from(labelTaggings)
      .where(
        and(
          eq(labelTaggings.labelId, label.id),
          eq(labelTaggings.taggableType, "Conversation"),
        ),
      );

    const taggedIds = tagged.map((t) => t.taggableId);

    let convCount = 0;
    if (taggedIds.length > 0) {
      const [result] = await db
        .select({ count: count() })
        .from(conversations)
        .where(
          and(
            eq(conversations.accountId, accountId),
            sql`${conversations.id} IN (${sql.join(taggedIds.map((id) => sql`${id}`), sql`,`)})`,
            gte(conversations.createdAt, since),
            lte(conversations.createdAt, until),
          ),
        );
      convCount = result?.count ?? 0;
    }

    results.push({
      label: { id: label.id, title: label.title, color: label.color },
      conversationsCount: convCount,
    });
  }

  return results;
}
