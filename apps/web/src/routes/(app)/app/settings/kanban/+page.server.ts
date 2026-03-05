import type { PageServerLoad, Actions } from "./$types";
import { fail } from "@sveltejs/kit";
import {
  listBoards,
  listStages,
  createBoard,
  createStage,
  updateStage,
  deleteStage,
  reorderStages,
  updateBoard,
  deleteBoard,
} from "$lib/server/services/ticket.service";
import { db } from "@xat/db";
import {
  labels,
  users,
  accountUsers,
  macros,
  customAttributeDefinitions,
} from "@xat/db/schema";
import { eq, and, or } from "drizzle-orm";

export const load: PageServerLoad = async ({ locals, url }) => {
  const accountId = locals.account!.id;
  const userId = locals.user!.id;
  const boards = await listBoards(accountId);

  const boardIdParam = url.searchParams.get("board");
  const activeBoard = boardIdParam
    ? boards.find((b) => b.id === parseInt(boardIdParam))
    : boards[0];

  let stages: Awaited<ReturnType<typeof listStages>> = [];
  if (activeBoard) {
    stages = await listStages(accountId, activeBoard.id);
  }

  // Get labels, agents, macros and custom attributes for stage config
  const [accountLabels, agents, accountMacros, customAttributes] =
    await Promise.all([
      db
        .select({ id: labels.id, title: labels.title })
        .from(labels)
        .where(eq(labels.accountId, accountId))
        .orderBy(labels.title),
      db
        .select({ id: users.id, name: users.name })
        .from(users)
        .innerJoin(
          accountUsers,
          and(
            eq(accountUsers.userId, users.id),
            eq(accountUsers.accountId, accountId),
          ),
        )
        .orderBy(users.name),
      db
        .select({
          id: macros.id,
          name: macros.name,
          actions: macros.actions,
          visibility: macros.visibility,
        })
        .from(macros)
        .where(
          and(
            eq(macros.accountId, accountId),
            or(
              eq(macros.visibility, "global"),
              and(
                eq(macros.visibility, "personal"),
                eq(macros.createdById, userId),
              ),
            ),
          ),
        )
        .orderBy(macros.name),
      db
        .select({
          id: customAttributeDefinitions.id,
          displayName: customAttributeDefinitions.attributeDisplayName,
          key: customAttributeDefinitions.attributeKey,
          displayType: customAttributeDefinitions.attributeDisplayType,
          model: customAttributeDefinitions.attributeModel,
        })
        .from(customAttributeDefinitions)
        .where(eq(customAttributeDefinitions.accountId, accountId))
        .orderBy(customAttributeDefinitions.attributeDisplayName),
    ]);

  return {
    boards,
    activeBoard: activeBoard ?? null,
    stages,
    labels: accountLabels,
    agents,
    macros: accountMacros,
    customAttributes,
  };
};

export const actions: Actions = {
  createBoard: async ({ request, locals }) => {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    if (!name?.trim()) return fail(400, { error: "Name is required" });

    await createBoard(locals.account!.id, name.trim());
    return { success: true };
  },

  createStage: async ({ request, locals }) => {
    const accountId = locals.account!.id;
    const formData = await request.formData();
    const boardId = parseInt(formData.get("boardId") as string);
    const name = formData.get("name") as string;
    const description = (formData.get("description") as string) || undefined;
    const color = (formData.get("color") as string) || "#6b7280";
    const position = parseInt(
      (formData.get("position") as string) || "999",
    );

    if (!name?.trim()) return fail(400, { error: "Name is required" });
    if (isNaN(boardId)) return fail(400, { error: "Board is required" });

    await createStage({
      accountId,
      boardId,
      name: name.trim(),
      description,
      color,
      position,
    });

    return { success: true };
  },

  updateStage: async ({ request, locals }) => {
    const accountId = locals.account!.id;
    const formData = await request.formData();
    const stageId = parseInt(formData.get("stageId") as string);
    const name = formData.get("name") as string;
    const description = (formData.get("description") as string) || undefined;
    const color = (formData.get("color") as string) || "#6b7280";

    const macroActionsRaw = formData.get("macroActions") as string;
    const macroActions = macroActionsRaw ? JSON.parse(macroActionsRaw) : [];

    const macroConditionsRaw = formData.get("macroConditions") as string;
    const macroConditions = macroConditionsRaw
      ? JSON.parse(macroConditionsRaw)
      : [];

    if (!name?.trim()) return fail(400, { error: "Name is required" });

    await updateStage(accountId, stageId, {
      name: name.trim(),
      description,
      color,
      macroActions,
      macroConditions,
    });

    return { success: true };
  },

  deleteStage: async ({ request, locals }) => {
    const accountId = locals.account!.id;
    const formData = await request.formData();
    const stageId = parseInt(formData.get("stageId") as string);

    try {
      await deleteStage(accountId, stageId);
    } catch (e) {
      return fail(400, {
        error: e instanceof Error ? e.message : "Cannot delete stage",
      });
    }

    return { success: true };
  },

  reorderStages: async ({ request, locals }) => {
    const accountId = locals.account!.id;
    const formData = await request.formData();
    const boardId = parseInt(formData.get("boardId") as string);
    const stageIds = JSON.parse(
      formData.get("stageIds") as string,
    ) as number[];

    await reorderStages(accountId, boardId, stageIds);
    return { success: true };
  },

  updateBoard: async ({ request, locals }) => {
    const accountId = locals.account!.id;
    const formData = await request.formData();
    const boardId = parseInt(formData.get("boardId") as string);
    const name = formData.get("name") as string;
    const description =
      (formData.get("description") as string) || undefined;

    if (!name?.trim()) return fail(400, { error: "Name is required" });

    await updateBoard(accountId, boardId, {
      name: name.trim(),
      description,
    });

    return { success: true };
  },

  deleteBoard: async ({ request, locals }) => {
    const accountId = locals.account!.id;
    const formData = await request.formData();
    const boardId = parseInt(formData.get("boardId") as string);

    await deleteBoard(accountId, boardId);
    return { success: true, deleted: true };
  },
};
