import { db } from "@xat/db";
import { conversationWorkflows } from "@xat/db/schema";
import { eq, and } from "drizzle-orm";

export interface RequiredAttribute {
  attributeKey: string;
  attributeType: "conversation" | "contact";
  required: boolean;
}

export async function listWorkflows(accountId: number) {
  return db
    .select()
    .from(conversationWorkflows)
    .where(eq(conversationWorkflows.accountId, accountId));
}

export async function getWorkflow(accountId: number, workflowId: number) {
  const [workflow] = await db
    .select()
    .from(conversationWorkflows)
    .where(
      and(
        eq(conversationWorkflows.id, workflowId),
        eq(conversationWorkflows.accountId, accountId),
      ),
    )
    .limit(1);

  return workflow ?? null;
}

export async function createWorkflow(params: {
  accountId: number;
  name: string;
  description?: string;
  triggerAction: string;
  requiredAttributes?: RequiredAttribute[];
  validationMessage?: string;
  inboxIds?: number[];
}) {
  const [workflow] = await db
    .insert(conversationWorkflows)
    .values({
      accountId: params.accountId,
      name: params.name,
      description: params.description,
      triggerAction: params.triggerAction,
      requiredAttributes: params.requiredAttributes ?? [],
      validationMessage: params.validationMessage,
      inboxIds: params.inboxIds ?? [],
    })
    .returning();

  return workflow;
}

export async function updateWorkflow(
  accountId: number,
  workflowId: number,
  params: {
    name?: string;
    description?: string;
    enabled?: boolean;
    triggerAction?: string;
    requiredAttributes?: RequiredAttribute[];
    validationMessage?: string;
    inboxIds?: number[];
  },
) {
  const [updated] = await db
    .update(conversationWorkflows)
    .set({ ...params, updatedAt: new Date() })
    .where(
      and(
        eq(conversationWorkflows.id, workflowId),
        eq(conversationWorkflows.accountId, accountId),
      ),
    )
    .returning();

  return updated;
}

export async function deleteWorkflow(accountId: number, workflowId: number) {
  await db
    .delete(conversationWorkflows)
    .where(
      and(
        eq(conversationWorkflows.id, workflowId),
        eq(conversationWorkflows.accountId, accountId),
      ),
    );
}

/**
 * Validates if a conversation meets the workflow requirements
 * before allowing a status change.
 */
export async function validateWorkflow(params: {
  accountId: number;
  inboxId: number;
  triggerAction: string;
  conversationAttributes: Record<string, unknown>;
  contactAttributes: Record<string, unknown>;
}): Promise<{ valid: boolean; missingAttributes: string[]; message?: string }> {
  const workflows = await db
    .select()
    .from(conversationWorkflows)
    .where(
      and(
        eq(conversationWorkflows.accountId, params.accountId),
        eq(conversationWorkflows.triggerAction, params.triggerAction),
        eq(conversationWorkflows.enabled, true),
      ),
    );

  const missing: string[] = [];
  let validationMessage: string | undefined;

  for (const workflow of workflows) {
    const inboxIds = workflow.inboxIds as number[];
    if (inboxIds.length > 0 && !inboxIds.includes(params.inboxId)) {
      continue;
    }

    const required = workflow.requiredAttributes as RequiredAttribute[];

    for (const attr of required) {
      if (!attr.required) continue;

      const source =
        attr.attributeType === "conversation"
          ? params.conversationAttributes
          : params.contactAttributes;

      const value = source[attr.attributeKey];
      if (value === undefined || value === null || value === "") {
        missing.push(attr.attributeKey);
        validationMessage =
          workflow.validationMessage ??
          `Required attribute "${attr.attributeKey}" is missing`;
      }
    }
  }

  return {
    valid: missing.length === 0,
    missingAttributes: missing,
    message: validationMessage,
  };
}
