import { db } from "@xat/db";
import { apiTokens, users, accountUsers } from "@xat/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { randomBytes } from "node:crypto";

function generateToken(): string {
  return `xat_${randomBytes(24).toString("hex")}`;
}

export async function listApiTokens(accountId: number, userId: number) {
  return db
    .select({
      id: apiTokens.id,
      label: apiTokens.label,
      token: apiTokens.token,
      lastUsedAt: apiTokens.lastUsedAt,
      expiresAt: apiTokens.expiresAt,
      createdAt: apiTokens.createdAt,
    })
    .from(apiTokens)
    .where(
      and(
        eq(apiTokens.accountId, accountId),
        eq(apiTokens.userId, userId),
      ),
    )
    .orderBy(desc(apiTokens.createdAt));
}

export async function createApiToken(params: {
  accountId: number;
  userId: number;
  label: string;
  expiresAt?: Date;
}) {
  const token = generateToken();

  const [apiToken] = await db
    .insert(apiTokens)
    .values({
      accountId: params.accountId,
      userId: params.userId,
      label: params.label,
      token,
      expiresAt: params.expiresAt,
    })
    .returning();

  return apiToken;
}

export async function deleteApiToken(
  accountId: number,
  userId: number,
  tokenId: number,
) {
  await db
    .delete(apiTokens)
    .where(
      and(
        eq(apiTokens.id, tokenId),
        eq(apiTokens.accountId, accountId),
        eq(apiTokens.userId, userId),
      ),
    );
}

export async function validateApiToken(token: string): Promise<{
  user: {
    id: number;
    email: string;
    name: string;
    displayName: string | null;
    avatarUrl: string | null;
    type: string;
  };
  account: {
    id: number;
    name: string;
    role: string;
  };
} | null> {
  const [record] = await db
    .select()
    .from(apiTokens)
    .where(eq(apiTokens.token, token))
    .limit(1);

  if (!record) return null;

  if (record.expiresAt && record.expiresAt < new Date()) {
    return null;
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, record.userId))
    .limit(1);

  if (!user) return null;

  const [accountUser] = await db
    .select()
    .from(accountUsers)
    .where(
      and(
        eq(accountUsers.userId, record.userId),
        eq(accountUsers.accountId, record.accountId),
      ),
    )
    .limit(1);

  if (!accountUser) return null;

  // Update last used timestamp (fire and forget)
  db.update(apiTokens)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiTokens.id, record.id))
    .catch(() => {});

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      type: user.type,
    },
    account: {
      id: record.accountId,
      name: "", // Will be populated by the caller if needed
      role: accountUser.role,
    },
  };
}
