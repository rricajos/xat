import { error } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./$types";
import { fail } from "@sveltejs/kit";
import { updateAutomationRule } from "$lib/server/services/automation.service";
import { listAgents } from "$lib/server/services/agent.service";
import { listTeams } from "$lib/server/services/team.service";
import { db } from "@xat/db";
import { automationRules, labels, inboxes } from "@xat/db/schema";
import { eq, and } from "drizzle-orm";

export const load: PageServerLoad = async ({ params, locals }) => {
  const ruleId = parseInt(params.id);
  if (isNaN(ruleId)) error(404, "Rule not found");

  const [rule] = await db
    .select()
    .from(automationRules)
    .where(
      and(
        eq(automationRules.id, ruleId),
        eq(automationRules.accountId, locals.account!.id),
      ),
    )
    .limit(1);

  if (!rule) error(404, "Rule not found");

  const [agents, allTeams, allLabels, allInboxes] = await Promise.all([
    listAgents(locals.account!.id),
    listTeams(locals.account!.id),
    db
      .select({ id: labels.id, title: labels.title })
      .from(labels)
      .where(eq(labels.accountId, locals.account!.id))
      .orderBy(labels.title),
    db
      .select({ id: inboxes.id, name: inboxes.name })
      .from(inboxes)
      .where(eq(inboxes.accountId, locals.account!.id))
      .orderBy(inboxes.name),
  ]);

  return { rule, agents, teams: allTeams, labels: allLabels, inboxes: allInboxes };
};

export const actions: Actions = {
  save: async ({ request, locals, params }) => {
    const ruleId = parseInt(params.id);
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const eventName = formData.get("eventName") as string;
    const conditionsJson = formData.get("conditions") as string;
    const actionsJson = formData.get("actions") as string;

    if (!name?.trim() || !eventName) {
      return fail(400, { error: "Name and event are required" });
    }

    let conditions = [];
    let actions = [];
    try {
      conditions = JSON.parse(conditionsJson || "[]");
      actions = JSON.parse(actionsJson || "[]");
    } catch {
      return fail(400, { error: "Invalid conditions or actions format" });
    }

    await updateAutomationRule(locals.account!.id, ruleId, {
      name: name.trim(),
      description: description || undefined,
      eventName,
      conditions,
      actions,
    });

    return { success: true };
  },
};
