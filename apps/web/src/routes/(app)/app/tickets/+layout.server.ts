import type { LayoutServerLoad } from "./$types";
import { listBoards } from "$lib/server/services/ticket.service";

export const load: LayoutServerLoad = async ({ locals }) => {
  const boards = await listBoards(locals.account!.id);
  return { boards };
};
