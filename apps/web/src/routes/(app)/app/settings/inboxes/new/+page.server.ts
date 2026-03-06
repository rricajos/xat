import { fail, redirect } from "@sveltejs/kit";
import type { Actions } from "./$types";
import {
  createWebWidgetInbox,
  createEmailInbox,
  createWhatsAppInbox,
  createTelegramInbox,
  createApiInbox,
  createInstagramInbox,
  createTwitterInbox,
  createLineInbox,
  createSmsInbox,
} from "$lib/server/services/inbox.service";

export const actions: Actions = {
  createWebWidget: async ({ request, locals }) => {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    if (!name?.trim()) return fail(400, { error: "Name is required" });

    await createWebWidgetInbox({
      accountId: locals.account!.id,
      name: name.trim(),
      websiteUrl: (formData.get("websiteUrl") as string) || undefined,
      welcomeTitle: (formData.get("welcomeTitle") as string) || undefined,
      welcomeTagline: (formData.get("welcomeTagline") as string) || undefined,
      widgetColor: (formData.get("widgetColor") as string) || undefined,
    });

    redirect(302, "/app/settings/inboxes");
  },

  createEmail: async ({ request, locals }) => {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    if (!name?.trim()) return fail(400, { error: "Name is required" });
    if (!email?.trim()) return fail(400, { error: "Email is required" });

    await createEmailInbox({
      accountId: locals.account!.id,
      name: name.trim(),
      email: email.trim(),
      imapEnabled: !!(formData.get("imapAddress") as string),
      imapAddress: (formData.get("imapAddress") as string) || undefined,
      imapPort: formData.get("imapPort") ? parseInt(formData.get("imapPort") as string) : undefined,
      imapLogin: (formData.get("imapLogin") as string) || undefined,
      imapPassword: (formData.get("imapPassword") as string) || undefined,
      smtpEnabled: !!(formData.get("smtpAddress") as string),
      smtpAddress: (formData.get("smtpAddress") as string) || undefined,
      smtpPort: formData.get("smtpPort") ? parseInt(formData.get("smtpPort") as string) : undefined,
      smtpLogin: (formData.get("smtpLogin") as string) || undefined,
      smtpPassword: (formData.get("smtpPassword") as string) || undefined,
    });

    redirect(302, "/app/settings/inboxes");
  },

  createWhatsApp: async ({ request, locals }) => {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    if (!name?.trim()) return fail(400, { error: "Name is required" });

    const result = await createWhatsAppInbox({
      accountId: locals.account!.id,
      name: name.trim(),
    });

    redirect(302, `/app/settings/inboxes/${result.inbox.id}/whatsapp`);
  },

  createTelegram: async ({ request, locals }) => {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const botToken = formData.get("botToken") as string;
    if (!name?.trim()) return fail(400, { error: "Name is required" });
    if (!botToken?.trim()) return fail(400, { error: "Bot Token is required" });

    await createTelegramInbox({
      accountId: locals.account!.id,
      name: name.trim(),
      botToken: botToken.trim(),
    });

    redirect(302, "/app/settings/inboxes");
  },

  createApi: async ({ request, locals }) => {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    if (!name?.trim()) return fail(400, { error: "Name is required" });

    await createApiInbox({
      accountId: locals.account!.id,
      name: name.trim(),
      webhookUrl: (formData.get("webhookUrl") as string) || undefined,
    });

    redirect(302, "/app/settings/inboxes");
  },

  createInstagram: async ({ request, locals }) => {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const pageId = formData.get("pageId") as string;
    const pageAccessToken = formData.get("pageAccessToken") as string;
    if (!name?.trim()) return fail(400, { error: "Name is required" });
    if (!pageId?.trim()) return fail(400, { error: "Page ID is required" });
    if (!pageAccessToken?.trim()) return fail(400, { error: "Page Access Token is required" });

    await createInstagramInbox({
      accountId: locals.account!.id,
      name: name.trim(),
      pageId: pageId.trim(),
      pageAccessToken: pageAccessToken.trim(),
      instagramId: (formData.get("instagramId") as string) || undefined,
    });

    redirect(302, "/app/settings/inboxes");
  },

  createTwitter: async ({ request, locals }) => {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const apiKey = formData.get("apiKey") as string;
    const apiSecret = formData.get("apiSecret") as string;
    const accessToken = formData.get("accessToken") as string;
    const accessTokenSecret = formData.get("accessTokenSecret") as string;
    if (!name?.trim()) return fail(400, { error: "Name is required" });
    if (!apiKey?.trim()) return fail(400, { error: "API Key is required" });
    if (!apiSecret?.trim()) return fail(400, { error: "API Secret is required" });
    if (!accessToken?.trim()) return fail(400, { error: "Access Token is required" });
    if (!accessTokenSecret?.trim()) return fail(400, { error: "Access Token Secret is required" });

    await createTwitterInbox({
      accountId: locals.account!.id,
      name: name.trim(),
      apiKey: apiKey.trim(),
      apiSecret: apiSecret.trim(),
      accessToken: accessToken.trim(),
      accessTokenSecret: accessTokenSecret.trim(),
      twitterAccountId: (formData.get("twitterAccountId") as string) || undefined,
    });

    redirect(302, "/app/settings/inboxes");
  },

  createLine: async ({ request, locals }) => {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const channelAccessToken = formData.get("channelAccessToken") as string;
    const channelSecret = formData.get("channelSecret") as string;
    if (!name?.trim()) return fail(400, { error: "Name is required" });
    if (!channelAccessToken?.trim()) return fail(400, { error: "Channel Access Token is required" });
    if (!channelSecret?.trim()) return fail(400, { error: "Channel Secret is required" });

    await createLineInbox({
      accountId: locals.account!.id,
      name: name.trim(),
      channelAccessToken: channelAccessToken.trim(),
      channelSecret: channelSecret.trim(),
      lineChannelId: (formData.get("lineChannelId") as string) || undefined,
    });

    redirect(302, "/app/settings/inboxes");
  },

  createSms: async ({ request, locals }) => {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const phoneNumber = formData.get("phoneNumber") as string;
    const accountSid = formData.get("accountSid") as string;
    const authToken = formData.get("authToken") as string;
    if (!name?.trim()) return fail(400, { error: "Name is required" });
    if (!phoneNumber?.trim()) return fail(400, { error: "Phone number is required" });
    if (!accountSid?.trim()) return fail(400, { error: "Account SID is required" });
    if (!authToken?.trim()) return fail(400, { error: "Auth Token is required" });

    await createSmsInbox({
      accountId: locals.account!.id,
      name: name.trim(),
      phoneNumber: phoneNumber.trim(),
      accountSid: accountSid.trim(),
      authToken: authToken.trim(),
    });

    redirect(302, "/app/settings/inboxes");
  },
};
