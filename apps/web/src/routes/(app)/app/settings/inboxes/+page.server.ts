import type { PageServerLoad } from "./$types";
import { listInboxes } from "$lib/server/services/inbox.service";

export const load: PageServerLoad = async ({ locals }) => {
  const allInboxes = await listInboxes(locals.account!.id);
  return { inboxes: allInboxes };
};
