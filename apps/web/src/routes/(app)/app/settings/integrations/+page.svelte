<script lang="ts">
  import { onMount } from "svelte";

  interface Integration {
    id: number;
    appId: string;
    settings: Record<string, unknown>;
    enabled: boolean;
  }

  const integrationMeta: Record<string, { name: string; description: string; fields: Array<{ key: string; label: string; type: string }> }> = {
    slack: {
      name: "Slack",
      description: "Receive conversation notifications and reply from Slack.",
      fields: [
        { key: "webhookUrl", label: "Webhook URL", type: "url" },
        { key: "channelId", label: "Channel ID", type: "text" },
        { key: "botToken", label: "Bot Token", type: "password" },
      ],
    },
    dialogflow: {
      name: "Dialogflow",
      description: "Build chatbots with Google Dialogflow NLU.",
      fields: [
        { key: "projectId", label: "Project ID", type: "text" },
        { key: "credentialsJson", label: "Service Account Key", type: "password" },
        { key: "language", label: "Language", type: "text" },
      ],
    },
    linear: {
      name: "Linear",
      description: "Create Linear issues from conversations.",
      fields: [
        { key: "apiKey", label: "API Key", type: "password" },
        { key: "teamId", label: "Team ID", type: "text" },
      ],
    },
    google_translate: {
      name: "Google Translate",
      description: "Automatically translate messages.",
      fields: [
        { key: "apiKey", label: "API Key", type: "password" },
        { key: "targetLanguage", label: "Default Target Language", type: "text" },
      ],
    },
  };

  let integrations = $state<Integration[]>([]);
  let editingApp = $state<string | null>(null);
  let formData = $state<Record<string, string>>({});
  let saving = $state(false);

  async function loadIntegrations() {
    const res = await fetch("/api/v1/integrations");
    const json = await res.json();
    integrations = json.data ?? [];
  }

  function getIntegration(appId: string): Integration | undefined {
    return integrations.find((i) => i.appId === appId);
  }

  function startEdit(appId: string) {
    const existing = getIntegration(appId);
    const settings = (existing?.settings ?? {}) as Record<string, string>;
    formData = { ...settings };
    editingApp = appId;
  }

  async function saveIntegration(appId: string) {
    saving = true;
    await fetch("/api/v1/integrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appId, settings: formData, enabled: true }),
    });
    editingApp = null;
    formData = {};
    saving = false;
    await loadIntegrations();
  }

  async function toggleEnabled(appId: string, enabled: boolean) {
    await fetch(`/api/v1/integrations/${appId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    await loadIntegrations();
  }

  async function removeIntegration(appId: string) {
    await fetch(`/api/v1/integrations/${appId}`, { method: "DELETE" });
    await loadIntegrations();
  }

  onMount(loadIntegrations);
</script>

<div class="p-6">
  <div class="mb-6">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Integrations</h2>
    <p class="text-sm text-gray-500 dark:text-gray-400">
      Connect third-party tools and services to your account.
    </p>
  </div>

  <div class="space-y-4">
    {#each Object.entries(integrationMeta) as [appId, meta]}
      {@const integration = getIntegration(appId)}
      <div class="rounded-lg border border-gray-200 dark:border-gray-700 p-4 dark:bg-gray-800/20">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">{meta.name}</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">{meta.description}</p>
          </div>
          <div class="flex items-center gap-3">
            {#if integration}
              <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={integration.enabled}
                  onchange={() => toggleEnabled(appId, !integration.enabled)}
                  class="rounded border-gray-300 dark:border-gray-600 text-blue-600"
                />
                Enabled
              </label>
              <button
                class="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                onclick={() => removeIntegration(appId)}
              >
                Remove
              </button>
            {/if}
            <button
              class="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
              onclick={() => startEdit(appId)}
            >
              {integration ? "Edit" : "Configure"}
            </button>
          </div>
        </div>

        {#if editingApp === appId}
          <div class="mt-4 space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
            {#each meta.fields as field}
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">{field.label}</label>
                <input
                  type={field.type}
                  class="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  value={formData[field.key] ?? ""}
                  oninput={(e) => { formData[field.key] = (e.target as HTMLInputElement).value; }}
                />
              </div>
            {/each}
            <div class="flex gap-2">
              <button
                class="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                onclick={() => saveIntegration(appId)}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                class="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                onclick={() => { editingApp = null; }}
              >
                Cancel
              </button>
            </div>
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>
