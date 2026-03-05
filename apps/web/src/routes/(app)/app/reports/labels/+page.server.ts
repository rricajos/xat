import type { PageServerLoad } from "./$types";
import { getLabelReport } from "$lib/server/services/report.service";

export const load: PageServerLoad = async ({ locals, url }) => {
  const days = parseInt(url.searchParams.get("days") ?? "7");
  const now = new Date();
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const labels = await getLabelReport(locals.account!.id, since, now);

  return { labels, days };
};
