import type { PageServerLoad, Actions } from "./$types";
import { fail } from "@sveltejs/kit";
import {
  listAgents,
  inviteAgent,
  removeAgent,
} from "$lib/server/services/agent.service";

export const load: PageServerLoad = async ({ locals }) => {
  const agents = await listAgents(locals.account!.id);
  return { agents };
};

export const actions: Actions = {
  invite: async ({ request, locals }) => {
    const formData = await request.formData();
    const email = formData.get("email") as string;
    const name = formData.get("name") as string;
    const role = formData.get("role") as string;

    if (!email?.trim() || !name?.trim()) {
      return fail(400, { error: "Email and name are required" });
    }

    await inviteAgent({
      accountId: locals.account!.id,
      email: email.trim(),
      name: name.trim(),
      role: role || "agent",
    });

    return { success: true };
  },

  remove: async ({ request, locals }) => {
    const formData = await request.formData();
    const userId = parseInt(formData.get("userId") as string);

    if (userId === locals.user!.id) {
      return fail(400, { error: "You cannot remove yourself" });
    }

    await removeAgent(locals.account!.id, userId);
    return { success: true };
  },
};
