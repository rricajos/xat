import { Queue, Worker, type Job } from "bullmq";
import IORedis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

let connection: IORedis | null = null;

function getConnection(): IORedis {
  if (!connection) {
    connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });
  }
  return connection;
}

// Queue definitions
export const emailQueue = new Queue("email", {
  connection: getConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

export const webhookQueue = new Queue("webhook", {
  connection: getConnection(),
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

export const automationQueue = new Queue("automation", {
  connection: getConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

export const channelQueue = new Queue("channel", {
  connection: getConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

// Job type definitions
export interface EmailJobData {
  type: "send_reply" | "send_notification" | "send_transcript" | "send_csat_survey";
  to: string;
  subject: string;
  body: string;
  accountId: number;
  conversationId?: number;
}

export interface WebhookJobData {
  accountId: number;
  event: string;
  data: unknown;
}

export interface AutomationJobData {
  accountId: number;
  eventName: string;
  conversationId?: number;
  messageId?: number;
  data: Record<string, unknown>;
}

export interface ChannelJobData {
  type: "sync_messages" | "send_message";
  accountId: number;
  inboxId: number;
  channelType: string;
  payload: unknown;
}

// Helper functions to enqueue jobs
export async function enqueueEmail(data: EmailJobData) {
  return emailQueue.add("email", data);
}

export async function enqueueWebhook(data: WebhookJobData) {
  return webhookQueue.add("webhook", data);
}

export async function enqueueAutomation(data: AutomationJobData) {
  return automationQueue.add("automation", data);
}

export async function enqueueChannelSync(data: ChannelJobData) {
  return channelQueue.add("channel", data);
}

// IMAP polling queue (repeatable)
export const imapQueue = new Queue("imap", {
  connection: getConnection(),
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: 10,
    removeOnFail: 50,
  },
});

// Push notification queue
export const pushQueue = new Queue("push", {
  connection: getConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

export interface PushJobData {
  userId: number;
  title: string;
  body: string;
  icon?: string;
  url?: string;
  tag?: string;
}

export async function enqueuePush(data: PushJobData) {
  return pushQueue.add("push", data);
}

// Schedule IMAP polling every 2 minutes
export async function scheduleImapPolling() {
  await imapQueue.add(
    "poll",
    {},
    {
      repeat: { every: 120_000 },
      jobId: "imap-poll",
    },
  );
}
