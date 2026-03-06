import type { PageServerLoad, Actions } from "./$types";
import { fail } from "@sveltejs/kit";
import {
  createBoard,
  listStages,
  listTicketsByBoard,
  createTicket,
  moveTicket,
  deleteTicket,
} from "$lib/server/services/ticket.service";

export const load: PageServerLoad = async ({ locals, url, parent }) => {
  const accountId = locals.account!.id;
  const { boards } = await parent();

  const boardIdParam = url.searchParams.get("board");
  const activeBoard = boardIdParam
    ? boards.find((b) => b.id === parseInt(boardIdParam))
    : boards[0];

  let stages: Awaited<ReturnType<typeof listStages>> = [];
  let ticketsByStage: Awaited<ReturnType<typeof listTicketsByBoard>> = {};

  if (activeBoard) {
    [stages, ticketsByStage] = await Promise.all([
      listStages(accountId, activeBoard.id),
      listTicketsByBoard(accountId, activeBoard.id),
    ]);
  }

  return {
    boards,
    activeBoard: activeBoard ?? null,
    stages,
    ticketsByStage,
  };
};

export const actions: Actions = {
  createBoard: async ({ request, locals }) => {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    if (!name?.trim()) return fail(400, { error: "Name is required" });

    const board = await createBoard(locals.account!.id, name.trim());
    return { success: true, boardId: board.id };
  },

  createTicket: async ({ request, locals }) => {
    const formData = await request.formData();
    const title = formData.get("title") as string;
    const stageId = parseInt(formData.get("stageId") as string);
    const description = (formData.get("description") as string) || undefined;
    const priority = parseInt((formData.get("priority") as string) || "0");

    if (!title?.trim()) return fail(400, { error: "Title is required" });
    if (isNaN(stageId)) return fail(400, { error: "Stage is required" });

    await createTicket({
      accountId: locals.account!.id,
      stageId,
      title: title.trim(),
      description,
      priority,
      createdById: locals.user!.id,
    });

    return { success: true };
  },

  moveTicket: async ({ request, locals }) => {
    const formData = await request.formData();
    const ticketId = parseInt(formData.get("ticketId") as string);
    const newStageId = parseInt(formData.get("newStageId") as string);
    const newPosition = parseInt(formData.get("newPosition") as string) || 0;

    if (isNaN(ticketId) || isNaN(newStageId)) {
      return fail(400, { error: "Invalid parameters" });
    }

    await moveTicket(locals.account!.id, ticketId, newStageId, newPosition);
    return { success: true };
  },

  deleteTicket: async ({ request, locals }) => {
    const formData = await request.formData();
    const ticketId = parseInt(formData.get("ticketId") as string);
    if (isNaN(ticketId)) return fail(400, { error: "Invalid ticket" });

    await deleteTicket(locals.account!.id, ticketId);
    return { success: true };
  },
};
