import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import {
  emailQueue,
  webhookQueue,
  automationQueue,
  channelQueue,
} from "$lib/server/jobs/queue";
import type { Queue } from "bullmq";

const queueMap: Record<string, Queue> = {
  email: emailQueue,
  webhook: webhookQueue,
  automation: automationQueue,
  channel: channelQueue,
};

export const GET: RequestHandler = async (event) => {
  if (!event.locals.user || event.locals.user.type !== "super_admin") {
    return json({ error: "Forbidden" }, { status: 403 });
  }

  const { name } = event.params;
  const queue = queueMap[name];

  if (!queue) {
    return json({ error: "Queue not found" }, { status: 404 });
  }

  const status = event.url.searchParams.get("status") ?? "failed";
  const page = parseInt(event.url.searchParams.get("page") ?? "1");
  const limit = parseInt(event.url.searchParams.get("limit") ?? "20");
  const start = (page - 1) * limit;

  const validStatuses = ["waiting", "active", "completed", "failed", "delayed"] as const;
  if (!validStatuses.includes(status as typeof validStatuses[number])) {
    return json({ error: "Invalid status" }, { status: 400 });
  }

  const jobs = await queue.getJobs([status as typeof validStatuses[number]], start, start + limit - 1);

  const data = jobs.map((job) => ({
    id: job.id,
    name: job.name,
    data: job.data,
    attemptsMade: job.attemptsMade,
    timestamp: job.timestamp,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn,
    failedReason: job.failedReason,
  }));

  return json({ data });
};

export const DELETE: RequestHandler = async (event) => {
  if (!event.locals.user || event.locals.user.type !== "super_admin") {
    return json({ error: "Forbidden" }, { status: 403 });
  }

  const { name } = event.params;
  const queue = queueMap[name];

  if (!queue) {
    return json({ error: "Queue not found" }, { status: 404 });
  }

  const body = await event.request.json();
  const { jobId, action } = body as { jobId?: string; action?: string };

  if (action === "clean_failed") {
    await queue.clean(0, 1000, "failed");
    return json({ message: "Failed jobs cleaned" });
  }

  if (action === "retry_all") {
    const failed = await queue.getFailed();
    for (const job of failed) {
      await job.retry();
    }
    return json({ message: `Retried ${failed.length} jobs` });
  }

  if (jobId) {
    const job = await queue.getJob(jobId);
    if (job) {
      await job.remove();
      return json({ message: "Job removed" });
    }
    return json({ error: "Job not found" }, { status: 404 });
  }

  return json({ error: "jobId or action is required" }, { status: 400 });
};
