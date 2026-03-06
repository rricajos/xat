<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import ResizablePanel from "$lib/components/layout/ResizablePanel.svelte";
  import type { LayoutData } from "./$types";
  import type { Snippet } from "svelte";

  let { data, children }: { data: LayoutData; children: Snippet } = $props();

  let showSegmentForm = $state(false);
  let segmentName = $state("");

  function isActive(href: string): boolean {
    return $page.url.pathname === href || $page.url.pathname === href + "/";
  }

  async function saveSegment() {
    if (!segmentName.trim()) return;
    const search = $page.url.searchParams.get("search");
    const query: Record<string, unknown> = {};
    if (search) query.search = search;

    await fetch("/api/v1/custom-filters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: segmentName.trim(),
        filterType: "contact",
        query,
      }),
    });

    segmentName = "";
    showSegmentForm = false;
    goto("/app/contacts", { invalidateAll: true });
  }

  async function deleteSegment(id: number) {
    await fetch(`/api/v1/custom-filters/${id}`, { method: "DELETE" });
    goto("/app/contacts", { invalidateAll: true });
  }

  function applySegment(query: Record<string, unknown>) {
    const params = new URLSearchParams();
    if (query.search) params.set("search", query.search as string);
    goto(`/app/contacts?${params.toString()}`);
  }
</script>

<div class="flex h-full">
  <ResizablePanel defaultWidth={240} minWidth={180} maxWidth={380} storageKey="panel:secondary">
    <aside class="flex h-full w-full flex-col overflow-y-auto border-r border-gray-200 bg-white py-4 dark:border-gray-700 dark:bg-gray-900">
      <h2 class="mb-4 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        Contacts
      </h2>

      <nav class="space-y-0.5 px-2">
        <a
          href="/app/contacts"
          class="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm {isActive('/app/contacts')
            ? 'bg-blue-50 text-blue-700 font-medium dark:bg-blue-900/20 dark:text-blue-400'
            : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'}"
        >
          <svg class="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          All Contacts
        </a>
        <a
          href="/app/contacts/new"
          class="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm {isActive('/app/contacts/new')
            ? 'bg-blue-50 text-blue-700 font-medium dark:bg-blue-900/20 dark:text-blue-400'
            : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'}"
        >
          <svg class="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
          </svg>
          New Contact
        </a>
      </nav>

      {#if data.segments.length > 0}
        <div class="mx-4 my-3 border-t border-gray-100 dark:border-gray-800"></div>
        <p class="px-4 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Segments
        </p>
        <nav class="space-y-0.5 px-2">
          {#each data.segments as segment}
            <div class="group flex items-center gap-1">
              <button
                onclick={() => applySegment(segment.query as Record<string, unknown>)}
                class="flex flex-1 items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800 min-w-0"
              >
                <svg class="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
                </svg>
                <span class="truncate">{segment.name}</span>
              </button>
              <button
                onclick={() => deleteSegment(segment.id)}
                class="hidden group-hover:flex mr-1 h-5 w-5 shrink-0 items-center justify-center rounded text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
              >
                <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          {/each}
        </nav>
      {/if}

      <!-- Save segment footer -->
      <div class="mt-auto border-t border-gray-100 px-4 pt-3 dark:border-gray-800">
        {#if showSegmentForm}
          <div class="space-y-1.5">
            <input
              type="text"
              bind:value={segmentName}
              placeholder="Segment name"
              class="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
            <div class="flex gap-1">
              <button
                onclick={saveSegment}
                class="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700"
              >Save</button>
              <button
                onclick={() => { showSegmentForm = false; segmentName = ""; }}
                class="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
              >Cancel</button>
            </div>
          </div>
        {:else}
          <button
            onclick={() => (showSegmentForm = true)}
            class="w-full rounded-md border border-dashed border-gray-300 px-3 py-1.5 text-xs text-gray-400 hover:border-gray-400 hover:text-gray-500 dark:border-gray-600 dark:hover:border-gray-500"
          >
            + Save current filter
          </button>
        {/if}
      </div>
    </aside>
  </ResizablePanel>

  <div class="flex flex-1 flex-col overflow-hidden">
    {@render children()}
  </div>
</div>
