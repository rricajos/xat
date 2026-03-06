import type { LayoutServerLoad } from "./$types";
import { db } from "@xat/db";
import { accounts, users, conversations, contacts, messages, inboxes } from "@xat/db/schema";
import { count, gte } from "drizzle-orm";

export const load: LayoutServerLoad = async () => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    [accountCount],
    [userCount],
    [conversationCount],
    [contactCount],
    [messageCount],
    [inboxCount],
    [recentAccounts],
    [recentConversations],
  ] = await Promise.all([
    db.select({ count: count() }).from(accounts),
    db.select({ count: count() }).from(users),
    db.select({ count: count() }).from(conversations),
    db.select({ count: count() }).from(contacts),
    db.select({ count: count() }).from(messages),
    db.select({ count: count() }).from(inboxes),
    db.select({ count: count() }).from(accounts).where(gte(accounts.createdAt, thirtyDaysAgo)),
    db.select({ count: count() }).from(conversations).where(gte(conversations.createdAt, sevenDaysAgo)),
  ]);

  return {
    stats: {
      accounts: accountCount?.count ?? 0,
      users: userCount?.count ?? 0,
      conversations: conversationCount?.count ?? 0,
      contacts: contactCount?.count ?? 0,
      messages: messageCount?.count ?? 0,
      inboxes: inboxCount?.count ?? 0,
      recentAccounts: recentAccounts?.count ?? 0,
      recentConversations: recentConversations?.count ?? 0,
    },
  };
};
