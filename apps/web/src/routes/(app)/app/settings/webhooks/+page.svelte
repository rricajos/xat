<script lang="ts">
  import { enhance } from "$app/forms";
  import * as m from "$lib/paraglide/messages";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  let showForm = $state(false);

  const availableEvents = [
    "conversation.created",
    "conversation.status_changed",
    "conversation.updated",
    "message.created",
    "message.updated",
    "contact.created",
    "contact.updated",
  ];
</script>

<div class="p-6">
  <div class="flex items-center justify-between mb-6">
    <div>
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{m.settings_webhooks()}</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400">{m.settings_webhooks_description()}</p>
    </div>
    <button
      onclick={() => (showForm = !showForm)}
      class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
    >
      {showForm ? "Cancel" : "Add Webhook"}
    </button>
  </div>

  {#if showForm}
    <form
      method="POST"
      action="?/create"
      use:enhance
      class="mb-6 rounded-lg border border-gray-200 p-4 dark:border-gray-700"
    >
      <div class="space-y-3">
        <div>
          <label for="wh-url" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Endpoint URL</label>
          <input
            id="wh-url"
            name="url"
            type="url"
            required
            placeholder="https://example.com/webhook"
            class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div>
          <label for="wh-subs" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Events (comma-separated, leave empty for all)
          </label>
          <input
            id="wh-subs"
            name="subscriptions"
            type="text"
            placeholder="conversation.created, message.created"
            class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
          <p class="mt-1 text-xs text-gray-400">
            Available: {availableEvents.join(", ")}
          </p>
        </div>
      </div>
      <div class="mt-4">
        <button
          type="submit"
          class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Create Webhook
        </button>
      </div>
    </form>
  {/if}

  <table class="w-full">
    <thead class="bg-gray-50 dark:bg-gray-800">
      <tr>
        <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">URL</th>
        <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Events</th>
        <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
        <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Actions</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
      {#each data.webhooks as webhook}
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-800">
          <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">
            <span class="font-mono text-xs">{webhook.url}</span>
          </td>
          <td class="px-4 py-3 text-sm text-gray-500">
            {#if (webhook.subscriptions as string[]).length === 0}
              <span class="text-xs text-gray-400">All events</span>
            {:else}
              <div class="flex flex-wrap gap-1">
                {#each (webhook.subscriptions as string[]) as event}
                  <span class="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    {event}
                  </span>
                {/each}
              </div>
            {/if}
          </td>
          <td class="px-4 py-3">
            <span class="rounded-full px-2 py-0.5 text-xs font-medium {webhook.enabled
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-500'}">
              {webhook.enabled ? "Active" : "Inactive"}
            </span>
          </td>
          <td class="px-4 py-3">
            <form method="POST" action="?/delete" use:enhance>
              <input type="hidden" name="webhookId" value={webhook.id} />
              <button type="submit" class="text-xs text-red-600 hover:text-red-700">
                Delete
              </button>
            </form>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
