import { db } from "@xat/db";
import { cannedResponses } from "@xat/db/schema";
import { eq, and, ilike } from "drizzle-orm";

export async function listCannedResponses(
  accountId: number,
  search?: string,
) {
  const conditions = [eq(cannedResponses.accountId, accountId)];

  if (search) {
    conditions.push(ilike(cannedResponses.shortCode, `%${search}%`));
  }

  return db
    .select()
    .from(cannedResponses)
    .where(and(...conditions))
    .orderBy(cannedResponses.shortCode);
}

export async function createCannedResponse(params: {
  accountId: number;
  shortCode: string;
  content: string;
}) {
  const [response] = await db
    .insert(cannedResponses)
    .values({
      accountId: params.accountId,
      shortCode: params.shortCode,
      content: params.content,
    })
    .returning();

  return response;
}

export async function updateCannedResponse(
  accountId: number,
  id: number,
  data: { shortCode?: string; content?: string },
) {
  const [updated] = await db
    .update(cannedResponses)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(eq(cannedResponses.id, id), eq(cannedResponses.accountId, accountId)),
    )
    .returning();

  return updated;
}

export async function deleteCannedResponse(accountId: number, id: number) {
  await db
    .delete(cannedResponses)
    .where(
      and(eq(cannedResponses.id, id), eq(cannedResponses.accountId, accountId)),
    );
}
