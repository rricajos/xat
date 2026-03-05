import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { requireAuth } from "$lib/server/api-auth";
import { listAuditLogs } from "$lib/server/services/audit-log.service";

export const GET: RequestHandler = async (event) => {
  const { account } = requireAuth(event);

  const page = parseInt(event.url.searchParams.get("page") ?? "1");
  const auditableType = event.url.searchParams.get("auditableType") ?? undefined;

  const { data, total } = await listAuditLogs(account.id, {
    page,
    auditableType,
    limit: 50,
  });

  return json({ data, meta: { total, page } });
};
