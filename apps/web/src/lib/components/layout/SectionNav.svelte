<script lang="ts">
  import { page } from "$app/stores";
  import type { Snippet } from "svelte";

  interface NavItem {
    href: string;
    label: string;
    icon?: string;
    badge?: string | number;
  }

  interface NavGroup {
    section?: string;
    items: NavItem[];
  }

  interface Props {
    title: string;
    groups: NavGroup[];
    children?: Snippet;
    exactMatch?: boolean;
  }

  let { title, groups, children, exactMatch = false }: Props = $props();

  function isActive(href: string): boolean {
    if (exactMatch) {
      return $page.url.pathname === href || $page.url.pathname === href + "/";
    }
    return $page.url.pathname.startsWith(href);
  }
</script>

<aside class="flex h-full w-full flex-col overflow-y-auto border-r border-gray-200 bg-white py-4 dark:border-gray-700 dark:bg-gray-900">
  <h2 class="mb-4 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
    {title}
  </h2>

  {#each groups as group, groupIndex}
    {#if groupIndex > 0}
      <div class="mx-4 my-2 border-t border-gray-100 dark:border-gray-800"></div>
    {/if}
    {#if group.section}
      <p class="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
        {group.section}
      </p>
    {/if}
    <nav class="space-y-0.5">
      {#each group.items as item}
        <a
          href={item.href}
          class="flex items-center gap-2.5 px-4 py-2 text-sm {isActive(item.href)
            ? 'bg-blue-50 text-blue-700 font-medium dark:bg-blue-900/20 dark:text-blue-400'
            : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'}"
        >
          {#if item.icon}
            <svg class="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d={item.icon} />
            </svg>
          {/if}
          <span class="truncate">{item.label}</span>
          {#if item.badge != null}
            <span class="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              {item.badge}
            </span>
          {/if}
        </a>
      {/each}
    </nav>
  {/each}

  {#if children}
    <div class="mt-auto border-t border-gray-100 px-4 pt-3 dark:border-gray-800">
      {@render children()}
    </div>
  {/if}
</aside>
