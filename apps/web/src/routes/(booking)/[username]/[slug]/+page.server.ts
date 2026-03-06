import { error } from "@sveltejs/kit";
import { getPublicEventType, getAvailableSlots } from "$lib/server/services/calendar.service.js";

export async function load({ params, url }) {
  const result = await getPublicEventType({ slug: params.slug, username: params.username });
  if (!result) error(404, { message: "Event type not found" });

  const { eventType, agent } = result as {
    eventType: {
      id: number; name: string; description: string | null; duration: number;
      locationType: string; color: string | null; settings: unknown;
      slug: string; scope: string;
    };
    agent: { id: number; name: string; displayName: string | null; avatarUrl: string | null; calendarUsername: string | null };
  };

  const dateParam = url.searchParams.get("date");
  const selectedDate = dateParam ?? new Date().toISOString().split("T")[0]!;

  const slots = await getAvailableSlots(eventType.id, selectedDate, agent.id);

  return {
    eventType,
    agent: {
      name: agent.name,
      displayName: agent.displayName,
      avatarUrl: agent.avatarUrl,
      calendarUsername: agent.calendarUsername,
    },
    selectedDate,
    slots: slots.filter((s) => s.available),
    username: params.username,
    slug: params.slug,
  };
}
