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

<div class="border-b border-gray-200 px-3 py-2 dark:border-gray-800">
  <div class="flex items-center gap-2 flex-wrap">
    <select
      bind:value={filterStatus}
      onchange={applyFilters}
      class="rounded border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
    >
      <option value="">All Status</option>
      {#each statusOptions as opt}
        <option value={opt.value}>{opt.label}</option>
      {/each}
    </select>

    {#if inboxes.length > 0}
      <select
        bind:value={filterInbox}
        onchange={applyFilters}
        class="rounded border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      >
        <option value="">All Inboxes</option>
        {#each inboxes as inbox}
          <option value={inbox.id}>{inbox.name}</option>
        {/each}
      </select>
    {/if}

    <select
      bind:value={filterAssignee}
      onchange={applyFilters}
      class="rounded border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
    >
      <option value="">All Agents</option>
      <option value="mine">Mine</option>
      <option value="unassigned">Unassigned</option>
    </select>

    {#if hasActiveFilters}
      <button
        onclick={clearFilters}
        class="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        title="Clear filters"
      >
        Clear
      </button>
    {/if}

    <button
      onclick={() => (showNewFilter = !showNewFilter)}
      class="ml-auto text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
      title="Save current filter as custom view"
    >
      Save
    </button>
  </div>

  {#if showNewFilter}
    <div class="mt-2 flex gap-2">
      <input
        type="text"
        bind:value={newFilterName}
        placeholder="Filter name..."
        class="flex-1 rounded border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        onkeydown={(e) => { if (e.key === "Enter") saveFilter(); }}
      />
      <button
        onclick={saveFilter}
        class="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
      >
        Save
      </button>
    </div>
  {/if}

  {#if customFilters.length > 0}
    <div class="mt-2 space-y-0.5">
      <p class="text-[10px] font-semibold uppercase text-gray-400">Saved Views</p>
      {#each customFilters as filter}
        <div class="flex items-center group">
          <button
            onclick={() => applyCustomFilter(filter)}
            class="flex-1 rounded px-2 py-1 text-left text-xs text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            {filter.name}
          </button>
          <button
            onclick={() => deleteCustomFilter(filter.id)}
            class="hidden group-hover:block rounded p-0.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
            title="Delete view"
          >
            <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      {/each}
    </div>
  {/if}
</div>
