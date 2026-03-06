<script lang="ts">
  import { enhance } from "$app/forms";
  import { page } from "$app/stores";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  let showForm = $state(false);

  const activeType = $derived($page.url.searchParams.get("type") ?? null);
  const filtered = $derived(
    activeType ? data.campaigns.filter((c) => c.campaignType === activeType) : data.campaigns,
  );
</script>

<div class="h-full overflow-y-auto bg-white dark:bg-gray-950">
  <div class="max-w-6xl p-6">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
        {activeType === "ongoing" ? "Ongoing" : activeType === "one_off" ? "One-off" : "All"} Campaigns
      </h2>
      <button
        onclick={() => showForm = !showForm}
        class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        {showForm ? "Cancel" : "Create Campaign"}
      </button>
    </div>

    {#if showForm}
      <form method="POST" action="?/create" use:enhance class="mb-6 rounded-lg border border-gray-200 p-4 space-y-4">
        <div>
          <label for="title" class="block text-sm font-medium text-gray-700">Title</label>
          <input
            id="title"
            name="title"
            type="text"
            required
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label for="message" class="block text-sm font-medium text-gray-700">Message</label>
          <textarea
            id="message"
            name="message"
            rows="3"
            required
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          ></textarea>
        </div>
        <div>
          <label for="campaignType" class="block text-sm font-medium text-gray-700">Type</label>
          <select
            id="campaignType"
            name="campaignType"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ongoing">Ongoing</option>
            <option value="one_off">One-off</option>
          </select>
        </div>
        <button type="submit" class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Create Campaign
        </button>
      </form>
    {/if}

    <div class="space-y-2">
      {#each filtered as campaign}
        <div class="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition-colors">
          <a href="/app/campaigns/{campaign.id}" class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <p class="text-sm font-medium text-gray-900 dark:text-white">{campaign.title}</p>
              <span class="rounded-full px-2 py-0.5 text-[10px] font-medium {campaign.enabled
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}">
                {campaign.enabled ? "Active" : "Paused"}
              </span>
              {#if campaign.scheduledAt}
                <span class="text-[10px] text-gray-400">
                  Scheduled: {new Date(campaign.scheduledAt).toLocaleString()}
                </span>
              {/if}
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate max-w-lg">{campaign.message}</p>
          </a>
          <div class="flex items-center gap-2 ml-3 flex-shrink-0">
            <a href="/app/campaigns/{campaign.id}" class="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400">Edit</a>
            <form method="POST" action="?/delete" use:enhance>
              <input type="hidden" name="campaignId" value={campaign.id} />
              <button type="submit" class="text-xs text-red-600 hover:text-red-700">Delete</button>
            </form>
          </div>
        </div>
      {/each}

      {#if filtered.length === 0}
        <p class="text-center text-sm text-gray-400 dark:text-gray-500 py-8">
          No {activeType === "ongoing" ? "ongoing" : activeType === "one_off" ? "one-off" : ""} campaigns yet
        </p>
      {/if}
    </div>
  </div>
</div>
