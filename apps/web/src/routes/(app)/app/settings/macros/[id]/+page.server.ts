import { error } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";
import { fail } from "@sveltejs/kit";
import { getMacro, updateMacro } from "$lib/server/services/macro.service";
import { listAgents } from "$lib/server/services/agent.service";
import { listTeams } from "$lib/server/services/team.service";
import { db } from "@xat/db";
import { labels } from "@xat/db/schema";
import { eq } from "drizzle-orm";

export const load: PageServerLoad = async ({ params, locals }) => {
  const macroId = parseInt(params.id);
  if (isNaN(macroId)) error(404, "Macro not found");

  const macro = await getMacro(locals.account!.id, macroId);
  if (!macro) error(404, "Macro not found");

  const [agents, allTeams, allLabels] = await Promise.all([
    listAgents(locals.account!.id),
    listTeams(locals.account!.id),
    db
      .select({ id: labels.id, title: labels.title })
      .from(labels)
      .where(eq(labels.accountId, locals.account!.id))
      .orderBy(labels.title),
  ]);

  return { macro, agents, teams: allTeams, labels: allLabels };
};

export const actions: Actions = {
  save: async ({ request, locals, params }) => {
    const macroId = parseInt(params.id);
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const visibility = formData.get("visibility") as string;
    const actionsJson = formData.get("actions") as string;

    if (!name?.trim()) return fail(400, { error: "Name is required" });

    let macroActions = [];
    try {
      macroActions = JSON.parse(actionsJson || "[]");
    } catch {
      return fail(400, { error: "Invalid actions format" });
    }

    await updateMacro(locals.account!.id, macroId, {
      name: name.trim(),
      visibility: visibility || "personal",
      actions: macroActions,
    });

    return { success: true };
  },
};
