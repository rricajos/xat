import type { PageServerLoad } from "./$types";
import { listAuditLogs } from "$lib/server/services/audit-log.service";

export const load: PageServerLoad = async ({ locals, url }) => {
  const page = parseInt(url.searchParams.get("page") ?? "1");

  const { data: logs, total } = await listAuditLogs(locals.account!.id, {
    page,
    limit: 50,
  });

  return { logs, total, page };
};
