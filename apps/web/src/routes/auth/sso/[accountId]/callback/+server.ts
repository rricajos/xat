import { json, redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { processSamlResponse } from "$lib/server/services/sso.service";
import { createSession, setSessionCookie } from "$lib/server/auth";

export const POST: RequestHandler = async (event) => {
  const accountId = parseInt(event.params.accountId);
  const formData = await event.request.formData();
  const samlResponse = formData.get("SAMLResponse") as string | null;

  if (!samlResponse) {
    return json({ error: "Missing SAMLResponse" }, { status: 400 });
  }

  const result = await processSamlResponse(accountId, samlResponse);

  if (!result) {
    return json({ error: "SSO authentication failed" }, { status: 401 });
  }

  // Create session
  const session = await createSession(
    result.userId,
    accountId,
    event.request.headers.get("x-forwarded-for") ?? event.getClientAddress(),
    event.request.headers.get("user-agent") ?? "",
  );

  setSessionCookie(event.cookies, session.id);

  redirect(302, "/app");
};
