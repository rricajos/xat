import type { PageServerLoad } from "./$types";
import { listConversationsByStatus } from "$lib/server/services/conversation.service";

export const load: PageServerLoad = async ({ locals, url }) => {
  const inboxId = url.searchParams.get("inbox")
    ? parseInt(url.searchParams.get("inbox")!)
    : undefined;
  const assigneeId = url.searchParams.get("assignee")
    ? parseInt(url.searchParams.get("assignee")!)
    : undefined;

  const columns = await listConversationsByStatus(locals.account!.id, {
    inboxId,
    assigneeId,
    limit: 20,
  });

  return { columns };
};
