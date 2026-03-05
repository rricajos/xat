import type { PageServerLoad } from "./$types";
import {
  getOverviewReport,
  getConversationsByDay,
} from "$lib/server/services/report.service";

export const load: PageServerLoad = async ({ locals, url }) => {
  const days = parseInt(url.searchParams.get("days") ?? "7");
  const now = new Date();
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const [metrics, chartData] = await Promise.all([
    getOverviewReport(locals.account!.id, since, now),
    getConversationsByDay(locals.account!.id, since, now),
  ]);

  return { metrics, chartData, days };
};
