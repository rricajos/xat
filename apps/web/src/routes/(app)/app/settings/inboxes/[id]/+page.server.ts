import { error } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";
import { fail } from "@sveltejs/kit";
import { db } from "@xat/db";
import { inboxes, channelEmail } from "@xat/db/schema";
import { eq, and } from "drizzle-orm";

export const load: PageServerLoad = async ({ params, locals }) => {
  const inboxId = parseInt(params.id);
  if (isNaN(inboxId)) error(404, "Inbox not found");

  const [inbox] = await db
    .select()
    .from(inboxes)
    .where(
      and(eq(inboxes.id, inboxId), eq(inboxes.accountId, locals.account!.id)),
    )
    .limit(1);

  if (!inbox) error(404, "Inbox not found");

  let emailChannel = null;
  if (inbox.channelType === "Channel::Email" && inbox.channelId) {
    const [ch] = await db
      .select({ id: channelEmail.id, emailSignature: channelEmail.emailSignature })
      .from(channelEmail)
      .where(eq(channelEmail.id, inbox.channelId))
      .limit(1);
    emailChannel = ch ?? null;
  }

  return { inbox, emailChannel };
};

export const actions: Actions = {
  update: async ({ request, locals, params }) => {
    const inboxId = parseInt(params.id);
    const formData = await request.formData();

    const name = formData.get("name") as string;
    const greetingEnabled = formData.get("greetingEnabled") === "on";
    const greetingMessage = formData.get("greetingMessage") as string;
    const enableAutoAssignment = formData.get("enableAutoAssignment") === "on";
    const csatSurveyEnabled = formData.get("csatSurveyEnabled") === "on";
    const businessHoursEnabled = formData.get("businessHoursEnabled") === "on";
    const outOfOfficeMessage = formData.get("outOfOfficeMessage") as string;
    const businessHoursJson = formData.get("businessHours") as string;

    if (!name?.trim()) return fail(400, { error: "Name is required" });

    let settings: Record<string, unknown> = {};
    try {
      if (businessHoursJson) {
        settings = { businessHours: JSON.parse(businessHoursJson) };
      }
    } catch {
      return fail(400, { error: "Invalid business hours format" });
    }

    await db
      .update(inboxes)
      .set({
        name: name.trim(),
        greetingEnabled,
        greetingMessage: greetingMessage || null,
        enableAutoAssignment,
        csatSurveyEnabled,
        businessHoursEnabled,
        outOfOfficeMessage: outOfOfficeMessage || null,
        settings,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(inboxes.id, inboxId),
          eq(inboxes.accountId, locals.account!.id),
        ),
      );

    return { success: true };
  },

  updateSignature: async ({ request, locals, params }) => {
    const inboxId = parseInt(params.id);
    const formData = await request.formData();
    const emailSignature = (formData.get("emailSignature") as string ?? "").trim() || null;

    const [inbox] = await db
      .select({ channelId: inboxes.channelId })
      .from(inboxes)
      .where(and(eq(inboxes.id, inboxId), eq(inboxes.accountId, locals.account!.id)))
      .limit(1);

    if (!inbox?.channelId) return fail(404, { signatureError: "Email channel not found" });

    await db
      .update(channelEmail)
      .set({ emailSignature, updatedAt: new Date() })
      .where(eq(channelEmail.id, inbox.channelId));

    return { signatureSuccess: true };
  },
};
