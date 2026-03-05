import { db } from "@xat/db";
import { macros } from "@xat/db/schema";
import { eq, and, or } from "drizzle-orm";

export async function listMacros(accountId: number, userId: number) {
  return db
    .select()
    .from(macros)
    .where(
      and(
        eq(macros.accountId, accountId),
        or(
          eq(macros.visibility, "global"),
          and(eq(macros.visibility, "personal"), eq(macros.createdById, userId)),
        ),
      ),
    )
    .orderBy(macros.name);
}

export async function getMacro(accountId: number, macroId: number) {
  const [macro] = await db
    .select()
    .from(macros)
    .where(and(eq(macros.id, macroId), eq(macros.accountId, accountId)))
    .limit(1);
  return macro ?? null;
}

export async function createMacro(params: {
  accountId: number;
  name: string;
  visibility?: string;
  createdById: number;
  actions: unknown[];
}) {
  const [macro] = await db
    .insert(macros)
    .values({
      accountId: params.accountId,
      name: params.name,
      visibility: params.visibility ?? "personal",
      createdById: params.createdById,
      actions: params.actions,
    })
    .returning();
  return macro;
}

export async function updateMacro(
  accountId: number,
  macroId: number,
  data: { name?: string; visibility?: string; actions?: unknown[] },
) {
  const [updated] = await db
    .update(macros)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(macros.id, macroId), eq(macros.accountId, accountId)))
    .returning();
  return updated;
}

export async function deleteMacro(accountId: number, macroId: number) {
  await db
    .delete(macros)
    .where(and(eq(macros.id, macroId), eq(macros.accountId, accountId)));
}

export interface MacroAction {
  type: string;
  params: Record<string, unknown>;
}

/**
 * Execute a macro's actions on a conversation.
 * This is typically called from the conversation detail UI.
 */
export async function executeMacro(
  accountId: number,
  macroId: number,
  conversationId: number,
) {
  const macro = await getMacro(accountId, macroId);
  if (!macro) throw new Error("Macro not found");

  const actions = macro.actions as MacroAction[];

  // Import conversation service dynamically to avoid circular deps
  const {
    updateConversationStatus,
    assignConversation,
  } = await import("./conversation.service");
  const { addLabelToConversation } = await import("./label.service");

  for (const action of actions) {
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
      case "mute":
        // TODO: Implement mute functionality
        break;
      case "snooze":
        await updateConversationStatus(accountId, conversationId, 3);
        break;
    }
  }

  return { executed: actions.length };
}
