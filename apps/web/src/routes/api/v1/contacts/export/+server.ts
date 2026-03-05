import type { RequestHandler } from "./$types";
import { requireAuth } from "$lib/server/api-auth";
import { exportContactsCsv } from "$lib/server/services/contact-import-export.service";

export const GET: RequestHandler = async (event) => {
  const { account } = requireAuth(event);

  const csv = await exportContactsCsv(account.id);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="contacts-${Date.now()}.csv"`,
    },
  });
};
