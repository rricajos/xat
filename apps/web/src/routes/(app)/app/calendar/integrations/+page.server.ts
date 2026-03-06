import { getExternalConnections, generateIcalFeedToken } from "$lib/server/services/calendar.service.js";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user!;
  const account = locals.account!;

  const connections = await getExternalConnections(account.id, user.id);
  const icalToken = generateIcalFeedToken(user.id);
  const appUrl = process.env.PUBLIC_APP_URL ?? "";
  const icalUrl = `${appUrl}/api/v1/calendar/feed.ics?userId=${user.id}&token=${icalToken}`;

  return { connections, icalUrl };
};
