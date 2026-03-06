import { getBookingByCancelToken } from "$lib/server/services/calendar.service.js";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  const booking = await getBookingByCancelToken(params.cancelToken);
  if (!booking) error(404, { message: "Booking not found or already cancelled" });
  return { booking };
};
