import { json, error } from "@sveltejs/kit";
import { getPublicAgentProfile } from "$lib/server/services/calendar.service.js";

export async function GET(event) {
  const { username } = event.params;
  const profile = await getPublicAgentProfile(username);
  if (!profile) error(404, { message: "User not found" });
  const { user, eventTypes } = profile;
  return json({
    data: {
      user: {
        name: user.name,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        calendarUsername: user.calendarUsername,
      },
      eventTypes,
    },
  });
}
