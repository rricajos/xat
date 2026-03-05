import { error } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";
import { fail } from "@sveltejs/kit";
import {
  getTeamMembers,
  addTeamMember,
  removeTeamMember,
  updateTeam,
} from "$lib/server/services/team.service";
import { listAgents } from "$lib/server/services/agent.service";
import { db } from "@xat/db";
import { teams } from "@xat/db/schema";
import { eq, and } from "drizzle-orm";

export const load: PageServerLoad = async ({ params, locals }) => {
  const teamId = parseInt(params.id);
  if (isNaN(teamId)) error(404, "Team not found");

  const [team] = await db
    .select()
    .from(teams)
    .where(
      and(eq(teams.id, teamId), eq(teams.accountId, locals.account!.id)),
    )
    .limit(1);

  if (!team) error(404, "Team not found");

  const [members, agents] = await Promise.all([
    getTeamMembers(teamId),
    listAgents(locals.account!.id),
  ]);

  const memberIds = new Set(members.map((m) => m.id));
  const availableAgents = agents.filter((a) => !memberIds.has(a.id));

  return { team, members, availableAgents };
};

export const actions: Actions = {
  update: async ({ request, locals, params }) => {
    const teamId = parseInt(params.id);
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const allowAutoAssign = formData.get("allowAutoAssign") === "on";

    if (!name?.trim()) return fail(400, { error: "Name is required" });

    await updateTeam(locals.account!.id, teamId, {
      name: name.trim(),
      description: description || undefined,
      allowAutoAssign,
    });

    return { success: true };
  },

  addMember: async ({ request, params }) => {
    const teamId = parseInt(params.id);
    const formData = await request.formData();
    const userId = parseInt(formData.get("userId") as string);

    if (isNaN(userId)) return fail(400, { error: "Invalid agent" });

    await addTeamMember(teamId, userId);
    return { success: true };
  },

  removeMember: async ({ request, params }) => {
    const teamId = parseInt(params.id);
    const formData = await request.formData();
    const userId = parseInt(formData.get("userId") as string);

    if (isNaN(userId)) return fail(400, { error: "Invalid agent" });

    await removeTeamMember(teamId, userId);
    return { success: true };
  },
};
