<script lang="ts">
  import { enhance } from "$app/forms";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let audienceType = $state<"all" | "label">("all");
  let selectedLabels = $state<number[]>(
    Array.isArray(data.campaign.audience)
      ? (data.campaign.audience as Array<{ type?: string; labelId?: number }>)
          .filter((a) => a.type === "label" && a.labelId)
          .map((a) => a.labelId!)
      : [],
  );

  const triggerRules = $derived(
    (data.campaign.triggerRules ?? {}) as {
      url?: string;
      timeOnPage?: number;
    },
  );

  let triggerUrl = $state(triggerRules.url ?? "");
  let triggerTimeOnPage = $state(triggerRules.timeOnPage ?? 0);

  function buildAudienceJson(): string {
    if (audienceType === "all") return "[]";
    return JSON.stringify(
      selectedLabels.map((id) => ({ type: "label", labelId: id })),
    );
  }

  function buildTriggerRulesJson(): string {
    const rules: Record<string, unknown> = {};
    if (triggerUrl.trim()) rules.url = triggerUrl.trim();
    if (triggerTimeOnPage > 0) rules.timeOnPage = triggerTimeOnPage;
    return JSON.stringify(rules);
  }

  function toggleLabel(id: number) {
    if (selectedLabels.includes(id)) {
      selectedLabels = selectedLabels.filter((l) => l !== id);
    } else {
      selectedLabels = [...selectedLabels, id];
    }
  }

  $effect(() => {
    if (selectedLabels.length > 0) {
      audienceType = "label";
    }
  });
</script>

<div class="h-full overflow-y-auto bg-white dark:bg-gray-950">
  <div class="mx-auto max-w-3xl p-6">
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <a href="/app/campaigns" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </a>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Edit Campaign</h2>
      </div>

      <div class="flex items-center gap-2">
        <span class="rounded-full px-2.5 py-0.5 text-xs font-medium {data.campaign.enabled
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}">
          {data.campaign.enabled ? "Active" : "Paused"}
        </span>
        <form method="POST" action="?/toggleEnabled" use:enhance>
          <button
            type="submit"
            class="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            {data.campaign.enabled ? "Pause" : "Enable"}
          </button>
        </form>
        <span class="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          {data.campaign.campaignType === "one_off" ? "One-off" : "Ongoing"}
        </span>
      </div>
    </div>

    <form method="POST" action="?/save" use:enhance class="space-y-6">
      <!-- Basic Info -->
      <section class="rounded-lg border border-gray-200 p-4 space-y-4 dark:border-gray-700">
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Campaign Details</h3>

        <div>
          <label for="camp-title" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
          <input
            id="camp-title"
            name="title"
            type="text"
            required
            value={data.campaign.title}
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div>
          <label for="camp-desc" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
          <input
            id="camp-desc"
            name="description"
            type="text"
            value={data.campaign.description ?? ""}
            placeholder="Optional description"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div>
          <label for="camp-message" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
          <textarea
            id="camp-message"
            name="message"
            rows="4"
            required
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >{data.campaign.message}</textarea>
        </div>

        <label class="flex items-center gap-2">
          <input type="checkbox" name="enabled" checked={data.campaign.enabled ?? true} class="rounded border-gray-300 text-blue-600" />
          <span class="text-sm text-gray-700 dark:text-gray-300">Campaign enabled</span>
        </label>
      </section>

      <!-- Audience Targeting -->
      <section class="rounded-lg border border-gray-200 p-4 space-y-4 dark:border-gray-700">
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Audience</h3>

        <div class="flex gap-3">
          <label class="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800">
            <input type="radio" bind:group={audienceType} value="all" class="text-blue-600" />
            <span class="text-sm text-gray-700 dark:text-gray-300">All contacts</span>
          </label>
          <label class="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800">
            <input type="radio" bind:group={audienceType} value="label" class="text-blue-600" />
            <span class="text-sm text-gray-700 dark:text-gray-300">By label</span>
          </label>
        </div>

        {#if audienceType === "label"}
          <div class="flex flex-wrap gap-2">
            {#each data.labels as label}
              <button
                type="button"
                onclick={() => toggleLabel(label.id)}
                class="rounded-full px-3 py-1 text-xs font-medium border transition-colors {selectedLabels.includes(label.id)
                  ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-400'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400'}"
              >
                {label.title}
              </button>
            {/each}
            {#if data.labels.length === 0}
              <p class="text-xs text-gray-400">No labels available. Create labels in Settings first.</p>
            {/if}
          </div>
        {/if}

        <input type="hidden" name="audience" value={buildAudienceJson()} />
      </section>

      <!-- Trigger Rules (for ongoing campaigns) -->
      {#if data.campaign.campaignType === "ongoing"}
        <section class="rounded-lg border border-gray-200 p-4 space-y-4 dark:border-gray-700">
          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Trigger Rules</h3>
          <p class="text-xs text-gray-400">Define when this campaign message should be shown to visitors.</p>

          <div>
            <label for="trigger-url" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Page URL contains</label>
            <input
              id="trigger-url"
              type="text"
              bind:value={triggerUrl}
              placeholder="e.g. /pricing"
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label for="trigger-time" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Time on page (seconds)</label>
            <input
              id="trigger-time"
              type="number"
              min="0"
              bind:value={triggerTimeOnPage}
              placeholder="0"
              class="mt-1 block w-32 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <input type="hidden" name="triggerRules" value={buildTriggerRulesJson()} />
        </section>
      {/if}

      <!-- Scheduling (for one-off campaigns) -->
      {#if data.campaign.campaignType === "one_off"}
        <section class="rounded-lg border border-gray-200 p-4 space-y-4 dark:border-gray-700">
          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Schedule</h3>

          <div>
            <label for="scheduled-at" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Send at</label>
            <input
              id="scheduled-at"
              name="scheduledAt"
              type="datetime-local"
              value={data.campaign.scheduledAt ? new Date(data.campaign.scheduledAt).toISOString().slice(0, 16) : ""}
              class="mt-1 block w-64 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
            <p class="mt-1 text-xs text-gray-400">Leave empty to send immediately when enabled.</p>
          </div>

          <input type="hidden" name="triggerRules" value={"{}"} />
        </section>
      {/if}

      <!-- Inbox -->
      {#if data.inboxes.length > 0}
        <section class="rounded-lg border border-gray-200 p-4 space-y-4 dark:border-gray-700">
          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Send via Inbox</h3>
          <p class="text-xs text-gray-400">
            Current inbox: {data.inboxes.find((i) => i.id === data.campaign.inboxId)?.name ?? "Not selected"}
          </p>
        </section>
      {/if}

      <div class="flex justify-end">
        <button
          type="submit"
          class="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Save Campaign
        </button>
      </div>
    </form>
  </div>
</div>
