import { error } from "@sveltejs/kit";
import { getPublicEventType, getAvailableSlots, resolveAgent } from "$lib/server/services/calendar.service.js";
import { db } from "@xat/db";
import { users } from "@xat/db/schema";
import { eq } from "drizzle-orm";

export async function load({ params, url }) {
  const result = await getPublicEventType({ slug: params.slug, isGlobal: true });
  if (!result) error(404, { message: "Event not found" });

  const { eventType } = result as { eventType: Parameters<typeof resolveAgent>[0] & { name: string; description: string | null; duration: number; locationType: string; color: string | null } };

  const dateParam = url.searchParams.get("date");
  const selectedDate = dateParam ?? new Date().toISOString().split("T")[0]!;

  const dayStart = new Date(selectedDate + "T00:00:00");
  const dayEnd = new Date(dayStart.getTime() + 24 * 3_600_000);
  const assignedUserId = await resolveAgent(eventType, dayStart, dayEnd);

  let slots: { start: Date; end: Date; available: boolean }[] = [];
  if (assignedUserId) {
    slots = await getAvailableSlots(eventType.id, selectedDate, assignedUserId);
  }

  return {
    eventType,
    selectedDate,
    slots: slots.filter((s) => s.available),
    slug: params.slug,
    scope: "global" as const,
  };
}
