import { db } from "@xat/db";
import { users, accountUsers } from "@xat/db/schema";
import { eq, and } from "drizzle-orm";
import { hash } from "@xat/db/utils/password";

export async function listAgents(accountId: number) {
  return db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      availability: users.availability,
      role: accountUsers.role,
    })
    .from(accountUsers)
    .innerJoin(users, eq(accountUsers.userId, users.id))
    .where(eq(accountUsers.accountId, accountId))
    .orderBy(users.name);
}

export async function inviteAgent(params: {
  accountId: number;
  email: string;
  name: string;
  role?: string;
}) {
  // Check if user already exists
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, params.email))
    .limit(1);

  let userId: number;

  if (existing) {
    userId = existing.id;
  } else {
    // Create user with temporary password
    const tempPassword = await hash("changeme123");
    const [newUser] = await db
      .insert(users)
      .values({
        email: params.email,
        name: params.name,
        encryptedPassword: tempPassword,
      })
      .returning();
    userId = newUser!.id;
  }

  // Link to account
  await db
    .insert(accountUsers)
    .values({
      accountId: params.accountId,
      userId,
      role: params.role ?? "agent",
    })
    .onConflictDoNothing();

  return userId;
}

export async function removeAgent(accountId: number, userId: number) {
  await db
    .delete(accountUsers)
    .where(
      and(
        eq(accountUsers.accountId, accountId),
        eq(accountUsers.userId, userId),
      ),
    );
}

export async function updateAgentRole(
  accountId: number,
  userId: number,
  role: string,
) {
  await db
    .update(accountUsers)
    .set({ role, updatedAt: new Date() })
    .where(
      and(
        eq(accountUsers.accountId, accountId),
        eq(accountUsers.userId, userId),
      ),
    );
}
