import { db } from "@xat/db";
import {
  kanbanBoards,
  kanbanStages,
  tickets,
  ticketConversations,
  conversations,
  contacts,
  users,
} from "@xat/db/schema";
import { eq, and, asc, desc, sql, count, inArray } from "drizzle-orm";

// --------------- Boards ---------------

export async function listBoards(accountId: number) {
  return db
    .select()
    .from(kanbanBoards)
    .where(eq(kanbanBoards.accountId, accountId))
    .orderBy(asc(kanbanBoards.id));
}

export async function getBoard(accountId: number, boardId: number) {
  const [board] = await db
    .select()
    .from(kanbanBoards)
    .where(
      and(eq(kanbanBoards.id, boardId), eq(kanbanBoards.accountId, accountId)),
    );
  return board ?? null;
}

export async function createBoard(accountId: number, name: string, description?: string) {
  const [board] = await db
    .insert(kanbanBoards)
    .values({ accountId, name, description })
    .returning();

  // Create default stages
  const defaultStages = [
    { name: "Backlog", color: "#6b7280", position: 0 },
    { name: "In Progress", color: "#3b82f6", position: 1 },
    { name: "Review", color: "#f59e0b", position: 2 },
    { name: "Done", color: "#10b981", position: 3 },
  ];

  await db.insert(kanbanStages).values(
    defaultStages.map((s) => ({
      boardId: board!.id,
      accountId,
      name: s.name,
      color: s.color,
      position: s.position,
    })),
  );

  return board!;
}

export async function updateBoard(
  accountId: number,
  boardId: number,
  data: { name?: string; description?: string; active?: boolean },
) {
  const [board] = await db
    .update(kanbanBoards)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(eq(kanbanBoards.id, boardId), eq(kanbanBoards.accountId, accountId)),
    )
    .returning();
  return board ?? null;
}

export async function deleteBoard(accountId: number, boardId: number) {
  await db
    .delete(kanbanBoards)
    .where(
      and(eq(kanbanBoards.id, boardId), eq(kanbanBoards.accountId, accountId)),
    );
}

// --------------- Stages ---------------

export async function listStages(accountId: number, boardId: number) {
  return db
    .select()
    .from(kanbanStages)
    .where(
      and(
        eq(kanbanStages.boardId, boardId),
        eq(kanbanStages.accountId, accountId),
      ),
    )
    .orderBy(asc(kanbanStages.position));
}

export async function createStage(params: {
  accountId: number;
  boardId: number;
  name: string;
  description?: string;
  color?: string;
  position: number;
  macroActions?: unknown[];
  macroConditions?: unknown[];
}) {
  const [stage] = await db
    .insert(kanbanStages)
    .values({
      accountId: params.accountId,
      boardId: params.boardId,
      name: params.name,
      description: params.description,
      color: params.color,
      position: params.position,
      macroActions: params.macroActions ?? [],
      macroConditions: params.macroConditions ?? [],
    })
    .returning();
  return stage!;
}

export async function updateStage(
  accountId: number,
  stageId: number,
  data: {
    name?: string;
    description?: string;
    color?: string;
    position?: number;
    macroActions?: unknown[];
    macroConditions?: unknown[];
  },
) {
  const [stage] = await db
    .update(kanbanStages)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(
        eq(kanbanStages.id, stageId),
        eq(kanbanStages.accountId, accountId),
      ),
    )
    .returning();
  return stage ?? null;
}

export async function deleteStage(accountId: number, stageId: number) {
  // Check if there are tickets in this stage
  const [ticketCount] = await db
    .select({ count: count() })
    .from(tickets)
    .where(eq(tickets.stageId, stageId));

  if (ticketCount && ticketCount.count > 0) {
    throw new Error("Cannot delete stage with tickets. Move tickets first.");
  }

  await db
    .delete(kanbanStages)
    .where(
      and(
        eq(kanbanStages.id, stageId),
        eq(kanbanStages.accountId, accountId),
      ),
    );
}

export async function reorderStages(
  accountId: number,
  boardId: number,
  stageIds: number[],
) {
  for (let i = 0; i < stageIds.length; i++) {
    await db
      .update(kanbanStages)
      .set({ position: i, updatedAt: new Date() })
      .where(
        and(
          eq(kanbanStages.id, stageIds[i]!),
          eq(kanbanStages.accountId, accountId),
          eq(kanbanStages.boardId, boardId),
        ),
      );
  }
}

// --------------- Tickets ---------------

export interface TicketWithRelations {
  id: number;
  title: string;
  description: string | null;
  priority: number | null;
  stageId: number;
  position: number;
  assignee: { id: number; name: string; avatarUrl: string | null } | null;
  conversationCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export async function listTicketsByBoard(
  accountId: number,
  boardId: number,
): Promise<Record<number, TicketWithRelations[]>> {
  const stages = await listStages(accountId, boardId);
  const stageIds = stages.map((s) => s.id);

  if (stageIds.length === 0) return {};

  const allTickets = await db
    .select({
      id: tickets.id,
      title: tickets.title,
      description: tickets.description,
      priority: tickets.priority,
      stageId: tickets.stageId,
      position: tickets.position,
      assigneeId: tickets.assigneeId,
      assigneeName: users.name,
      assigneeAvatar: users.avatarUrl,
      createdAt: tickets.createdAt,
      updatedAt: tickets.updatedAt,
    })
    .from(tickets)
    .leftJoin(users, eq(tickets.assigneeId, users.id))
    .where(
      and(
        eq(tickets.accountId, accountId),
        inArray(tickets.stageId, stageIds),
      ),
    )
    .orderBy(asc(tickets.position));

  // Get conversation counts for all tickets
  const ticketIds = allTickets.map((t) => t.id);
  let convCounts: Record<number, number> = {};

  if (ticketIds.length > 0) {
    const counts = await db
      .select({
        ticketId: ticketConversations.ticketId,
        count: count(),
      })
      .from(ticketConversations)
      .where(inArray(ticketConversations.ticketId, ticketIds))
      .groupBy(ticketConversations.ticketId);

    convCounts = Object.fromEntries(counts.map((c) => [c.ticketId, c.count]));
  }

  const grouped: Record<number, TicketWithRelations[]> = {};
  for (const stageId of stageIds) {
    grouped[stageId] = [];
  }

  for (const t of allTickets) {
    const ticket: TicketWithRelations = {
      id: t.id,
      title: t.title,
      description: t.description,
      priority: t.priority,
      stageId: t.stageId,
      position: t.position,
      assignee: t.assigneeId
        ? { id: t.assigneeId, name: t.assigneeName!, avatarUrl: t.assigneeAvatar }
        : null,
      conversationCount: convCounts[t.id] ?? 0,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    };
    grouped[t.stageId]?.push(ticket);
  }

  return grouped;
}

export async function getTicket(accountId: number, ticketId: number) {
  const [ticket] = await db
    .select()
    .from(tickets)
    .where(and(eq(tickets.id, ticketId), eq(tickets.accountId, accountId)));
  return ticket ?? null;
}

export async function createTicket(params: {
  accountId: number;
  stageId: number;
  title: string;
  description?: string;
  priority?: number;
  assigneeId?: number;
  createdById: number;
}) {
  // Get max position in this stage
  const [maxPos] = await db
    .select({ max: sql<number>`COALESCE(MAX(${tickets.position}), -1)` })
    .from(tickets)
    .where(eq(tickets.stageId, params.stageId));

  const [ticket] = await db
    .insert(tickets)
    .values({
      accountId: params.accountId,
      stageId: params.stageId,
      title: params.title,
      description: params.description,
      priority: params.priority ?? 0,
      assigneeId: params.assigneeId,
      createdById: params.createdById,
      position: (maxPos?.max ?? -1) + 1,
    })
    .returning();

  return ticket!;
}

export async function updateTicket(
  accountId: number,
  ticketId: number,
  data: {
    title?: string;
    description?: string;
    priority?: number;
    assigneeId?: number | null;
  },
) {
  const [ticket] = await db
    .update(tickets)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(tickets.id, ticketId), eq(tickets.accountId, accountId)))
    .returning();
  return ticket ?? null;
}

export async function deleteTicket(accountId: number, ticketId: number) {
  await db
    .delete(tickets)
    .where(and(eq(tickets.id, ticketId), eq(tickets.accountId, accountId)));
}

export async function moveTicket(
  accountId: number,
  ticketId: number,
  newStageId: number,
  newPosition: number,
) {
  const ticket = await getTicket(accountId, ticketId);
  if (!ticket) throw new Error("Ticket not found");

  const oldStageId = ticket.stageId;

  // Update ticket stage and position
  await db
    .update(tickets)
    .set({ stageId: newStageId, position: newPosition, updatedAt: new Date() })
    .where(and(eq(tickets.id, ticketId), eq(tickets.accountId, accountId)));

  // If stage changed, execute stage macro on associated conversations
  if (oldStageId !== newStageId) {
    await executeStagesMacro(accountId, ticketId, newStageId);
  }
}

async function executeStagesMacro(
  accountId: number,
  ticketId: number,
  stageId: number,
) {
  const [stage] = await db
    .select()
    .from(kanbanStages)
    .where(
      and(eq(kanbanStages.id, stageId), eq(kanbanStages.accountId, accountId)),
    );

  if (!stage) return;

  const macroActions = (stage.macroActions ?? []) as Array<{
    type: string;
    params: Record<string, unknown>;
  }>;
  const macroConditions = (stage.macroConditions ?? []) as Array<{
    attribute: string;
    operator: string;
    value: unknown;
  }>;

  if (macroActions.length === 0) return;

  // Get all conversations linked to this ticket
  const linkedConvs = await db
    .select({ conversationId: ticketConversations.conversationId })
    .from(ticketConversations)
    .where(eq(ticketConversations.ticketId, ticketId));

  if (linkedConvs.length === 0) return;

  const {
    updateConversationStatus,
    assignConversation,
  } = await import("./conversation.service");
  const { addLabelToConversation } = await import("./label.service");

  for (const { conversationId } of linkedConvs) {
    // Check conditions if any
    if (macroConditions.length > 0) {
      const shouldApply = await evaluateConditions(
        accountId,
        conversationId,
        macroConditions,
      );
      if (!shouldApply) continue;
    }

    // Execute actions
    for (const action of macroActions) {
      switch (action.type) {
        case "assign_agent":
          if (action.params.agentId) {
            await assignConversation(
              accountId,
              conversationId,
              action.params.agentId as number,
            );
          }
          break;
        case "resolve":
          await updateConversationStatus(accountId, conversationId, 1);
          break;
        case "reopen":
          await updateConversationStatus(accountId, conversationId, 0);
          break;
        case "add_label":
          if (action.params.labelId) {
            await addLabelToConversation(
              accountId,
              conversationId,
              action.params.labelId as number,
            );
          }
          break;
        case "snooze":
          await updateConversationStatus(accountId, conversationId, 3);
          break;
        case "pending":
          await updateConversationStatus(accountId, conversationId, 2);
          break;
      }
    }
  }
}

async function evaluateConditions(
  accountId: number,
  conversationId: number,
  conditions: Array<{ attribute: string; operator: string; value: unknown }>,
): Promise<boolean> {
  const [conv] = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.accountId, accountId),
      ),
    );

  if (!conv) return false;

  for (const condition of conditions) {
    const actual = (conv as Record<string, unknown>)[condition.attribute];

    switch (condition.operator) {
      case "equal":
        if (actual !== condition.value) return false;
        break;
      case "not_equal":
        if (actual === condition.value) return false;
        break;
      case "contains":
        if (
          typeof actual === "string" &&
          !actual.includes(String(condition.value))
        )
          return false;
        break;
      case "is_present":
        if (actual === null || actual === undefined) return false;
        break;
      case "is_not_present":
        if (actual !== null && actual !== undefined) return false;
        break;
    }
  }

  return true;
}

// --------------- Ticket-Conversation linking ---------------

export async function getTicketConversations(
  accountId: number,
  ticketId: number,
) {
  return db
    .select({
      id: conversations.id,
      displayId: conversations.displayId,
      status: conversations.status,
      contactName: contacts.name,
      contactEmail: contacts.email,
      createdAt: conversations.createdAt,
      lastActivityAt: conversations.lastActivityAt,
    })
    .from(ticketConversations)
    .innerJoin(
      conversations,
      eq(ticketConversations.conversationId, conversations.id),
    )
    .innerJoin(contacts, eq(conversations.contactId, contacts.id))
    .where(eq(ticketConversations.ticketId, ticketId))
    .orderBy(desc(conversations.lastActivityAt));
}

export async function linkConversation(
  ticketId: number,
  conversationId: number,
) {
  await db
    .insert(ticketConversations)
    .values({ ticketId, conversationId })
    .onConflictDoNothing();
}

export async function unlinkConversation(
  ticketId: number,
  conversationId: number,
) {
  await db
    .delete(ticketConversations)
    .where(
      and(
        eq(ticketConversations.ticketId, ticketId),
        eq(ticketConversations.conversationId, conversationId),
      ),
    );
}

// Also execute macros on all tickets in a stage (bulk)
export async function executeStageMacroOnAll(
  accountId: number,
  stageId: number,
) {
  const stageTickets = await db
    .select({ id: tickets.id })
    .from(tickets)
    .where(and(eq(tickets.stageId, stageId), eq(tickets.accountId, accountId)));

  for (const t of stageTickets) {
    await executeStagesMacro(accountId, t.id, stageId);
  }
}
