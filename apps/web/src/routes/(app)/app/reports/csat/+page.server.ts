import type { PageServerLoad } from "./$types";
import { getCsatMetrics, listSurveyResponses } from "$lib/server/services/csat.service";

export const load: PageServerLoad = async ({ locals, url }) => {
  const days = parseInt(url.searchParams.get("days") ?? "7");
  const now = new Date();
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const metrics = await getCsatMetrics(locals.account!.id, since, now);
  const { data: responses } = await listSurveyResponses(locals.account!.id, {
    since,
    until: now,
    limit: 20,
  });

  return { metrics, responses, days };
};
