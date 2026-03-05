import type { PageServerLoad, Actions } from "./$types";
import { fail } from "@sveltejs/kit";
import {
  listAutomationRules,
  createAutomationRule,
  deleteAutomationRule,
  updateAutomationRule,
} from "$lib/server/services/automation.service";

export const load: PageServerLoad = async ({ locals }) => {
  const rules = await listAutomationRules(locals.account!.id);
  return { automationRules: rules };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const eventName = formData.get("eventName") as string;

    if (!name?.trim() || !eventName) {
      return fail(400, { error: "Name and event are required" });
    }

    await createAutomationRule({
      accountId: locals.account!.id,
      name: name.trim(),
      eventName,
      conditions: [],
      actions: [],
    });

    return { success: true };
  },

  toggle: async ({ request, locals }) => {
    const formData = await request.formData();
    const ruleId = parseInt(formData.get("ruleId") as string);
    const active = formData.get("active") === "true";

    await updateAutomationRule(locals.account!.id, ruleId, {
      active: !active,
    });

    return { success: true };
  },

  delete: async ({ request, locals }) => {
    const formData = await request.formData();
    const ruleId = parseInt(formData.get("ruleId") as string);
    await deleteAutomationRule(locals.account!.id, ruleId);
    return { success: true };
  },
};
