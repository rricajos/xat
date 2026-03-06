import { redirect, error } from "@sveltejs/kit";
import { requireAuth } from "$lib/server/api-auth.js";
import { env } from "$lib/server/env.js";

const PROVIDERS: Record<string, { authUrl: string; scopes: string }> = {
  GOOGLE_CALENDAR: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    scopes: "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly",
  },
  GOOGLE_MEET: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    scopes: "https://www.googleapis.com/auth/calendar.events",
  },
  OUTLOOK: {
    authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    scopes: "Calendars.ReadWrite offline_access",
  },
  ZOOM: {
    authUrl: "https://zoom.us/oauth/authorize",
    scopes: "meeting:write:admin user:read:admin",
  },
};

export async function GET(event) {
  requireAuth(event);
  const provider = event.params.provider.toUpperCase();
  const config = PROVIDERS[provider];
  if (!config) error(400, { message: "Unknown provider" });

  const appUrl = env.PUBLIC_APP_URL;
  const callbackUrl = `${appUrl}/api/v1/calendar/external/${event.params.provider}/callback`;

  let clientId = "";
  if (provider === "GOOGLE_CALENDAR" || provider === "GOOGLE_MEET") {
    clientId = env.GOOGLE_CLIENT_ID;
  } else if (provider === "OUTLOOK") {
    clientId = env.MICROSOFT_CLIENT_ID;
  } else if (provider === "ZOOM") {
    clientId = env.ZOOM_CLIENT_ID;
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    response_type: "code",
    scope: config.scopes,
    access_type: "offline",
    prompt: "consent",
  });

  redirect(302, `${config.authUrl}?${params}`);
}
