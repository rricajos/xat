import type { PageServerLoad, Actions } from "./$types";
import { fail } from "@sveltejs/kit";
import { db } from "@xat/db";
import { users, calendarEventTypes, usernameRedirects } from "@xat/db/schema";
import { eq, and, ne } from "drizzle-orm";

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
      calendarUsername: users.calendarUsername,
    })
    .from(users)
    .where(eq(users.id, locals.user!.id))
    .limit(1);

  const eventTypes = await db
    .select({ id: calendarEventTypes.id, name: calendarEventTypes.name, slug: calendarEventTypes.slug, duration: calendarEventTypes.duration, locationType: calendarEventTypes.locationType })
    .from(calendarEventTypes)
    .where(and(eq(calendarEventTypes.accountId, locals.account!.id), eq(calendarEventTypes.userId, locals.user!.id), eq(calendarEventTypes.isActive, true)))
    .orderBy(calendarEventTypes.name);

  return { profile: user, eventTypes };
};

export const actions: Actions = {
  update: async ({ request, locals }) => {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const displayName = formData.get("displayName") as string;
    const availability = parseInt(formData.get("availability") as string);
    const jobTitle = (formData.get("jobTitle") as string ?? "").trim();
    const bio = (formData.get("bio") as string ?? "").trim();
    const ctaType = (formData.get("ctaType") as string ?? "").trim();
    const ctaValue = (formData.get("ctaValue") as string ?? "").trim();
    const ctaLabel = (formData.get("ctaLabel") as string ?? "").trim();

    if (!name?.trim()) return fail(400, { error: "Name is required" });

    const [user] = await db
      .select({ uiSettings: users.uiSettings })
      .from(users)
      .where(eq(users.id, locals.user!.id))
      .limit(1);

    const current = (user?.uiSettings ?? {}) as Record<string, unknown>;

    await db
      .update(users)
      .set({
        name: name.trim(),
        displayName: displayName?.trim() || null,
        availability,
        uiSettings: { ...current, publicProfile: { jobTitle, bio, ctaType, ctaValue, ctaLabel } },
        updatedAt: new Date(),
      })
      .where(eq(users.id, locals.user!.id));

    return { success: true };
  },

  updateCalendar: async ({ request, locals }) => {
    const formData = await request.formData();
    const raw = (formData.get("calendarUsername") as string ?? "").trim().toLowerCase();
    const keepRedirect = formData.get("keepRedirect") === "on";

    if (raw && !/^[a-z0-9-]{3,50}$/.test(raw)) {
      return fail(400, { calendarError: "Username must be 3-50 characters: lowercase letters, numbers and hyphens only." });
    }

    if (raw) {
      const [existing] = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.calendarUsername, raw), ne(users.id, locals.user!.id)))
        .limit(1);
      if (existing) return fail(400, { calendarError: "This username is already taken." });
    }

    // Get current username before changing it
    const [currentUser] = await db
      .select({ calendarUsername: users.calendarUsername })
      .from(users)
      .where(eq(users.id, locals.user!.id))
      .limit(1);

    const oldUsername = currentUser?.calendarUsername;

    await db
      .update(users)
      .set({ calendarUsername: raw || null, updatedAt: new Date() })
      .where(eq(users.id, locals.user!.id));

    // Create redirect from old username → new username if requested
    if (keepRedirect && oldUsername && raw && oldUsername !== raw) {
      const expiresAt = new Date(Date.now() + 99 * 24 * 60 * 60 * 1000);
      // Upsert: remove any existing redirect for this old username first
      await db.delete(usernameRedirects).where(eq(usernameRedirects.oldUsername, oldUsername));
      await db.insert(usernameRedirects).values({
        userId: locals.user!.id,
        oldUsername,
        newUsername: raw,
        expiresAt,
      });
    }

    return { calendarSuccess: true };
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
      .set({ uiSettings: { ...current, notifications }, updatedAt: new Date() })
      .where(eq(users.id, locals.user!.id));

    return { success: true };
  },
};
