<script lang="ts">
  import { onMount } from "svelte";

  interface AgentBot {
    id: number;
    name: string;
    description: string | null;
    outgoingUrl: string | null;
    accessToken: string | null;
  }

  let bots = $state<AgentBot[]>([]);
  let showForm = $state(false);
  let editingBot = $state<AgentBot | null>(null);
  let formName = $state("");
  let formDescription = $state("");
  let formUrl = $state("");
  let saving = $state(false);

  async function loadBots() {
    const res = await fetch("/api/v1/agent-bots");
    const json = await res.json();
    bots = json.data ?? [];
  }

  function startCreate() {
    editingBot = null;
    formName = "";
    formDescription = "";
    formUrl = "";
    showForm = true;
  }

  function startEdit(bot: AgentBot) {
    editingBot = bot;
    formName = bot.name;
    formDescription = bot.description ?? "";
    formUrl = bot.outgoingUrl ?? "";
    showForm = true;
  }

  async function saveBot() {
    saving = true;
    if (editingBot) {
      await fetch(`/api/v1/agent-bots/${editingBot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          description: formDescription || undefined,
          outgoingUrl: formUrl || undefined,
        }),
      });
    } else {
      await fetch("/api/v1/agent-bots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          description: formDescription || undefined,
          outgoingUrl: formUrl || undefined,
        }),
      });
    }
    showForm = false;
    saving = false;
    await loadBots();
  }

  async function deleteBot(id: number) {
    await fetch(`/api/v1/agent-bots/${id}`, { method: "DELETE" });
    await loadBots();
  }

  onMount(loadBots);
</script>

<div class="p-6">
  <div class="flex items-center justify-between mb-6">
    <div>
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Agent Bots</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Configure automated bot agents for conversations.
      </p>
    </div>
    <button
      class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      onclick={startCreate}
    >
      New Bot
    </button>
  </div>

  {#if showForm}
    <div class="mb-6 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3 dark:bg-gray-800/50">
      <h3 class="text-sm font-medium text-gray-900 dark:text-white">{editingBot ? "Edit Bot" : "New Bot"}</h3>
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
        <input
          type="text"
          class="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          bind:value={formName}
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
        <input
          type="text"
          class="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          bind:value={formDescription}
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Outgoing Webhook URL</label>
        <input
          type="url"
          class="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          bind:value={formUrl}
          placeholder="https://your-bot-server.com/webhook"
        />
      </div>
      <div class="flex gap-2">
        <button
          class="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          onclick={saveBot}
          disabled={saving || !formName}
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          class="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          onclick={() => { showForm = false; }}
        >
          Cancel
        </button>
      </div>
    </div>
  {/if}

  <div class="space-y-2">
    {#each bots as bot}
      <div class="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50">
        <div>
          <p class="text-sm font-medium text-gray-900 dark:text-white">{bot.name}</p>
          {#if bot.description}
            <p class="text-sm text-gray-500 dark:text-gray-400">{bot.description}</p>
          {/if}
          {#if bot.outgoingUrl}
            <p class="text-xs text-gray-400 dark:text-gray-500 font-mono mt-1">{bot.outgoingUrl}</p>
          {/if}
        </div>
        <div class="flex gap-3">
          <button
            class="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            onclick={() => startEdit(bot)}
          >
            Edit
          </button>
          <button
            class="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            onclick={() => deleteBot(bot.id)}
          >
            Delete
          </button>
        </div>
      </div>
    {:else}
      <p class="text-center text-sm text-gray-400 dark:text-gray-500 py-8">No agent bots configured.</p>
    {/each}
  </div>
</div>
