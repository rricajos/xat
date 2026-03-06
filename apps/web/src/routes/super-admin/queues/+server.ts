import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import {
  emailQueue,
  webhookQueue,
  automationQueue,
  channelQueue,
} from "$lib/server/jobs/queue";

export const GET: RequestHandler = async (event) => {
  if (!event.locals.user || event.locals.user.type !== "super_admin") {
    return json({ error: "Forbidden" }, { status: 403 });
  }

  const queues = [
    { name: "email", queue: emailQueue },
    { name: "webhook", queue: webhookQueue },
    { name: "automation", queue: automationQueue },
    { name: "channel", queue: channelQueue },
  ];

  const data = await Promise.all(
    queues.map(async ({ name, queue }) => {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount(),
      ]);

      return {
        name,
        counts: { waiting, active, completed, failed, delayed },
      };
    }),
  );

  return json({ data });
};
