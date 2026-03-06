<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";

  interface CustomFilter {
    id: number;
    name: string;
    query: Record<string, unknown>;
  }

  interface Inbox {
    id: number;
    name: string;
    channelType: string;
  }

  interface Props {
    customFilters: CustomFilter[];
    inboxes?: Inbox[];
  }

  let { customFilters, inboxes = [] }: Props = $props();

  let showNewFilter = $state(false);
  let newFilterName = $state("");

  const statusOptions = [
    { value: "0", label: "Open" },
    { value: "1", label: "Resolved" },
    { value: "2", label: "Pending" },
    { value: "3", label: "Snoozed" },
  ];

  let filterStatus = $state($page.url.searchParams.get("status") ?? "");
  let filterInbox = $state($page.url.searchParams.get("inbox") ?? "");
  let filterAssignee = $state($page.url.searchParams.get("assignee") ?? "");

  function applyFilters() {
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    if (filterInbox) params.set("inbox", filterInbox);
    if (filterAssignee) params.set("assignee", filterAssignee);
    goto(`/app/conversations?${params.toString()}`);
  }

  function clearFilters() {
    filterStatus = "";
    filterInbox = "";
    filterAssignee = "";
    goto("/app/conversations");
  }

  const hasActiveFilters = $derived(!!filterStatus || !!filterInbox || !!filterAssignee);

  async function saveFilter() {
    if (!newFilterName.trim()) return;

    const query: Record<string, string> = {};
    if (filterStatus) query.status = filterStatus;
    if (filterInbox) query.inbox = filterInbox;
    if (filterAssignee) query.assignee = filterAssignee;

    await fetch("/api/v1/custom-filters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newFilterName.trim(),
        filterType: "conversation",
        query,
      }),
    });

    newFilterName = "";
    showNewFilter = false;
    goto($page.url.pathname + $page.url.search, { invalidateAll: true });
  }

  function applyCustomFilter(filter: CustomFilter) {
    const q = filter.query as Record<string, string>;
    const params = new URLSearchParams();
    if (q.status) params.set("status", q.status);
    if (q.inbox) params.set("inbox", q.inbox);
    if (q.assignee) params.set("assignee", q.assignee);
    goto(`/app/conversations?${params.toString()}`);
  }

  async function deleteCustomFilter(filterId: number) {
    await fetch(`/api/v1/custom-filters?id=${filterId}`, { method: "DELETE" });
    goto($page.url.pathname + $page.url.search, { invalidateAll: true });
  }
</script>

<div class="border-b border-gray-100 dark:border-gray-800">
  <!-- Filter pills row -->
  <div class="flex items-center gap-1.5 px-3 py-2 flex-wrap">
    <!-- Status filter -->
    <div class="relative group/status">
      <select bind:value={filterStatus} onchange={applyFilters}
        class="appearance-none cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-medium pr-5 focus:outline-none transition-colors
        {filterStatus
          ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
          : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'}">
        <option value="">Status</option>
        {#each statusOptions as opt}
          <option value={opt.value}>{opt.label}</option>
        {/each}
      </select>
      <svg class="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-2.5 w-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </div>

    <!-- Inbox filter -->
    {#if inboxes.length > 0}
      <div class="relative">
        <select bind:value={filterInbox} onchange={applyFilters}
          class="appearance-none cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-medium pr-5 focus:outline-none transition-colors
          {filterInbox
            ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
            : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'}">
          <option value="">Inbox</option>
          {#each inboxes as inbox}
            <option value={inbox.id}>{inbox.name}</option>
          {/each}
        </select>
        <svg class="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-2.5 w-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    {/if}

    <!-- Assignee filter -->
    <div class="relative">
      <select bind:value={filterAssignee} onchange={applyFilters}
        class="appearance-none cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-medium pr-5 focus:outline-none transition-colors
        {filterAssignee
          ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
          : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'}">
        <option value="">Agent</option>
        <option value="mine">Mine</option>
        <option value="unassigned">Unassigned</option>
      </select>
      <svg class="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-2.5 w-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </div>

    <!-- Clear + Save -->
    <div class="ml-auto flex items-center gap-1">
      {#if hasActiveFilters}
        <button onclick={clearFilters}
          class="flex items-center gap-0.5 rounded-full border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] text-gray-400 hover:border-red-300 hover:bg-red-50 hover:text-red-500 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-red-800 dark:hover:text-red-400 transition-colors"
          title="Clear filters">
          <svg class="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      {/if}
      <button onclick={() => (showNewFilter = !showNewFilter)}
        class="rounded-full border border-dashed border-gray-300 px-2 py-1 text-[11px] text-gray-400 hover:border-blue-400 hover:text-blue-600 dark:border-gray-600 dark:hover:border-blue-600 dark:hover:text-blue-400 transition-colors"
        title="Save as view">
        + Save view
      </button>
    </div>
  </div>

  <!-- Save filter form -->
  {#if showNewFilter}
    <div class="flex gap-2 px-3 pb-2">
      <input type="text" bind:value={newFilterName} placeholder="View name…"
        class="flex-1 rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        onkeydown={(e) => { if (e.key === "Enter") saveFilter(); if (e.key === "Escape") showNewFilter = false; }} />
      <button onclick={saveFilter}
        class="rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
        Save
      </button>
    </div>
  {/if}

  <!-- Saved views -->
  {#if customFilters.length > 0}
    <div class="border-t border-gray-100 dark:border-gray-800 px-3 py-1.5">
      <p class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Saved Views</p>
      <div class="space-y-0.5">
        {#each customFilters as filter}
          <div class="group flex items-center rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/60">
            <button onclick={() => applyCustomFilter(filter)}
              class="flex flex-1 items-center gap-1.5 px-2 py-1.5 text-left text-xs text-gray-600 dark:text-gray-400">
              <svg class="h-3 w-3 flex-shrink-0 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              {filter.name}
            </button>
            <button onclick={() => deleteCustomFilter(filter.id)}
              class="mr-1 hidden rounded p-1 text-gray-300 hover:text-red-500 group-hover:block dark:text-gray-600 dark:hover:text-red-400"
              title="Delete view">
              <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
