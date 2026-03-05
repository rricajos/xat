import { error, fail } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";
import { db } from "@xat/db";
import { campaigns, inboxes, labels } from "@xat/db/schema";
import { eq, and } from "drizzle-orm";
import { updateCampaign } from "$lib/server/services/campaign.service";

export const load: PageServerLoad = async ({ params, locals }) => {
  const campaignId = parseInt(params.id);
  if (isNaN(campaignId)) error(404, "Campaign not found");

  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(
      and(
        eq(campaigns.id, campaignId),
        eq(campaigns.accountId, locals.account!.id),
      ),
    )
    .limit(1);

  if (!campaign) error(404, "Campaign not found");

  const [accountInboxes, accountLabels] = await Promise.all([
    db
      .select({ id: inboxes.id, name: inboxes.name, channelType: inboxes.channelType })
      .from(inboxes)
      .where(eq(inboxes.accountId, locals.account!.id)),
    db
      .select({ id: labels.id, title: labels.title })
      .from(labels)
      .where(eq(labels.accountId, locals.account!.id)),
  ]);

  return { campaign, inboxes: accountInboxes, labels: accountLabels };
};

export const actions: Actions = {
  save: async ({ request, locals, params }) => {
    const campaignId = parseInt(params.id);
    const formData = await request.formData();

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const message = formData.get("message") as string;
    const enabled = formData.get("enabled") === "on";
    const scheduledAt = formData.get("scheduledAt") as string;
    const audienceJson = formData.get("audience") as string;
    const triggerRulesJson = formData.get("triggerRules") as string;

    if (!title?.trim() || !message?.trim()) {
      return fail(400, { error: "Title and message are required" });
    }

    let audience: unknown[] = [];
    let triggerRules: Record<string, unknown> = {};
    try {
      audience = JSON.parse(audienceJson || "[]");
      triggerRules = JSON.parse(triggerRulesJson || "{}");
    } catch {
      return fail(400, { error: "Invalid audience or trigger rules format" });
    }

    await updateCampaign(locals.account!.id, campaignId, {
      title: title.trim(),
      description: description?.trim() || undefined,
      message: message.trim(),
      enabled,
      audience,
      triggerRules,
    });

    if (scheduledAt) {
      await db
        .update(campaigns)
        .set({ scheduledAt: new Date(scheduledAt), updatedAt: new Date() })
        .where(
          and(
            eq(campaigns.id, campaignId),
            eq(campaigns.accountId, locals.account!.id),
          ),
        );
    }

    return { success: true };
  },

  toggleEnabled: async ({ locals, params }) => {
    const campaignId = parseInt(params.id);
    const [campaign] = await db
      .select({ enabled: campaigns.enabled })
      .from(campaigns)
      .where(
        and(
          eq(campaigns.id, campaignId),
          eq(campaigns.accountId, locals.account!.id),
        ),
      )
      .limit(1);

    if (!campaign) error(404);

    await updateCampaign(locals.account!.id, campaignId, {
      enabled: !campaign.enabled,
    });

    return { success: true };
  },
};
