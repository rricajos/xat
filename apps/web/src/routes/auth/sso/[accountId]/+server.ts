import { json, redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import {
  getSamlConfig,
  generateAuthnRequestUrl,
} from "$lib/server/services/sso.service";

export const GET: RequestHandler = async (event) => {
  const accountId = parseInt(event.params.accountId);

  const config = await getSamlConfig(accountId);
  if (!config) {
    return json({ error: "SSO not configured for this account" }, { status: 404 });
  }

  const callbackUrl = `${event.url.origin}/auth/sso/${accountId}/callback`;
  const ssoUrl = generateAuthnRequestUrl(config, callbackUrl);

  redirect(302, ssoUrl);
};
