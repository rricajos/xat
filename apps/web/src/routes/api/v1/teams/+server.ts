import type { RequestHandler } from "./$types";
import { requireAuth, jsonResponse, errorResponse } from "$lib/server/api-auth";
import {
  listTeams,
  createTeam,
} from "$lib/server/services/team.service";

export const GET: RequestHandler = async (event) => {
  const { account } = requireAuth(event);
  const data = await listTeams(account.id);
  return jsonResponse(data);
};

export const POST: RequestHandler = async (event) => {
  const { account } = requireAuth(event);
  const body = await event.request.json();

  if (!body.name) return errorResponse("Name is required");

  const team = await createTeam({
    accountId: account.id,
    name: body.name,
    description: body.description,
    allowAutoAssign: body.allow_auto_assign,
  });

  return jsonResponse(team, 201);
};
