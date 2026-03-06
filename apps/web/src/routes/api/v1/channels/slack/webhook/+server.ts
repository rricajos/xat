import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "@xat/db";
import { channelSlack, inboxes } from "@xat/db/schema";
import { eq, and } from "drizzle-orm";
import { processSlackMessage } from "$lib/server/channels/slack";

export const POST: RequestHandler = async (event) => {
  const body = await event.request.json();

  // Slack URL verification challenge
  if (body.type === "url_verification") {
    return json({ challenge: body.challenge });
  }

  // Slack event callback
  if (body.type === "event_callback") {
    const slackEvent = body.event;
    const teamId = body.team_id;

    // Ignore bot messages to avoid loops
    if (slackEvent.bot_id || slackEvent.subtype === "bot_message") {
      return json({ ok: true });
    }

    // Only process messages
    if (slackEvent.type !== "message") {
      return json({ ok: true });
    }

    // Find the inbox by Slack team ID
    const slackChannels = await db
      .select({
        slackId: channelSlack.id,
        accountId: channelSlack.accountId,
        slackTeamId: channelSlack.slackTeamId,
        slackChannelId: channelSlack.slackChannelId,
      })
      .from(channelSlack)
      .where(eq(channelSlack.slackTeamId, teamId));

    // Find matching channel by Slack channel ID
    const matchingChannel = slackChannels.find(
      (c) => c.slackChannelId === slackEvent.channel,
    );

    if (!matchingChannel) {
      return json({ ok: true });
    }

    // Find the inbox
    const [inbox] = await db
      .select()
      .from(inboxes)
      .where(
        and(
          eq(inboxes.channelId, matchingChannel.slackId),
          eq(inboxes.accountId, matchingChannel.accountId),
          eq(inboxes.channelType, "slack"),
        ),
      )
      .limit(1);

    if (!inbox) {
      return json({ ok: true });
    }

    await processSlackMessage(matchingChannel.accountId, inbox.id, {
      teamId,
      channelId: slackEvent.channel,
      userId: slackEvent.user,
      text: slackEvent.text ?? "",
      ts: slackEvent.ts,
      threadTs: slackEvent.thread_ts,
    });

    return json({ ok: true });
  }

  return json({ ok: true });
};
