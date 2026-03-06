import { Worker, type Job } from "bullmq";
import IORedis from "ioredis";
import { db } from "@xat/db";
import { users } from "@xat/db/schema";
import { eq } from "drizzle-orm";
import { enqueueEmail, type EmailJobData } from "./queue";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const APP_URL = process.env.PUBLIC_APP_URL || "http://localhost:5173";

export interface NotificationEmailJobData {
  type: "notification_email";
  accountId: number;
  userId: number;
  notificationType: string;
  conversationId?: number;
}

async function getUserEmail(userId: number): Promise<string | null> {
  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user?.email ?? null;
}

function getEmailSubject(notificationType: string): string {
  switch (notificationType) {
    case "conversation_assignment":
      return "You have been assigned a conversation";
    case "conversation_mention":
      return "You were mentioned in a conversation";
    case "new_message":
      return "New message in a conversation";
    default:
      return "New notification";
  }
}

function getEmailBody(
  notificationType: string,
  conversationId?: number,
): string {
  const link = conversationId
    ? `${APP_URL}/app/conversations/${conversationId}`
    : `${APP_URL}/app`;

  const message = getEmailSubject(notificationType);

  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a56db;">${message}</h2>
      <p>You have a new notification in Xat.</p>
      ${conversationId ? `<p><a href="${link}" style="display: inline-block; padding: 10px 20px; background: #1a56db; color: white; text-decoration: none; border-radius: 6px;">View Conversation</a></p>` : ""}
      <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">
        You received this email because of your notification preferences.
        You can update them in your <a href="${APP_URL}/app/profile">profile settings</a>.
      </p>
    </div>
  `;
}

export async function processNotificationEmail(
  data: NotificationEmailJobData,
): Promise<void> {
  const email = await getUserEmail(data.userId);
  if (!email) return;

  const subject = getEmailSubject(data.notificationType);
  const body = getEmailBody(data.notificationType, data.conversationId);

  await enqueueEmail({
    type: "send_notification",
    to: email,
    subject,
    body,
    accountId: data.accountId,
    conversationId: data.conversationId,
  });
}

export function startNotificationWorker(): Worker {
  const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });

  const worker = new Worker(
    "notification_email",
    async (job: Job<NotificationEmailJobData>) => {
      await processNotificationEmail(job.data);
    },
    {
      connection,
      concurrency: 5,
    },
  );

  worker.on("failed", (job, err) => {
    console.error(`Notification email job ${job?.id} failed:`, err.message);
  });

  return worker;
}
