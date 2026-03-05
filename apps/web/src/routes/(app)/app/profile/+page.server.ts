import type { PageServerLoad, Actions } from "./$types";
import { fail } from "@sveltejs/kit";
import { db } from "@xat/db";
import { users } from "@xat/db/schema";
import { eq } from "drizzle-orm";

export const load: PageServerLoad = async ({ locals }) => {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      displayName: users.displayName,
      email: users.email,
      availability: users.availability,
      avatarUrl: users.avatarUrl,
      uiSettings: users.uiSettings,
    })
    .from(users)
    .where(eq(users.id, locals.user!.id))
    .limit(1);

  return { profile: user };
};

export const actions: Actions = {
  update: async ({ request, locals }) => {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const displayName = formData.get("displayName") as string;
    const availability = parseInt(formData.get("availability") as string);

    if (!name?.trim()) return fail(400, { error: "Name is required" });

    await db
      .update(users)
      .set({
        name: name.trim(),
        displayName: displayName?.trim() || null,
        availability,
        updatedAt: new Date(),
      })
      .where(eq(users.id, locals.user!.id));

    return { success: true };
  },

  updateNotifications: async ({ request, locals }) => {
    const formData = await request.formData();

    const [user] = await db
      .select({ uiSettings: users.uiSettings })
      .from(users)
      .where(eq(users.id, locals.user!.id))
      .limit(1);

    const current = (user?.uiSettings ?? {}) as Record<string, unknown>;

    const notifications = {
      emailOnNewConversation: formData.get("emailOnNewConversation") === "on",
      emailOnAssignment: formData.get("emailOnAssignment") === "on",
      emailOnMention: formData.get("emailOnMention") === "on",
      pushNotifications: formData.get("pushNotifications") === "on",
      audioAlerts: formData.get("audioAlerts") === "on",
    };

    await db
      .update(users)
      .set({
        uiSettings: { ...current, notifications },
        updatedAt: new Date(),
      })
      .where(eq(users.id, locals.user!.id));

    return { success: true };
  },
};
