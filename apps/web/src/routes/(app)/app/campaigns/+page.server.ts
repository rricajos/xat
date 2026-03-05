import type { PageServerLoad, Actions } from "./$types";
import { fail } from "@sveltejs/kit";
import {
  listCampaigns,
  createCampaign,
  deleteCampaign,
} from "$lib/server/services/campaign.service";

export const load: PageServerLoad = async ({ locals }) => {
  const allCampaigns = await listCampaigns(locals.account!.id);
  return { campaigns: allCampaigns };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const formData = await request.formData();
    const title = formData.get("title") as string;
    const message = formData.get("message") as string;
    const campaignType = formData.get("campaignType") as string;

    if (!title?.trim() || !message?.trim()) {
      return fail(400, { error: "Title and message are required" });
    }

    await createCampaign({
      accountId: locals.account!.id,
      title: title.trim(),
      message: message.trim(),
      campaignType: campaignType || "ongoing",
    });

    return { success: true };
  },

  delete: async ({ request, locals }) => {
    const formData = await request.formData();
    const campaignId = parseInt(formData.get("campaignId") as string);
    await deleteCampaign(locals.account!.id, campaignId);
    return { success: true };
  },
};
