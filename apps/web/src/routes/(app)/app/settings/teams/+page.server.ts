import type { PageServerLoad, Actions } from "./$types";
import { fail } from "@sveltejs/kit";
import {
  listTeams,
  createTeam,
  deleteTeam,
} from "$lib/server/services/team.service";

export const load: PageServerLoad = async ({ locals }) => {
  const allTeams = await listTeams(locals.account!.id);
  return { teams: allTeams };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    if (!name?.trim()) return fail(400, { error: "Name is required" });

    await createTeam({
      accountId: locals.account!.id,
      name: name.trim(),
      description: description || undefined,
    });

    return { success: true };
  },

  delete: async ({ request, locals }) => {
    const formData = await request.formData();
    const teamId = parseInt(formData.get("teamId") as string);
    await deleteTeam(locals.account!.id, teamId);
    return { success: true };
  },
};
