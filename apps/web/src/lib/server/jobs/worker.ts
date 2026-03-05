import { Worker, type Job } from "bullmq";
import IORedis from "ioredis";
import type {
  EmailJobData,
  WebhookJobData,
  AutomationJobData,
  ChannelJobData,
} from "./queue.js";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

function createConnection(): IORedis {
  return new IORedis(REDIS_URL, { maxRetriesPerRequest: null });
}

// Email Worker
const emailWorker = new Worker(
  "email",
  async (job: Job<EmailJobData>) => {
    const { type, to, subject, body } = job.data;
    console.log(`[email:${type}] Sending to ${to}: ${subject}`);

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT ?? "587");
    const smtpUser = process.env.SMTP_USERNAME;
    const smtpPass = process.env.SMTP_PASSWORD;
    const smtpFrom = process.env.SMTP_FROM_EMAIL ?? "noreply@xat.app";

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.log(`[email] SMTP not configured — skipping send to ${to}`);
      return;
    }

    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });

    await transporter.sendMail({
      from: smtpFrom,
      to,
      subject,
      html: body,
    });

    console.log(`[email:${type}] Sent to ${to}`);
  },
  { connection: createConnection(), concurrency: 5 },
);

// Webhook Worker
const webhookWorker = new Worker(
  "webhook",
  async (job: Job<WebhookJobData>) => {
    const { accountId, event, data } = job.data;
    console.log(`[webhook] Delivering ${event} for account ${accountId}`);

    const { deliverWebhook } = await import(
      "../services/webhook.service.js"
    );
    await deliverWebhook(accountId, event, data);
  },
  { connection: createConnection(), concurrency: 10 },
);

// Automation Worker
const automationWorker = new Worker(
  "automation",
  async (job: Job<AutomationJobData>) => {
    const { accountId, eventName, conversationId, messageId, data } =
      job.data;
    console.log(
      `[automation] Evaluating rules for ${eventName} in account ${accountId}`,
    );

    const { evaluateAutomation } = await import(
      "../services/automation.service.js"
    );
    await evaluateAutomation({
      accountId,
      eventName,
      conversationId,
      messageId,
      data,
    });
  },
  { connection: createConnection(), concurrency: 5 },
);

// Channel Worker
const channelWorker = new Worker(
  "channel",
  async (job: Job<ChannelJobData>) => {
    const { type, accountId, inboxId, channelType, payload } = job.data;
    console.log(
      `[channel:${type}] Processing for inbox ${inboxId} (${channelType})`,
    );

    switch (type) {
      case "send_message": {
        switch (channelType) {
          case "email": {
            const { enqueueEmail } = await import("./queue.js");
            const p = payload as { to: string; subject: string; body: string };
            await enqueueEmail({
              type: "send_reply",
              to: p.to,
              subject: p.subject,
              body: p.body,
              accountId,
              conversationId: (payload as Record<string, unknown>)
                .conversationId as number | undefined,
            });
            break;
          }
          case "whatsapp":
            console.log(
              `[channel] WhatsApp send_message for inbox ${inboxId}`,
            );
            // WhatsApp sending will be implemented with baileys/cloud API
            break;
          case "telegram":
            console.log(
              `[channel] Telegram send_message for inbox ${inboxId}`,
            );
            break;
          default:
            console.log(
              `[channel] send_message for unknown channel: ${channelType}`,
            );
        }
        break;
      }
      case "sync_messages":
        console.log(
          `[channel] Syncing ${channelType} messages for inbox ${inboxId}`,
        );
        break;
    }
  },
  { connection: createConnection(), concurrency: 3 },
);

// Error handlers
for (const worker of [
  emailWorker,
  webhookWorker,
  automationWorker,
  channelWorker,
]) {
  worker.on("failed", (job, err) => {
    console.error(
      `[${worker.name}] Job ${job?.id} failed: ${err.message}`,
    );
  });

  worker.on("completed", (job) => {
    console.log(`[${worker.name}] Job ${job.id} completed`);
  });
}

export { emailWorker, webhookWorker, automationWorker, channelWorker };

console.log("[worker] All workers started");
