import type { PageServerLoad, Actions } from "./$types";
import { error, fail } from "@sveltejs/kit";
import {
  getTicket,
  updateTicket,
  deleteTicket,
  getTicketConversations,
  linkConversation,
  unlinkConversation,
  listStages,
  moveTicket,
} from "$lib/server/services/ticket.service";
import { db } from "@xat/db";
import {
  kanbanStages,
  conversations,
  contacts,
  users,
} from "@xat/db/schema";
import { eq, and, ilike, or } from "drizzle-orm";

export const load: PageServerLoad = async ({ params, locals }) => {
  const accountId = locals.account!.id;
  const ticketId = parseInt(params.ticketId);

  if (isNaN(ticketId)) error(404, "Invalid ticket");

  const ticket = await getTicket(accountId, ticketId);
  if (!ticket) error(404, "Ticket not found");

  // Get stage info
  const [stage] = await db
    .select()
    .from(kanbanStages)
    .where(eq(kanbanStages.id, ticket.stageId));

  // Get all stages for the board (for move dropdown)
  const boardStages = stage
    ? await listStages(accountId, stage.boardId)
    : [];

  // Get linked conversations
  const linkedConversations = await getTicketConversations(
    accountId,
    ticketId,
  );

  // Get assignee info
  let assignee = null;
  if (ticket.assigneeId) {
    const [a] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(eq(users.id, ticket.assigneeId));
    assignee = a ?? null;
  }

  // Get agents for assignment
  const { accountUsers: accountUsersTable } = await import("@xat/db/schema");
  const agents = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .innerJoin(
      accountUsersTable,
      and(
        eq(accountUsersTable.userId, users.id),
        eq(accountUsersTable.accountId, accountId),
      ),
    )
    .orderBy(users.name);

  return {
    ticket,
    stage,
    boardStages,
    linkedConversations,
    assignee,
    agents,
  };
};

export const actions: Actions = {
  update: async ({ request, params, locals }) => {
    const accountId = locals.account!.id;
    const ticketId = parseInt(params.ticketId);
    const formData = await request.formData();

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const priority = parseInt((formData.get("priority") as string) || "0");
    const assigneeIdStr = formData.get("assigneeId") as string;
    const assigneeId = assigneeIdStr ? parseInt(assigneeIdStr) : null;

    if (!title?.trim()) return fail(400, { error: "Title is required" });

    await updateTicket(accountId, ticketId, {
      title: title.trim(),
      description: description || undefined,
      priority,
      assigneeId,
    });

    return { success: true };
  },

  move: async ({ request, params, locals }) => {
    const accountId = locals.account!.id;
    const ticketId = parseInt(params.ticketId);
    const formData = await request.formData();
    const newStageId = parseInt(formData.get("stageId") as string);

    if (isNaN(newStageId)) return fail(400, { error: "Invalid stage" });

    await moveTicket(accountId, ticketId, newStageId, 0);
    return { success: true };
  },

  linkConversation: async ({ request, params, locals }) => {
    const ticketId = parseInt(params.ticketId);
    const formData = await request.formData();
    const conversationId = parseInt(
      formData.get("conversationId") as string,
    );

    if (isNaN(conversationId))
      return fail(400, { error: "Invalid conversation" });

    await linkConversation(ticketId, conversationId);
    return { success: true };
  },

  unlinkConversation: async ({ request, params }) => {
    const ticketId = parseInt(params.ticketId);
    const formData = await request.formData();
    const conversationId = parseInt(
      formData.get("conversationId") as string,
    );

    if (isNaN(conversationId))
      return fail(400, { error: "Invalid conversation" });

    await unlinkConversation(ticketId, conversationId);
    return { success: true };
  },

  delete: async ({ params, locals }) => {
    await deleteTicket(locals.account!.id, parseInt(params.ticketId));
    return { success: true, deleted: true };
  },

  searchConversations: async ({ request, locals }) => {
    const formData = await request.formData();
    const query = (formData.get("query") as string)?.trim();
    if (!query) return { conversations: [] };

    const results = await db
      .select({
        id: conversations.id,
        displayId: conversations.displayId,
        status: conversations.status,
        contactName: contacts.name,
        contactEmail: contacts.email,
      })
      .from(conversations)
      .innerJoin(contacts, eq(conversations.contactId, contacts.id))
      .where(
        and(
          eq(conversations.accountId, locals.account!.id),
          or(
            ilike(contacts.name, `%${query}%`),
            ilike(contacts.email, `%${query}%`),
          ),
        ),
      )
      .limit(10);

    return { conversations: results };
  },
};
