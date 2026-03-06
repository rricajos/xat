import { json } from "@sveltejs/kit";
import { requireAuth, errorResponse } from "$lib/server/api-auth";
import { db } from "@xat/db";
import { notificationPreferences } from "@xat/db/schema";
import { eq } from "drizzle-orm";
import type { RequestHandler } from "./$types";

export const NOTIFICATION_TYPES = [
  "conversation_creation",
  "conversation_assignment",
  "conversation_mention",
  "message_created",
  "conversation_resolved",
  "participant_added",
] as const;

// GET — fetch current user's preferences
export const GET: RequestHandler = async (event) => {
  const { user } = requireAuth(event);

  const existing = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, user.id));

  // Merge with defaults for any missing types
  const result = NOTIFICATION_TYPES.map((type) => {
    const pref = existing.find((p) => p.notificationType === type);
    return {
      notificationType: type,
      emailEnabled: pref?.emailEnabled ?? true,
      pushEnabled: pref?.pushEnabled ?? true,
      webEnabled: pref?.webEnabled ?? true,
    };
  });

  return json({ data: result });
};

// PATCH — update preferences
export const PATCH: RequestHandler = async (event) => {
  const { user, account } = requireAuth(event);
  const body = await event.request.json().catch(() => ({}));

  // body: { preferences: [{ notificationType, emailEnabled, pushEnabled, webEnabled }] }
  const prefs: Array<{
    notificationType: string;
    emailEnabled: boolean;
    pushEnabled: boolean;
    webEnabled: boolean;
  }> = Array.isArray(body.preferences) ? body.preferences : [];

  if (prefs.length === 0) return errorResponse("preferences array is required", 400);

  for (const pref of prefs) {
    if (!NOTIFICATION_TYPES.includes(pref.notificationType as typeof NOTIFICATION_TYPES[number])) continue;

    await db
      .insert(notificationPreferences)
      .values({
        accountId: account.id,
        userId: user.id,
        notificationType: pref.notificationType,
        emailEnabled: pref.emailEnabled ?? true,
        pushEnabled: pref.pushEnabled ?? true,
        webEnabled: pref.webEnabled ?? true,
      })
      .onConflictDoUpdate({
        target: [notificationPreferences.userId, notificationPreferences.notificationType],
        set: {
          emailEnabled: pref.emailEnabled ?? true,
          pushEnabled: pref.pushEnabled ?? true,
          webEnabled: pref.webEnabled ?? true,
          updatedAt: new Date(),
        },
      });
  }

  return json({ data: { updated: prefs.length } });
};
