import { db } from "@xat/db";
import { automationRules } from "@xat/db/schema";
import { eq, and } from "drizzle-orm";

export interface AutomationCondition {
  attribute: string;
  operator: "equal_to" | "not_equal_to" | "contains" | "does_not_contain";
  values: string[];
}

export interface AutomationAction {
  actionName: string;
  actionParams: string[];
}

export interface AutomationEvent {
  eventName: string;
  accountId: number;
  conversationId?: number;
  messageId?: number;
  data: Record<string, unknown>;
}

export async function listAutomationRules(accountId: number) {
  return db
    .select()
    .from(automationRules)
    .where(eq(automationRules.accountId, accountId))
    .orderBy(automationRules.name);
}

export async function createAutomationRule(params: {
  accountId: number;
  name: string;
  description?: string;
  eventName: string;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
}) {
  const [rule] = await db
    .insert(automationRules)
    .values({
      accountId: params.accountId,
      name: params.name,
      description: params.description,
      eventName: params.eventName,
      conditions: params.conditions,
      actions: params.actions,
    })
    .returning();

  return rule;
}

export async function updateAutomationRule(
  accountId: number,
  ruleId: number,
  data: {
    name?: string;
    description?: string;
    eventName?: string;
    conditions?: AutomationCondition[];
    actions?: AutomationAction[];
    active?: boolean;
  },
) {
  const [updated] = await db
    .update(automationRules)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(
        eq(automationRules.id, ruleId),
        eq(automationRules.accountId, accountId),
      ),
    )
    .returning();

  return updated;
}

export async function deleteAutomationRule(
  accountId: number,
  ruleId: number,
) {
  await db
    .delete(automationRules)
    .where(
      and(
        eq(automationRules.id, ruleId),
        eq(automationRules.accountId, accountId),
      ),
    );
}

export async function evaluateAutomation(event: AutomationEvent) {
  const rules = await db
    .select()
    .from(automationRules)
    .where(
      and(
        eq(automationRules.accountId, event.accountId),
        eq(automationRules.eventName, event.eventName),
        eq(automationRules.active, true),
      ),
    );

  for (const rule of rules) {
    const conditions = rule.conditions as AutomationCondition[];
    const actions = rule.actions as AutomationAction[];

    if (matchesConditions(conditions, event.data)) {
      await executeActions(actions, event);
    }
  }
}

function matchesConditions(
  conditions: AutomationCondition[],
  data: Record<string, unknown>,
): boolean {
  return conditions.every((condition) => {
    const value = String(data[condition.attribute] ?? "");

    switch (condition.operator) {
      case "equal_to":
        return condition.values.includes(value);
      case "not_equal_to":
        return !condition.values.includes(value);
      case "contains":
        return condition.values.some((v) =>
          value.toLowerCase().includes(v.toLowerCase()),
        );
      case "does_not_contain":
        return !condition.values.some((v) =>
          value.toLowerCase().includes(v.toLowerCase()),
        );
      default:
        return false;
    }
  });
}

async function executeActions(
  actions: AutomationAction[],
  event: AutomationEvent,
) {
  for (const action of actions) {
    switch (action.actionName) {
      case "assign_agent":
        if (event.conversationId && action.actionParams[0]) {
          const { assignConversation } = await import(
            "./conversation.service.js"
          );
          await assignConversation(
            event.accountId,
            event.conversationId,
            parseInt(action.actionParams[0]),
          );
        }
        break;

      case "assign_team":
        if (event.conversationId && action.actionParams[0]) {
          const { conversations } = await import("@xat/db/schema");
          const { eq: eqOp } = await import("drizzle-orm");
          await db
            .update(conversations)
            .set({ teamId: parseInt(action.actionParams[0]), updatedAt: new Date() })
            .where(eqOp(conversations.id, event.conversationId));
        }
        break;

      case "add_label":
        if (event.conversationId && action.actionParams[0]) {
          const { addLabelToConversation } = await import(
            "./label.service.js"
          );
          await addLabelToConversation(
            event.accountId,
            event.conversationId,
            parseInt(action.actionParams[0]),
          );
        }
        break;

      case "resolve":
        if (event.conversationId) {
          const { updateConversationStatus } = await import(
            "./conversation.service.js"
          );
          await updateConversationStatus(
            event.accountId,
            event.conversationId,
            1,
          );
        }
        break;

      case "send_message":
        if (event.conversationId && action.actionParams[0]) {
          const { createMessage } = await import("./conversation.service.js");
          await createMessage({
            accountId: event.accountId,
            conversationId: event.conversationId,
            content: action.actionParams[0],
            messageType: 1,
            senderType: "Bot",
            senderId: null,
          });
        }
        break;

      case "send_email_to_team":
        if (action.actionParams[0]) {
          const { enqueueEmail } = await import("../jobs/queue.js");
          const { teamMembers } = await import("@xat/db/schema");
          const { eq: eqOp2 } = await import("drizzle-orm");
          const { users } = await import("@xat/db/schema");

          const members = await db
            .select({ email: users.email, name: users.name })
            .from(teamMembers)
            .innerJoin(users, eqOp2(teamMembers.userId, users.id))
            .where(eqOp2(teamMembers.teamId, parseInt(action.actionParams[0])));

          for (const member of members) {
            await enqueueEmail({
              type: "send_notification",
              to: member.email,
              subject: `[Xat] Automation notification`,
              body: `An automation rule was triggered for conversation #${event.conversationId}.`,
              accountId: event.accountId,
              conversationId: event.conversationId,
            });
          }
        }
        break;

      case "mute_conversation":
        if (event.conversationId) {
          const { conversations: convTable } = await import("@xat/db/schema");
          const { eq: eqOp3 } = await import("drizzle-orm");
          await db
            .update(convTable)
            .set({ muted: true, updatedAt: new Date() })
            .where(eqOp3(convTable.id, event.conversationId));
        }
        break;

      default:
        break;
    }
  }
}
