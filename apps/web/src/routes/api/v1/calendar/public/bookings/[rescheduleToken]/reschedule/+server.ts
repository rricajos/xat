import { json, error } from "@sveltejs/kit";
import {
  getBookingByRescheduleToken,
  getAvailableSlots,
  rescheduleBooking,
} from "$lib/server/services/calendar.service.js";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ params, request }) => {
  const body = await request.json();
  const { startAt, timezone } = body;

  if (!startAt) {
    return json({ error: "startAt is required" }, { status: 400 });
  }

  const booking = await getBookingByRescheduleToken(params.rescheduleToken);
  if (!booking) error(404, { message: "Booking not found" });
  if (booking.status === "CANCELLED") {
    return json({ error: "Cannot reschedule a cancelled booking" }, { status: 409 });
  }

  const newStart = new Date(startAt);
  const durationMs = booking.endAt.getTime() - booking.startAt.getTime();
  const newEnd = new Date(newStart.getTime() + durationMs);

  const updated = await rescheduleBooking(params.rescheduleToken, newStart, newEnd);
  if (!updated) return json({ error: "Reschedule failed" }, { status: 500 });

  return json({ data: updated });
};
