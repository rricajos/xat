import { redirect, error } from "@sveltejs/kit";
import { requireAuth } from "$lib/server/api-auth.js";
import { saveExternalConnection } from "$lib/server/services/calendar.service.js";
import { env } from "$lib/server/env.js";

export async function GET(event) {
  const { user, account } = requireAuth(event);
  const provider = event.params.provider.toUpperCase();
  const url = new URL(event.request.url);
  const code = url.searchParams.get("code");
  if (!code) error(400, { message: "Missing code" });

  const appUrl = env.PUBLIC_APP_URL;
  const callbackUrl = `${appUrl}/api/v1/calendar/external/${event.params.provider}/callback`;

  let tokenUrl = "";
  let clientId = "";
  let clientSecret = "";

  if (provider === "GOOGLE_CALENDAR" || provider === "GOOGLE_MEET") {
    tokenUrl = "https://oauth2.googleapis.com/token";
    clientId = env.GOOGLE_CLIENT_ID;
    clientSecret = env.GOOGLE_CLIENT_SECRET;
  } else if (provider === "OUTLOOK") {
    tokenUrl = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
    clientId = env.MICROSOFT_CLIENT_ID;
    clientSecret = env.MICROSOFT_CLIENT_SECRET;
  } else if (provider === "ZOOM") {
    tokenUrl = "https://zoom.us/oauth/token";
    clientId = env.ZOOM_CLIENT_ID;
    clientSecret = env.ZOOM_CLIENT_SECRET;
  } else {
    error(400, { message: "Unknown provider" });
  }

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: callbackUrl,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) error(502, { message: "Token exchange failed" });

  const tokens = await res.json();
  const credentials = {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null,
    tokenType: tokens.token_type,
  };

  await saveExternalConnection(account.id, user.id, provider, credentials);

  redirect(302, "/app/calendar/integrations?connected=1");
}
