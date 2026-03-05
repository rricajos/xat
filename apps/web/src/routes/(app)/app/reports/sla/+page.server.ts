import type { PageServerLoad } from "./$types";
import { getSlaMetrics } from "$lib/server/services/sla.service";

export const load: PageServerLoad = async ({ locals, url }) => {
  const days = parseInt(url.searchParams.get("days") ?? "7");
  const now = new Date();
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const metrics = await getSlaMetrics(locals.account!.id, since, now);

  return { metrics, days };
};
