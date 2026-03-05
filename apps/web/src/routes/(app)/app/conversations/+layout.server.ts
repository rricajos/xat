import type { LayoutServerLoad } from "./$types";
import { listConversations } from "$lib/server/services/conversation.service";
import { listCustomFilters } from "$lib/server/services/custom-filter.service";
import { listCannedResponses } from "$lib/server/services/canned-response.service";

export const load: LayoutServerLoad = async ({ locals, url }) => {
  const status = parseInt(url.searchParams.get("status") ?? "0");
  const page = parseInt(url.searchParams.get("page") ?? "1");
  const inboxId = url.searchParams.get("inbox")
    ? parseInt(url.searchParams.get("inbox")!)
    : undefined;
  const assigneeParam = url.searchParams.get("assignee");

  const [result, customFilters, cannedResponses] = await Promise.all([
    listConversations(locals.account!.id, {
      status,
      page,
      limit: 25,
      inboxId,
      assigneeId: assigneeParam && assigneeParam !== "unassigned"
        ? parseInt(assigneeParam)
        : undefined,
    }),
    listCustomFilters(locals.account!.id, locals.user!.id, "conversation"),
    listCannedResponses(locals.account!.id),
  ]);

  return {
    conversations: result.data,
    total: result.total,
    currentStatus: status,
    currentPage: page,
    customFilters,
    cannedResponses,
  };
};
