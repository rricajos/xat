import { error } from "@sveltejs/kit";
import { getBookingByRescheduleToken, getAvailableSlots } from "$lib/server/services/calendar.service.js";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, url }) => {
  const booking = await getBookingByRescheduleToken(params.rescheduleToken);
  if (!booking) error(404, { message: "Booking not found" });
  if (booking.status === "CANCELLED") error(410, { message: "This booking has been cancelled and cannot be rescheduled" });

  // Load available slots for the next 7 days for slot picker
  const dateStr = url.searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
  const timezone = url.searchParams.get("tz") ?? "UTC";

  const slots = await getAvailableSlots(booking.eventTypeId, dateStr, timezone).catch(() => []);

  return { booking, slots, selectedDate: dateStr, rescheduleToken: params.rescheduleToken };
};
