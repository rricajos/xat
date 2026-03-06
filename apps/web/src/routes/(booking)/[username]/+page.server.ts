import { error, redirect } from "@sveltejs/kit";
import { db } from "@xat/db";
import { usernameRedirects } from "@xat/db/schema";
import { and, eq, gt } from "drizzle-orm";
import { getPublicAgentProfile } from "$lib/server/services/calendar.service.js";

const RESERVED = new Set([
  "app", "auth", "api", "super-admin", "event", "user", "team",
  "widget", "book", "static", "sw.js", "favicon.ico",
]);

export async function load({ params }) {
  if (RESERVED.has(params.username)) {
    error(404, { message: "Not found" });
  }

  const profile = await getPublicAgentProfile(params.username);

  if (!profile) {
    // Check if there is an active redirect from this old username
    const [redir] = await db
      .select({ newUsername: usernameRedirects.newUsername })
      .from(usernameRedirects)
      .where(
        and(
          eq(usernameRedirects.oldUsername, params.username),
          gt(usernameRedirects.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (redir) redirect(301, `/${redir.newUsername}`);
    error(404, { message: "User not found" });
  }

  return {
    agent: {
      name: profile.user.name,
      displayName: profile.user.displayName,
      avatarUrl: profile.user.avatarUrl,
      calendarUsername: profile.user.calendarUsername,
      jobTitle: ((profile.user.uiSettings as Record<string, unknown>)?.publicProfile as Record<string, string>)?.jobTitle ?? null,
      bio: ((profile.user.uiSettings as Record<string, unknown>)?.publicProfile as Record<string, string>)?.bio ?? null,
    },
    eventTypes: profile.eventTypes,
  };
}
