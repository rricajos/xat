<script lang="ts">
  import { onMount } from "svelte";

  interface SsoConfig {
    entityId: string;
    ssoUrl: string;
    hasCertificate: boolean;
    sloUrl?: string;
    nameIdFormat?: string;
    attributeMapping?: Record<string, string>;
  }

  let config = $state<SsoConfig | null>(null);
  let editing = $state(false);
  let saving = $state(false);

  let entityId = $state("");
  let ssoUrl = $state("");
  let certificate = $state("");
  let sloUrl = $state("");

  async function loadConfig() {
    const res = await fetch("/api/v1/sso");
    const json = await res.json();
    config = json.data;
    if (config) {
      entityId = config.entityId;
      ssoUrl = config.ssoUrl;
      sloUrl = config.sloUrl ?? "";
    }
  }

  async function saveConfig() {
    saving = true;
    await fetch("/api/v1/sso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entityId,
        ssoUrl,
        certificate: certificate || "existing",
        sloUrl: sloUrl || undefined,
      }),
    });
    editing = false;
    saving = false;
    await loadConfig();
  }

  async function removeConfig() {
    await fetch("/api/v1/sso", { method: "DELETE" });
    config = null;
    entityId = "";
    ssoUrl = "";
    certificate = "";
    sloUrl = "";
  }

  onMount(loadConfig);
</script>

<div class="p-6">
  <div class="mb-6">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Single Sign-On (SSO)</h2>
    <p class="text-sm text-gray-500 dark:text-gray-400">
      Configure SAML 2.0 SSO for your account. Users can sign in via your
      identity provider (Okta, Azure AD, Google Workspace, etc.)
    </p>
  </div>

  {#if config && !editing}
    <div class="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3 dark:bg-gray-800/50">
      <div class="flex items-center gap-2">
        <span class="h-2 w-2 rounded-full bg-green-500"></span>
        <span class="text-sm font-medium text-gray-900 dark:text-white">SSO is configured</span>
      </div>
      <div class="text-sm space-y-1">
        <p class="text-gray-700 dark:text-gray-300"><span class="text-gray-500 dark:text-gray-400">Entity ID:</span> {config.entityId}</p>
        <p class="text-gray-700 dark:text-gray-300"><span class="text-gray-500 dark:text-gray-400">SSO URL:</span> {config.ssoUrl}</p>
        {#if config.sloUrl}
          <p class="text-gray-700 dark:text-gray-300"><span class="text-gray-500 dark:text-gray-400">SLO URL:</span> {config.sloUrl}</p>
        {/if}
        <p class="text-gray-700 dark:text-gray-300"><span class="text-gray-500 dark:text-gray-400">Certificate:</span> {config.hasCertificate ? "Uploaded" : "Not set"}</p>
      </div>
      <div class="flex gap-2">
        <button
          class="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          onclick={() => { editing = true; }}
        >
          Edit
        </button>
        <button
          class="rounded-md border border-red-300 dark:border-red-700 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
          onclick={removeConfig}
        >
          Remove SSO
        </button>
      </div>
    </div>
  {:else}
    <div class="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3 dark:bg-gray-800/50">
      {#if !config}
        <p class="text-sm text-gray-500 dark:text-gray-400">SSO is not configured. Set it up below.</p>
      {/if}
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Entity ID (Issuer)</label>
        <input type="text" class="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white" bind:value={entityId} placeholder="https://your-idp.com/entity-id" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">SSO URL</label>
        <input type="url" class="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white" bind:value={ssoUrl} placeholder="https://your-idp.com/saml/sso" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">IdP Certificate (PEM)</label>
        <textarea
          class="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          rows="5"
          bind:value={certificate}
          placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
        ></textarea>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Single Logout URL (optional)</label>
        <input type="url" class="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white" bind:value={sloUrl} />
      </div>
      <div class="flex gap-2">
        <button
          class="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          onclick={saveConfig}
          disabled={saving || !entityId || !ssoUrl}
        >
          {saving ? "Saving..." : "Save Configuration"}
        </button>
        {#if editing}
          <button class="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800" onclick={() => { editing = false; }}>
            Cancel
          </button>
        {/if}
      </div>
    </div>
  {/if}
</div>
