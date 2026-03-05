import { db } from "@xat/db";
import { labels, labelTaggings } from "@xat/db/schema";
import { eq, and } from "drizzle-orm";

export async function listLabels(accountId: number) {
  return db
    .select()
    .from(labels)
    .where(eq(labels.accountId, accountId))
    .orderBy(labels.title);
}

export async function createLabel(params: {
  accountId: number;
  title: string;
  description?: string;
  color?: string;
  showOnSidebar?: boolean;
}) {
  const [label] = await db
    .insert(labels)
    .values({
      accountId: params.accountId,
      title: params.title,
      description: params.description,
      color: params.color,
      showOnSidebar: params.showOnSidebar,
    })
    .returning();

  return label;
}

export async function updateLabel(
  accountId: number,
  labelId: number,
  data: {
    title?: string;
    description?: string;
    color?: string;
    showOnSidebar?: boolean;
  },
) {
  const [updated] = await db
    .update(labels)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(labels.id, labelId), eq(labels.accountId, accountId)))
    .returning();

  return updated;
}

export async function deleteLabel(accountId: number, labelId: number) {
  await db
    .delete(labels)
    .where(and(eq(labels.id, labelId), eq(labels.accountId, accountId)));
}

export async function addLabelToConversation(
  accountId: number,
  conversationId: number,
  labelId: number,
) {
  await db
    .insert(labelTaggings)
    .values({
      accountId,
      labelId,
      taggableType: "Conversation",
      taggableId: conversationId,
    })
    .onConflictDoNothing();
}

export async function removeLabelFromConversation(
  accountId: number,
  conversationId: number,
  labelId: number,
) {
  await db
    .delete(labelTaggings)
    .where(
      and(
        eq(labelTaggings.labelId, labelId),
        eq(labelTaggings.taggableType, "Conversation"),
        eq(labelTaggings.taggableId, conversationId),
      ),
    );
}

export async function getLabelsForConversation(
  accountId: number,
  conversationId: number,
) {
  const taggings = await db
    .select({
      labelId: labelTaggings.labelId,
      title: labels.title,
      color: labels.color,
    })
    .from(labelTaggings)
    .innerJoin(labels, eq(labelTaggings.labelId, labels.id))
    .where(
      and(
        eq(labelTaggings.accountId, accountId),
        eq(labelTaggings.taggableType, "Conversation"),
        eq(labelTaggings.taggableId, conversationId),
      ),
    );

  return taggings;
}
