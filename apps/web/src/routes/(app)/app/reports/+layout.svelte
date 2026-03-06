<script lang="ts">
  import { page } from "$app/stores";
  import ResizablePanel from "$lib/components/layout/ResizablePanel.svelte";
  import * as m from "$lib/paraglide/messages";
  import type { Snippet } from "svelte";

  let { children }: { children: Snippet } = $props();

  const navItems = [
    {
      href: "/app/reports",
      label: m.reports_overview(),
      icon: "M3 13h4v8H3zM10 9h4v12h-4zM17 5h4v16h-4z",
      exact: true,
    },
    {
      href: "/app/reports/agents",
      label: m.reports_agents(),
      icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    },
    {
      href: "/app/reports/teams",
      label: m.reports_teams(),
      icon: "M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197",
    },
    {
      href: "/app/reports/inboxes",
      label: m.reports_inboxes(),
      icon: "M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z",
    },
    {
      href: "/app/reports/labels",
      label: m.reports_labels(),
      icon: "M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z M6 6h.008v.008H6V6z",
    },
    {
      href: "/app/reports/csat",
      label: m.reports_csat(),
      icon: "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z",
    },
    {
      href: "/app/reports/sla",
      label: m.reports_sla(),
      icon: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
    },
  ];

  function isActive(href: string, exact = false): boolean {
    if (exact) return $page.url.pathname === href || $page.url.pathname === href + "/";
    return $page.url.pathname.startsWith(href);
  }
</script>

<div class="flex h-full">
  <ResizablePanel defaultWidth={240} minWidth={180} maxWidth={380} storageKey="panel:secondary">
    <aside class="flex h-full w-full flex-col overflow-y-auto border-r border-gray-200 bg-white py-4 dark:border-gray-700 dark:bg-gray-900">
      <h2 class="mb-4 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {m.reports_title()}
      </h2>
      <nav class="space-y-0.5">
        {#each navItems as item}
          <a
            href={item.href}
            class="flex items-center gap-2.5 px-4 py-2 text-sm {isActive(item.href, item.exact)
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
    </aside>
  </ResizablePanel>

  <div class="flex flex-1 flex-col overflow-y-auto bg-white dark:bg-gray-950">
    {@render children()}
  </div>
</div>
