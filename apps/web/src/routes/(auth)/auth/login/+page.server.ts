import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { db } from "@xat/db";
import { users, accountUsers } from "@xat/db/schema";
import { eq } from "drizzle-orm";
import { verify } from "@xat/db/utils/password";
import { createSession, setSessionCookie } from "$lib/server/auth";
import { loginSchema } from "@xat/shared";

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) {
    redirect(302, "/app");
  }
};

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const formData = await request.formData();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      return fail(400, {
        error: parsed.error.errors[0]?.message || "Invalid input",
        email,
      });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, parsed.data.email))
      .limit(1);

    if (!user) {
      return fail(401, { error: "Invalid email or password", email });
    }

    const valid = await verify(parsed.data.password, user.encryptedPassword);
    if (!valid) {
      return fail(401, { error: "Invalid email or password", email });
    }

    // Get user's first account
    const [accountUser] = await db
      .select()
      .from(accountUsers)
      .where(eq(accountUsers.userId, user.id))
      .limit(1);

    if (!accountUser) {
      return fail(403, { error: "No account found for this user", email });
    }

    const sessionId = await createSession(user.id, accountUser.accountId);
    setSessionCookie(cookies, sessionId);

    redirect(302, "/app");
  },
};
