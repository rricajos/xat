import { db } from "@xat/db";
import { campaigns } from "@xat/db/schema";
import { eq, and } from "drizzle-orm";

export async function listCampaigns(accountId: number) {
  return db
    .select()
    .from(campaigns)
    .where(eq(campaigns.accountId, accountId))
    .orderBy(campaigns.createdAt);
}

export async function createCampaign(params: {
  accountId: number;
  title: string;
  description?: string;
  message: string;
  campaignType: string;
  inboxId?: number;
  audience?: unknown[];
  triggerRules?: Record<string, unknown>;
  scheduledAt?: Date;
}) {
  const [campaign] = await db
    .insert(campaigns)
    .values({
      accountId: params.accountId,
      title: params.title,
      description: params.description,
      message: params.message,
      campaignType: params.campaignType,
      inboxId: params.inboxId,
      audience: params.audience ?? [],
      triggerRules: params.triggerRules ?? {},
      scheduledAt: params.scheduledAt,
    })
    .returning();

  return campaign;
}

export async function updateCampaign(
  accountId: number,
  campaignId: number,
  data: {
    title?: string;
    description?: string;
    message?: string;
    enabled?: boolean;
    audience?: unknown[];
    triggerRules?: Record<string, unknown>;
  },
) {
  const [updated] = await db
    .update(campaigns)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(eq(campaigns.id, campaignId), eq(campaigns.accountId, accountId)),
    )
    .returning();

  return updated;
}

export async function deleteCampaign(accountId: number, campaignId: number) {
  await db
    .delete(campaigns)
    .where(
      and(eq(campaigns.id, campaignId), eq(campaigns.accountId, accountId)),
    );
}
