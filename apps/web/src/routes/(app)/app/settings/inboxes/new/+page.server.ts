import { fail, redirect } from "@sveltejs/kit";
import type { Actions } from "./$types";
import {
  createWebWidgetInbox,
  createEmailInbox,
  createWhatsAppInbox,
  createApiInbox,
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

    // Redirect to WhatsApp QR pairing page
    redirect(302, `/app/settings/inboxes/${result.inbox.id}/whatsapp`);
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
};
