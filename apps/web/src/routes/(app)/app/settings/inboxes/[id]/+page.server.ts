import { error } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";
import { fail } from "@sveltejs/kit";
import { db } from "@xat/db";
import { inboxes } from "@xat/db/schema";
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

  return { inbox };
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
};
