<script lang="ts">
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import ConversationList from "$lib/components/conversations/ConversationList.svelte";
  import ConversationFilters from "$lib/components/conversations/ConversationFilters.svelte";
  import type { LayoutData } from "./$types";
  import type { Snippet } from "svelte";

  let { data, children }: { data: LayoutData; children: Snippet } = $props();

  let isKanban = $derived($page.url.pathname.includes("/kanban"));

  // Keyboard shortcut: press C to open compose (when not in an input)
  $effect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        (e.target as HTMLElement).isContentEditable
      )
        return;
      if (e.key === "c" || e.key === "C") goto("/app/conversations/new");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
</script>

{#if isKanban}
  {@render children()}
{:else}
  <div class="flex h-full">
    <!-- Conversation List Panel -->
    <div class="flex w-80 flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <!-- Header -->
      <div
        class="flex items-center justify-between border-b border-gray-100 px-3 py-2.5 dark:border-gray-800"
      >
        <div class="flex items-center gap-2">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Conversations</h2>
          <span
            class="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          >
            Open
          </span>
        </div>
        <div class="flex items-center gap-1">
          <!-- New conversation -->
          <a
            href="/app/conversations/new"
            class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
            title="New conversation (C)"
          >
            <svg
              class="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="1.5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
              />
            </svg>
          </a>
          <!-- Sort -->
          <button
            class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
            title="Sort"
          >
            <svg
              class="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="1.5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5-4.5L16.5 16.5m0 0L12 12m4.5 4.5V3"
              />
            </svg>
          </button>
          <!-- Filter -->
          <button
            class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
            title="Filter"
          >
            <svg
              class="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="1.5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"
              />
            </svg>
          </button>
          <!-- Kanban toggle -->
          <a
            href="/app/conversations/kanban"
            class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
            title="Kanban view"
          >
            <svg
              class="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <rect x="3" y="3" width="5" height="18" rx="1" />
              <rect x="10" y="3" width="5" height="12" rx="1" />
              <rect x="17" y="3" width="5" height="15" rx="1" />
            </svg>
          </a>
        </div>
      </div>

      <!-- Status Tabs (Mine / Unassigned / All) -->
      <div class="flex border-b border-gray-100 dark:border-gray-800">
        {#each [
          { label: "Mine", count: null, href: "/app/conversations?status=0" },
          { label: "Unassigned", count: null, href: "/app/conversations?status=0&assignee=unassigned" },
          { label: "All", count: data.total, href: "/app/conversations" },
        ] as tab}
          <a
            href={tab.href}
            class="flex-1 py-2 text-center text-[11px] font-medium transition-colors {$page.url.href.includes(
              tab.href.split('?')[1] ?? '__none__',
            ) || (tab.label === 'All' && !$page.url.searchParams.has('status'))
              ? 'text-blue-600 border-b-2 border-blue-600 -mb-px'
              : 'text-gray-400 hover:text-gray-600 dark:text-gray-500'}"
          >
            {tab.label}
            {#if tab.count != null}
              <span class="ml-0.5 text-[10px]">{tab.count}</span>
            {/if}
          </a>
        {/each}
      </div>

      <!-- Filters -->
      <ConversationFilters
        customFilters={data.customFilters as { id: number; name: string; query: Record<string, unknown> }[]}
        inboxes={($page.data.inboxes ?? []) as { id: number; name: string; channelType: string }[]}
      />

      <!-- List -->
      <ConversationList conversations={data.conversations} />
    </div>

    <!-- Detail Panel -->
    <div class="flex flex-1 flex-col">
      {@render children()}
    </div>
  </div>
{/if}
