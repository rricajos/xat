<script lang="ts">
  import { page } from "$app/stores";
  import ResizablePanel from "$lib/components/layout/ResizablePanel.svelte";
  import type { LayoutData } from "./$types";
  import type { Snippet } from "svelte";

  let { data, children }: { data: LayoutData; children: Snippet } = $props();

  function isActive(href: string): boolean {
    return $page.url.pathname === href || $page.url.pathname === href + "/";
  }

  function isPrefix(href: string): boolean {
    return $page.url.pathname.startsWith(href);
  }
</script>

<div class="flex h-full">
  <ResizablePanel defaultWidth={240} minWidth={180} maxWidth={380} storageKey="panel:secondary">
    <aside class="flex h-full w-full flex-col overflow-y-auto border-r border-gray-200 bg-white py-4 dark:border-gray-700 dark:bg-gray-900">
      <h2 class="mb-4 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        Help Center
      </h2>

      <nav class="space-y-0.5">
        <a
          href="/app/help-center"
          class="flex items-center gap-2.5 px-4 py-2 text-sm {isActive('/app/help-center')
            ? 'bg-blue-50 text-blue-700 font-medium dark:bg-blue-900/20 dark:text-blue-400'
            : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'}"
        >
          <svg class="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          All Portals
        </a>
      </nav>

      {#if data.portals.length > 0}
        <div class="mx-4 my-3 border-t border-gray-100 dark:border-gray-800"></div>
        <p class="px-4 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Portals
        </p>
        <nav class="space-y-0.5">
          {#each data.portals as portal}
            <a
              href="/app/help-center/{portal.id}"
              class="flex items-center gap-2.5 px-4 py-2 text-sm {isPrefix('/app/help-center/' + portal.id)
                ? 'bg-blue-50 text-blue-700 font-medium dark:bg-blue-900/20 dark:text-blue-400'
                : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'}"
            >
              <svg class="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span class="truncate">{portal.name}</span>
              {#if portal.archived}
                <span class="ml-auto shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500 dark:bg-gray-800 dark:text-gray-500">
                  Archived
                </span>
              {/if}
            </a>
          {/each}
        </nav>
      {/if}
    </aside>
  </ResizablePanel>

  <div class="flex flex-1 flex-col overflow-y-auto bg-white dark:bg-gray-950">
    {@render children()}
  </div>
</div>
