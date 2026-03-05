import type { PageServerLoad, Actions } from "./$types";
import { fail } from "@sveltejs/kit";
import { db } from "@xat/db";
import { users } from "@xat/db/schema";
import { eq } from "drizzle-orm";

export const load: PageServerLoad = async () => {
  const allUsers = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      displayName: users.displayName,
      type: users.type,
      availability: users.availability,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(users.id);

  return { users: allUsers };
};

export const actions: Actions = {
  promote: async ({ request }) => {
    const formData = await request.formData();
    const userId = parseInt(formData.get("userId") as string);
    if (isNaN(userId)) return fail(400, { error: "Invalid user" });

    await db
      .update(users)
      .set({ type: "super_admin", updatedAt: new Date() })
      .where(eq(users.id, userId));

    return { success: true };
  },

  demote: async ({ request }) => {
    const formData = await request.formData();
    const userId = parseInt(formData.get("userId") as string);
    if (isNaN(userId)) return fail(400, { error: "Invalid user" });

    await db
      .update(users)
      .set({ type: "user", updatedAt: new Date() })
      .where(eq(users.id, userId));

    return { success: true };
  },
};
