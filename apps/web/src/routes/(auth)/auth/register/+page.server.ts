import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { db } from "@xat/db";
import { users, accounts, accountUsers } from "@xat/db/schema";
import { eq } from "drizzle-orm";
import { hash } from "@xat/db/utils/password";
import { createSession, setSessionCookie } from "$lib/server/auth";
import { registerSchema } from "@xat/shared";

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) {
    redirect(302, "/app");
  }
};

export const actions: Actions = {
  default: async ({ request, cookies, getClientAddress }) => {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const accountName = formData.get("accountName") as string;

    const parsed = registerSchema.safeParse({
      name,
      email,
      password,
      accountName,
    });
    if (!parsed.success) {
      return fail(400, {
        error: parsed.error.errors[0]?.message || "Invalid input",
        name,
        email,
        accountName,
      });
    }

    // Check if email exists
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, parsed.data.email))
      .limit(1);

    if (existing) {
      return fail(400, {
        error: "An account with this email already exists",
        name,
        email,
        accountName,
      });
    }

    const hashedPassword = await hash(parsed.data.password);

    // Create account
    const [account] = await db
      .insert(accounts)
      .values({ name: parsed.data.accountName })
      .returning();

    // Create user
    const [user] = await db
      .insert(users)
      .values({
        email: parsed.data.email,
        encryptedPassword: hashedPassword,
        name: parsed.data.name,
        displayName: parsed.data.name,
      })
      .returning();

    // Link user as owner
    await db.insert(accountUsers).values({
      accountId: account!.id,
      userId: user!.id,
      role: "owner",
    });

    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? getClientAddress();
    const userAgent = request.headers.get("user-agent") ?? undefined;

    const sessionId = await createSession(user!.id, account!.id, {
      ipAddress,
      userAgent,
    });
    setSessionCookie(cookies, sessionId);

    redirect(302, "/app");
  },
};
