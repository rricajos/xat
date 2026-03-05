import { db } from "@xat/db";
import { teams, teamMembers, users } from "@xat/db/schema";
import { eq, and } from "drizzle-orm";

export async function listTeams(accountId: number) {
  return db
    .select()
    .from(teams)
    .where(eq(teams.accountId, accountId))
    .orderBy(teams.name);
}

export async function createTeam(params: {
  accountId: number;
  name: string;
  description?: string;
  allowAutoAssign?: boolean;
}) {
  const [team] = await db
    .insert(teams)
    .values({
      accountId: params.accountId,
      name: params.name,
      description: params.description,
      allowAutoAssign: params.allowAutoAssign,
    })
    .returning();

  return team;
}

export async function updateTeam(
  accountId: number,
  teamId: number,
  data: { name?: string; description?: string; allowAutoAssign?: boolean },
) {
  const [updated] = await db
    .update(teams)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(teams.id, teamId), eq(teams.accountId, accountId)))
    .returning();

  return updated;
}

export async function deleteTeam(accountId: number, teamId: number) {
  await db
    .delete(teams)
    .where(and(eq(teams.id, teamId), eq(teams.accountId, accountId)));
}

export async function getTeamMembers(teamId: number) {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
      availability: users.availability,
    })
    .from(teamMembers)
    .innerJoin(users, eq(teamMembers.userId, users.id))
    .where(eq(teamMembers.teamId, teamId));
}

export async function addTeamMember(teamId: number, userId: number) {
  await db
    .insert(teamMembers)
    .values({ teamId, userId })
    .onConflictDoNothing();
}

export async function removeTeamMember(teamId: number, userId: number) {
  await db
    .delete(teamMembers)
    .where(
      and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)),
    );
}
