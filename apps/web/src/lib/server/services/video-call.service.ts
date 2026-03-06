import { db } from "@xat/db";
import { videoCalls, integrations } from "@xat/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { randomBytes } from "node:crypto";

const DYTE_API_BASE = "https://api.dyte.io/v2";

interface DyteConfig {
  orgId: string;
  apiKey: string;
}

async function getDyteConfig(accountId: number): Promise<DyteConfig | null> {
  const [integration] = await db
    .select()
    .from(integrations)
    .where(
      and(
        eq(integrations.accountId, accountId),
        eq(integrations.appId, "dyte"),
        eq(integrations.enabled, true),
      ),
    )
    .limit(1);

  if (!integration) return null;

  const settings = integration.settings as Record<string, string>;
  if (!settings.orgId || !settings.apiKey) return null;

  return { orgId: settings.orgId, apiKey: settings.apiKey };
}

function getDyteAuthHeader(config: DyteConfig): string {
  return `Basic ${Buffer.from(`${config.orgId}:${config.apiKey}`).toString("base64")}`;
}

export async function createVideoCall(params: {
  accountId: number;
  conversationId: number;
  initiatedById: number;
}): Promise<{
  id: number;
  roomName: string;
  roomId: string | null;
  provider: string;
}> {
  const roomName = `xat-conv-${params.conversationId}-${randomBytes(4).toString("hex")}`;
  let roomId: string | null = null;

  const config = await getDyteConfig(params.accountId);

  if (config) {
    try {
      const res = await fetch(`${DYTE_API_BASE}/meetings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: getDyteAuthHeader(config),
        },
        body: JSON.stringify({
          title: `Conversation #${params.conversationId}`,
          preferred_region: "ap-south-1",
          record_on_start: false,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        roomId = data.data?.id ?? null;
      }
    } catch {
      // Dyte API unavailable — continue with local room
    }
  }

  const [call] = await db
    .insert(videoCalls)
    .values({
      accountId: params.accountId,
      conversationId: params.conversationId,
      roomName,
      roomId,
      provider: config ? "dyte" : "local",
      status: "created",
      initiatedById: params.initiatedById,
    })
    .returning();

  return {
    id: call!.id,
    roomName: call!.roomName,
    roomId: call!.roomId,
    provider: call!.provider,
  };
}

export async function addParticipant(params: {
  accountId: number;
  callId: number;
  name: string;
  preset: "host" | "participant";
}): Promise<{ token: string | null }> {
  const [call] = await db
    .select()
    .from(videoCalls)
    .where(
      and(
        eq(videoCalls.id, params.callId),
        eq(videoCalls.accountId, params.accountId),
      ),
    )
    .limit(1);

  if (!call || !call.roomId) return { token: null };

  const config = await getDyteConfig(params.accountId);
  if (!config) return { token: null };

  try {
    const res = await fetch(
      `${DYTE_API_BASE}/meetings/${call.roomId}/participants`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: getDyteAuthHeader(config),
        },
        body: JSON.stringify({
          name: params.name,
          preset_name: params.preset === "host" ? "group_call_host" : "group_call_participant",
          custom_participant_id: `xat-${params.callId}-${randomBytes(4).toString("hex")}`,
        }),
      },
    );

    if (res.ok) {
      const data = await res.json();
      return { token: data.data?.token ?? null };
    }
  } catch {
    // Dyte API unavailable
  }

  return { token: null };
}

export async function endVideoCall(
  accountId: number,
  callId: number,
): Promise<void> {
  await db
    .update(videoCalls)
    .set({
      status: "ended",
      endedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(videoCalls.id, callId),
        eq(videoCalls.accountId, accountId),
      ),
    );
}

export async function startVideoCall(
  accountId: number,
  callId: number,
): Promise<void> {
  await db
    .update(videoCalls)
    .set({
      status: "active",
      startedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(videoCalls.id, callId),
        eq(videoCalls.accountId, accountId),
      ),
    );
}

export async function getActiveCall(
  accountId: number,
  conversationId: number,
) {
  const [call] = await db
    .select()
    .from(videoCalls)
    .where(
      and(
        eq(videoCalls.accountId, accountId),
        eq(videoCalls.conversationId, conversationId),
        eq(videoCalls.status, "active"),
      ),
    )
    .limit(1);

  return call ?? null;
}

export async function listCallHistory(
  accountId: number,
  conversationId: number,
) {
  return db
    .select()
    .from(videoCalls)
    .where(
      and(
        eq(videoCalls.accountId, accountId),
        eq(videoCalls.conversationId, conversationId),
      ),
    )
    .orderBy(desc(videoCalls.createdAt))
    .limit(20);
}
