<script lang="ts">
  import { page } from "$app/stores";
  import ResizablePanel from "$lib/components/layout/ResizablePanel.svelte";
  import type { Snippet } from "svelte";

  let { children }: { children: Snippet } = $props();

  function isType(type: string): boolean {
    return ($page.url.searchParams.get("type") ?? "ongoing") === type;
  }

  function isAllActive(): boolean {
    return !$page.url.searchParams.has("type");
  }
</script>

<div class="flex h-full">
  <ResizablePanel defaultWidth={240} minWidth={180} maxWidth={380} storageKey="panel:secondary">
    <aside class="flex h-full w-full flex-col overflow-y-auto border-r border-gray-200 bg-white py-4 dark:border-gray-700 dark:bg-gray-900">
      <h2 class="mb-4 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        Campaigns
      </h2>

      <nav class="space-y-0.5">
        <a
          href="/app/campaigns"
          class="flex items-center gap-2.5 px-4 py-2 text-sm {isAllActive()
            ? 'bg-blue-50 text-blue-700 font-medium dark:bg-blue-900/20 dark:text-blue-400'
            : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'}"
        >
          <svg class="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
          All Campaigns
        </a>
        <a
          href="/app/campaigns?type=ongoing"
          class="flex items-center gap-2.5 px-4 py-2 text-sm {isType('ongoing') && !isAllActive()
            ? 'bg-blue-50 text-blue-700 font-medium dark:bg-blue-900/20 dark:text-blue-400'
            : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'}"
        >
          <svg class="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" />
          </svg>
          Ongoing
        </a>
        <a
          href="/app/campaigns?type=one_off"
          class="flex items-center gap-2.5 px-4 py-2 text-sm {isType('one_off') && !isAllActive()
            ? 'bg-blue-50 text-blue-700 font-medium dark:bg-blue-900/20 dark:text-blue-400'
            : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'}"
        >
          <svg class="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          One-off
        </a>
      </nav>
    </aside>
  </ResizablePanel>

  <div class="flex flex-1 flex-col overflow-y-auto bg-white dark:bg-gray-950">
    {@render children()}
  </div>
</div>
