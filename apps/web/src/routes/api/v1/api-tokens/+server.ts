import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { requireAuth } from "$lib/server/api-auth";
import {
  listApiTokens,
  createApiToken,
} from "$lib/server/services/api-token.service";

export const GET: RequestHandler = async (event) => {
  const { user, account } = requireAuth(event);
  const tokens = await listApiTokens(account.id, user.id);

  // Mask tokens for security (only show last 8 chars)
  const masked = tokens.map((t) => ({
    ...t,
    token: `xat_${"*".repeat(40)}${t.token.slice(-8)}`,
  }));

  return json({ data: masked });
};

export const POST: RequestHandler = async (event) => {
  const { user, account } = requireAuth(event);
  const body = await event.request.json();

  if (!body.label?.trim()) {
    return json({ error: "Label is required" }, { status: 400 });
  }

  const token = await createApiToken({
    accountId: account.id,
    userId: user.id,
    label: body.label.trim(),
    expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
  });

  // Return the full token only on creation
  return json({ data: token }, { status: 201 });
};
