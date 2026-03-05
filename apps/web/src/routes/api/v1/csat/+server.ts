import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { requireAuth, errorResponse } from "$lib/server/api-auth";
import {
  createSurveyResponse,
  listSurveyResponses,
  getCsatMetrics,
} from "$lib/server/services/csat.service";

export const GET: RequestHandler = async (event) => {
  const { account } = requireAuth(event);

  const days = parseInt(event.url.searchParams.get("days") ?? "30");
  const agentId = event.url.searchParams.get("agentId")
    ? parseInt(event.url.searchParams.get("agentId")!)
    : undefined;
  const page = parseInt(event.url.searchParams.get("page") ?? "1");

  const now = new Date();
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const [metrics, responses] = await Promise.all([
    getCsatMetrics(account.id, since, now),
    listSurveyResponses(account.id, { since, until: now, agentId, page }),
  ]);

  return json({ data: { metrics, responses: responses.data, total: responses.total } });
};

export const POST: RequestHandler = async (event) => {
  const body = await event.request.json();

  const { accountId, conversationId, contactId, rating, feedbackText, assignedAgentId } = body;

  if (!accountId || !conversationId || !contactId || !rating) {
    return errorResponse("Missing required fields", 400);
  }

  if (rating < 1 || rating > 5) {
    return errorResponse("Rating must be between 1 and 5", 400);
  }

  const response = await createSurveyResponse({
    accountId,
    conversationId,
    contactId,
    rating,
    feedbackText,
    assignedAgentId,
  });

  return json({ data: response }, { status: 201 });
};
