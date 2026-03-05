import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { requireAuth, errorResponse } from "$lib/server/api-auth";
import { importContactsCsv } from "$lib/server/services/contact-import-export.service";

export const POST: RequestHandler = async (event) => {
  const { user, account } = requireAuth(event);

  const formData = await event.request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return errorResponse("No file provided", 400);
  }

  const csvContent = await file.text();
  const result = await importContactsCsv(account.id, csvContent);

  return json({ data: result });
};
