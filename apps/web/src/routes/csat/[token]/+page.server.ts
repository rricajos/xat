import { error } from "@sveltejs/kit";
import { getSurveyByToken, submitSurveyByToken } from "$lib/server/services/csat.service.js";
import type { PageServerLoad, Actions } from "./$types";

export const load: PageServerLoad = async ({ params, url }) => {
  const survey = await getSurveyByToken(params.token);
  if (!survey) error(404, "Survey not found or already submitted");

  // Pre-fill rating from email click (?rating=N)
  const preRating = parseInt(url.searchParams.get("rating") ?? "0");

  return {
    token: params.token,
    alreadySubmitted: survey.rating !== null,
    preRating: preRating >= 1 && preRating <= 5 ? preRating : null,
  };
};

export const actions: Actions = {
  default: async ({ request, params }) => {
    const formData = await request.formData();
    const rating = parseInt(formData.get("rating") as string);
    const feedbackText = (formData.get("feedbackText") as string ?? "").trim() || undefined;

    if (!rating || rating < 1 || rating > 5) {
      return { error: "Please select a rating" };
    }

    const updated = await submitSurveyByToken(params.token, rating, feedbackText);
    if (!updated) return { error: "Survey not found or already submitted" };

    return { submitted: true };
  },
};
