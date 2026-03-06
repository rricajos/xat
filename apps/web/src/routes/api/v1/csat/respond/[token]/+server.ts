import { json } from "@sveltejs/kit";
import { errorResponse } from "$lib/server/api-auth";
import { getSurveyByToken, submitSurveyByToken } from "$lib/server/services/csat.service.js";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ params, request }) => {
  const body = await request.json();
  const { rating, feedbackText } = body;

  if (!rating || rating < 1 || rating > 5) {
    return errorResponse("Rating must be between 1 and 5", 400);
  }

  const survey = await getSurveyByToken(params.token);
  if (!survey) return errorResponse("Survey not found", 404);
  if (survey.rating !== null) return errorResponse("Survey already submitted", 409);

  const updated = await submitSurveyByToken(params.token, rating, feedbackText);
  return json({ data: updated }, { status: 200 });
};
