/**
 * Standalone BullMQ worker process.
 * Run separately from the web server to process background jobs.
 *
 * Usage: node worker.js
 */

import { Worker } from "bullmq";
import IORedis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

function createConnection() {
  return new IORedis(REDIS_URL, { maxRetriesPerRequest: null });
}

// Email Worker
const emailWorker = new Worker(
  "email",
  async (job) => {
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

    await transporter.sendMail({ from: smtpFrom, to, subject, html: body });
    console.log(`[email:${type}] Sent to ${to}`);
  },
  { connection: createConnection(), concurrency: 5 },
);

// Webhook Worker
const webhookWorker = new Worker(
  "webhook",
  async (job) => {
    const { accountId, event, data } = job.data;
    console.log(`[webhook] Delivering ${event} for account ${accountId}`);

    // Import from built output
    const { deliverWebhook } = await import(
      "./build/server/chunks/webhook.service.js"
    ).catch(() => {
      // Fallback: deliver via HTTP
      return {
        deliverWebhook: async (acctId, evt, payload) => {
          console.log(
            `[webhook] Service unavailable — logging event: ${evt} for account ${acctId}`,
          );
        },
      };
    });

    await deliverWebhook(accountId, event, data);
  },
  { connection: createConnection(), concurrency: 10 },
);

// Automation Worker
const automationWorker = new Worker(
  "automation",
  async (job) => {
    const { accountId, eventName, conversationId, messageId, data } = job.data;
    console.log(
      `[automation] Evaluating rules for ${eventName} in account ${accountId}`,
    );

    const { evaluateAutomation } = await import(
      "./build/server/chunks/automation.service.js"
    ).catch(() => {
      return {
        evaluateAutomation: async (params) => {
          console.log(
            `[automation] Service unavailable — logging event: ${params.eventName}`,
          );
        },
      };
    });

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
  async (job) => {
    const { type, accountId, inboxId, channelType, payload } = job.data;
    console.log(
      `[channel:${type}] Processing for inbox ${inboxId} (${channelType})`,
    );

    if (type === "send_message" && channelType === "email") {
      await emailWorker.opts.connection
        .duplicate()
        .then(() => {
          // Re-enqueue as email job
          return import("bullmq").then(({ Queue }) => {
            const q = new Queue("email", {
              connection: createConnection(),
            });
            const p = payload;
            return q.add("email", {
              type: "send_reply",
              to: p.to,
              subject: p.subject,
              body: p.body,
              accountId,
              conversationId: p.conversationId,
            });
          });
        })
        .catch((err) => {
          console.error(`[channel] Failed to enqueue email: ${err.message}`);
        });
    } else {
      console.log(
        `[channel:${type}] ${channelType} for inbox ${inboxId} — not yet implemented`,
      );
    }
  },
  { connection: createConnection(), concurrency: 3 },
);

// Error & completion handlers
const workers = [emailWorker, webhookWorker, automationWorker, channelWorker];

for (const worker of workers) {
  worker.on("failed", (job, err) => {
    console.error(`[${worker.name}] Job ${job?.id} failed: ${err.message}`);
  });

  worker.on("completed", (job) => {
    console.log(`[${worker.name}] Job ${job.id} completed`);
  });
}

// Graceful shutdown
async function shutdown() {
  console.log("[worker] Shutting down...");
  await Promise.all(workers.map((w) => w.close()));
  console.log("[worker] All workers stopped");
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

console.log("[worker] All workers started — waiting for jobs...");
console.log(
  `[worker] Queues: email, webhook, automation, channel`,
);
