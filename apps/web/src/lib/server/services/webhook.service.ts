import { db } from "@xat/db";
import { webhooks } from "@xat/db/schema";
import { eq, and } from "drizzle-orm";

export async function listWebhooks(accountId: number) {
  return db
    .select()
    .from(webhooks)
    .where(eq(webhooks.accountId, accountId));
}

export async function createWebhook(params: {
  accountId: number;
  url: string;
  subscriptions?: string[];
}) {
  const [webhook] = await db
    .insert(webhooks)
    .values({
      accountId: params.accountId,
      url: params.url,
      subscriptions: params.subscriptions ?? [],
    })
    .returning();

  return webhook;
}

export async function deleteWebhook(accountId: number, webhookId: number) {
  await db
    .delete(webhooks)
    .where(
      and(eq(webhooks.id, webhookId), eq(webhooks.accountId, accountId)),
    );
}

export async function deliverWebhook(
  accountId: number,
  event: string,
  data: unknown,
) {
  const accountWebhooks = await db
    .select()
    .from(webhooks)
    .where(
      and(eq(webhooks.accountId, accountId), eq(webhooks.enabled, true)),
    );

  for (const webhook of accountWebhooks) {
    const subs = webhook.subscriptions as string[];
    if (subs.length > 0 && !subs.includes(event)) continue;

    // Fire and forget — in production this would go through BullMQ
    fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Xat-Event": event,
      },
      body: JSON.stringify({ event, data, timestamp: new Date().toISOString() }),
    }).catch(() => {
      // Failed delivery — would be retried in production
    });
  }
}
