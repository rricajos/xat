<script lang="ts">
  import { page } from "$app/stores";
  import ResizablePanel from "$lib/components/layout/ResizablePanel.svelte";

  let { children } = $props();

  const profileNav = [
    {
      section: "Profile",
      items: [
        {
          hash: "online",
          label: "Online",
          icon: "M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418",
        },
        {
          hash: "personal",
          label: "Personal Information",
          icon: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z",
        },
        {
          hash: "language",
          label: "Language & Region",
          icon: "M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802",
        },
        {
          hash: "username",
          label: "Username",
          icon: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10",
        },
        {
          hash: "notifications",
          label: "Notifications",
          icon: "M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0",
        },
      ],
    },
  ];

  const activeHash = $derived($page.url.hash.slice(1) || "online");
  const username = $derived(($page.data as { profile?: { calendarUsername?: string | null } }).profile?.calendarUsername ?? null);
</script>

<div class="flex h-full">
  <ResizablePanel defaultWidth={240} minWidth={180} maxWidth={380} storageKey="panel:secondary">
    <aside class="h-full w-full overflow-y-auto border-r border-gray-200 bg-white py-4 dark:border-gray-700 dark:bg-gray-900">
      <h2 class="px-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">
        {#if username}@{username}{:else}Profile{/if}
      </h2>

      {#each profileNav as group}
        <nav class="space-y-0.5">
          {#each group.items as item}
            {@const isActive = activeHash === item.hash}
            <a
              href="/app/profile#{item.hash}"
              class="flex items-center gap-2.5 px-4 py-2 text-sm {isActive
                ? 'bg-blue-50 text-blue-700 font-medium dark:bg-blue-900/20 dark:text-blue-400'
                : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'}"
            >
              <svg class="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d={item.icon} />
              </svg>
              {item.label}
            </a>
          {/each}
        </nav>
      {/each}
    </aside>
  </ResizablePanel>

  <div class="flex-1 {activeHash === 'online' ? 'overflow-hidden' : 'overflow-y-auto'}">
    {@render children()}
  </div>
</div>
