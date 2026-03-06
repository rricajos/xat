import { db } from "@xat/db";
import { sessions, users, accountUsers, accounts } from "@xat/db/schema";
import { eq, and, desc, gt } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import type { Cookies } from "@sveltejs/kit";

const SESSION_COOKIE = "xat_session";
const SESSION_EXPIRY_DAYS = 30;

export interface SessionUser {
  id: number;
  email: string;
  name: string;
  displayName: string | null;
  avatarUrl: string | null;
  type: string;
}

export interface SessionAccount {
  id: number;
  name: string;
  role: string;
}

function generateSessionId(): string {
  return randomBytes(32).toString("hex");
}

export async function createSession(
  userId: number,
  accountId: number,
  meta?: { ipAddress?: string; userAgent?: string },
): Promise<string> {
  const sessionId = generateSessionId();
  const expiresAt = new Date(
    Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  );

  await db.insert(sessions).values({
    id: sessionId,
    userId,
    activeAccountId: accountId,
    ipAddress: meta?.ipAddress ?? null,
    userAgent: meta?.userAgent ?? null,
    expiresAt,
  });

  return sessionId;
}

export async function validateSession(sessionId: string): Promise<{
  user: SessionUser;
  account: SessionAccount;
} | null> {
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await db.delete(sessions).where(eq(sessions.id, sessionId));
    }
    return null;
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user) return null;

  const accountId = session.activeAccountId;
  if (!accountId) return null;

  const [accountUser] = await db
    .select()
    .from(accountUsers)
    .where(
      and(
        eq(accountUsers.userId, user.id),
        eq(accountUsers.accountId, accountId),
      ),
    )
    .limit(1);

  if (!accountUser) return null;

  const [account] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.id, accountId))
    .limit(1);

  if (!account) return null;

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
      id: account.id,
      name: account.name,
      role: accountUser.role,
    },
  };
}

export async function invalidateSession(sessionId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}

export async function listUserSessions(userId: number) {
  return db
    .select({
      id: sessions.id,
      ipAddress: sessions.ipAddress,
      userAgent: sessions.userAgent,
      expiresAt: sessions.expiresAt,
      createdAt: sessions.createdAt,
    })
    .from(sessions)
    .where(
      and(
        eq(sessions.userId, userId),
        gt(sessions.expiresAt, new Date()),
      ),
    )
    .orderBy(desc(sessions.createdAt));
}

export async function revokeSession(
  userId: number,
  sessionId: string,
): Promise<void> {
  await db
    .delete(sessions)
    .where(
      and(
        eq(sessions.id, sessionId),
        eq(sessions.userId, userId),
      ),
    );
}

export async function revokeAllOtherSessions(
  userId: number,
  currentSessionId: string,
): Promise<void> {
  const allSessions = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(eq(sessions.userId, userId));

  for (const s of allSessions) {
    if (s.id !== currentSessionId) {
      await db.delete(sessions).where(eq(sessions.id, s.id));
    }
  }
}

export function setSessionCookie(cookies: Cookies, sessionId: string): void {
  cookies.set(SESSION_COOKIE, sessionId, {
    path: "/",
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60,
  });
}

export function getSessionCookie(cookies: Cookies): string | undefined {
  return cookies.get(SESSION_COOKIE);
}

export function deleteSessionCookie(cookies: Cookies): void {
  cookies.delete(SESSION_COOKIE, { path: "/" });
}
