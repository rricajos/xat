import { db } from "@xat/db";
import { integrations } from "@xat/db/schema";
import { eq, and } from "drizzle-orm";

export type IntegrationAppId = "slack" | "dialogflow" | "linear" | "google_translate";

interface SlackSettings {
  webhookUrl: string;
  channelId?: string;
  botToken?: string;
  events: string[];
}

interface DialogflowSettings {
  projectId: string;
  credentialsJson: string;
  language?: string;
  inboxIds?: number[];
}

interface LinearSettings {
  apiKey: string;
  teamId: string;
  defaultLabelIds?: string[];
}

interface GoogleTranslateSettings {
  apiKey: string;
  targetLanguage?: string;
}

type IntegrationSettings =
  | SlackSettings
  | DialogflowSettings
  | LinearSettings
  | GoogleTranslateSettings;

export async function listIntegrations(accountId: number) {
  return db
    .select()
    .from(integrations)
    .where(eq(integrations.accountId, accountId));
}

export async function getIntegration(accountId: number, appId: string) {
  const [integration] = await db
    .select()
    .from(integrations)
    .where(
      and(eq(integrations.accountId, accountId), eq(integrations.appId, appId)),
    )
    .limit(1);

  return integration ?? null;
}

export async function upsertIntegration(params: {
  accountId: number;
  appId: IntegrationAppId;
  settings: IntegrationSettings;
  enabled?: boolean;
}) {
  const existing = await getIntegration(params.accountId, params.appId);

  if (existing) {
    const [updated] = await db
      .update(integrations)
      .set({
        settings: params.settings,
        enabled: params.enabled ?? existing.enabled,
        updatedAt: new Date(),
      })
      .where(eq(integrations.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(integrations)
    .values({
      accountId: params.accountId,
      appId: params.appId,
      settings: params.settings,
      enabled: params.enabled ?? true,
    })
    .returning();

  return created;
}

export async function deleteIntegration(accountId: number, appId: string) {
  await db
    .delete(integrations)
    .where(
      and(eq(integrations.accountId, accountId), eq(integrations.appId, appId)),
    );
}

export async function toggleIntegration(
  accountId: number,
  appId: string,
  enabled: boolean,
) {
  const [updated] = await db
    .update(integrations)
    .set({ enabled, updatedAt: new Date() })
    .where(
      and(eq(integrations.accountId, accountId), eq(integrations.appId, appId)),
    )
    .returning();

  return updated;
}

// --- Slack integration helpers ---

export async function sendSlackNotification(
  accountId: number,
  event: string,
  data: Record<string, unknown>,
) {
  const integration = await getIntegration(accountId, "slack");
  if (!integration?.enabled) return;

  const settings = integration.settings as unknown as SlackSettings;
  if (!settings.webhookUrl) return;

  if (settings.events.length > 0 && !settings.events.includes(event)) return;

  const text = formatSlackMessage(event, data);

  try {
    await fetch(settings.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch {
    // Slack delivery failure — would be retried via BullMQ in production
  }
}

function formatSlackMessage(
  event: string,
  data: Record<string, unknown>,
): string {
  switch (event) {
    case "conversation:created":
      return `New conversation #${data.displayId ?? ""} from ${data.contactName ?? "unknown"}`;
    case "message:created":
      return `New message in conversation #${data.conversationDisplayId ?? ""}: ${String(data.content ?? "").slice(0, 200)}`;
    case "conversation:status_changed":
      return `Conversation #${data.displayId ?? ""} status changed to ${data.statusLabel ?? data.status}`;
    default:
      return `Event: ${event}`;
  }
}

// --- Dialogflow integration helpers ---

export async function getDialogflowResponse(
  accountId: number,
  message: string,
  sessionId: string,
): Promise<string | null> {
  const integration = await getIntegration(accountId, "dialogflow");
  if (!integration?.enabled) return null;

  const settings = integration.settings as unknown as DialogflowSettings;

  // Dialogflow REST API v2 call
  try {
    const response = await fetch(
      `https://dialogflow.googleapis.com/v2/projects/${settings.projectId}/agent/sessions/${sessionId}:detectIntent`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${settings.credentialsJson}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          queryInput: {
            text: {
              text: message,
              languageCode: settings.language ?? "en",
            },
          },
        }),
      },
    );

    if (!response.ok) return null;

    const result = (await response.json()) as {
      queryResult?: { fulfillmentText?: string };
    };
    return result.queryResult?.fulfillmentText ?? null;
  } catch {
    return null;
  }
}

// --- Linear integration helpers ---

export async function createLinearIssue(
  accountId: number,
  params: {
    title: string;
    description?: string;
    conversationId?: number;
  },
): Promise<{ id: string; url: string } | null> {
  const integration = await getIntegration(accountId, "linear");
  if (!integration?.enabled) return null;

  const settings = integration.settings as unknown as LinearSettings;

  try {
    const response = await fetch("https://api.linear.app/graphql", {
      method: "POST",
      headers: {
        Authorization: settings.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `mutation CreateIssue($input: IssueCreateInput!) {
          issueCreate(input: $input) {
            success
            issue { id url identifier }
          }
        }`,
        variables: {
          input: {
            teamId: settings.teamId,
            title: params.title,
            description: params.description ?? "",
            labelIds: settings.defaultLabelIds ?? [],
          },
        },
      }),
    });

    if (!response.ok) return null;

    const result = (await response.json()) as {
      data?: {
        issueCreate?: {
          success: boolean;
          issue?: { id: string; url: string };
        };
      };
    };

    if (result.data?.issueCreate?.success && result.data.issueCreate.issue) {
      return {
        id: result.data.issueCreate.issue.id,
        url: result.data.issueCreate.issue.url,
      };
    }

    return null;
  } catch {
    return null;
  }
}

// --- Google Translate integration helpers ---

export async function translateMessage(
  accountId: number,
  text: string,
  targetLanguage: string,
): Promise<string | null> {
  const integration = await getIntegration(accountId, "google_translate");
  if (!integration?.enabled) return null;

  const settings = integration.settings as unknown as GoogleTranslateSettings;
  const target = targetLanguage || settings.targetLanguage || "en";

  try {
    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${settings.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: text, target }),
      },
    );

    if (!response.ok) return null;

    const result = (await response.json()) as {
      data?: {
        translations?: Array<{ translatedText: string }>;
      };
    };

    return result.data?.translations?.[0]?.translatedText ?? null;
  } catch {
    return null;
  }
}
