import { error } from "@sveltejs/kit";
import { db } from "@xat/db";
import { teams, calendarEventTypes } from "@xat/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function load({ params }) {
  const [team] = await db
    .select()
    .from(teams)
    .where(sql`lower(${teams.name}) = lower(${params.teamSlug})`)
    .limit(1);

  if (!team) error(404, { message: "Team not found" });

  const eventTypes = await db
    .select()
    .from(calendarEventTypes)
    .where(
      and(
        eq(calendarEventTypes.teamId, team.id),
        eq(calendarEventTypes.scope, "TEAM"),
        eq(calendarEventTypes.isActive, true),
      ),
    );

  return { team, eventTypes, teamSlug: params.teamSlug };
}
