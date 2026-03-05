<script lang="ts">
  import { page } from "$app/stores";
  import type { SessionUser, SessionAccount } from "$lib/server/auth";
  import NotificationCenter from "./NotificationCenter.svelte";
  import * as m from "$lib/paraglide/messages";

  interface Props {
    user: SessionUser;
    account: SessionAccount;
    labels: { id: number; title: string; color: string | null }[];
    inboxes: { id: number; name: string; channelType: string }[];
    onOpenCommandBar?: () => void;
  }

  let { user, account, labels, inboxes, onOpenCommandBar }: Props = $props();

  let conversationsOpen = $state(true);
  let channelsOpen = $state(true);
  let labelsOpen = $state(true);

  function isActive(href: string): boolean {
    return $page.url.pathname.startsWith(href);
  }

  function isExact(href: string): boolean {
    return $page.url.pathname === href || $page.url.pathname + "/" === href;
  }

  const initials = $derived(
    user.displayName
      ? user.displayName.slice(0, 2).toUpperCase()
      : user.name.slice(0, 2).toUpperCase(),
  );

  function channelIcon(channelType: string): string {
    if (channelType.includes("Whatsapp")) return "whatsapp";
    if (channelType.includes("Email")) return "email";
    if (channelType.includes("Telegram")) return "telegram";
    if (channelType.includes("Facebook")) return "facebook";
    if (channelType.includes("Api")) return "api";
    return "web";
  }
</script>

<aside class="flex h-full w-56 flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
  <!-- Search input -->
  <div class="px-3 pt-3 pb-1">
    <button
      onclick={() => onOpenCommandBar?.()}
      class="flex w-full items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-sm text-gray-400 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-750"
    >
      <svg class="h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
      <span class="text-xs">{m.nav_search()}</span>
      <kbd class="ml-auto rounded border border-gray-300 bg-white px-1 text-[10px] text-gray-400 dark:border-gray-600 dark:bg-gray-700">Ctrl+K</kbd>
    </button>
  </div>

  <!-- My inbox -->
  <div class="px-2 pt-2 pb-1">
    <a
      href="/app/conversations?assignee=mine"
      class="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors {isActive('/app/conversations') && $page.url.searchParams.get('assignee') === 'mine' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'}"
    >
      <svg class="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M12 3v8.25m0 0l-3-3m3 3l3-3" />
      </svg>
      {m.sidebar_my_inbox()}
    </a>
  </div>

  <!-- Scrollable sections -->
  <div class="flex-1 overflow-y-auto px-2 py-1">
    <!-- Conversations section -->
    <div class="mb-1">
      <button
        class="flex w-full items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
        onclick={() => (conversationsOpen = !conversationsOpen)}
      >
        <svg class="h-3 w-3 transition-transform {conversationsOpen ? 'rotate-90' : ''}" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
        </svg>
        {m.nav_conversations()}
      </button>
      {#if conversationsOpen}
        <nav class="mt-0.5 space-y-0.5">
          <a href="/app/conversations" class="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors {isExact('/app/conversations') || isExact('/app/conversations/') ? 'bg-blue-50 text-blue-600 font-medium dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}">
            <svg class="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {m.sidebar_all_conversations()}
          </a>
          <a href="/app/conversations?filter=mentions" class="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">
            <svg class="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 10-2.636 6.364M16.5 12V8.25" />
            </svg>
            {m.sidebar_mentions()}
          </a>
          <a href="/app/conversations?status=0&filter=unattended" class="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">
            <svg class="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {m.sidebar_unattended()}
          </a>
        </nav>
      {/if}
    </div>

    <!-- Channels section -->
    {#if inboxes.length > 0}
      <div class="mb-1">
        <button
          class="flex w-full items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
          onclick={() => (channelsOpen = !channelsOpen)}
        >
          <svg class="h-3 w-3 transition-transform {channelsOpen ? 'rotate-90' : ''}" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
          </svg>
          {m.sidebar_channels()}
        </button>
        {#if channelsOpen}
          <nav class="mt-0.5 space-y-0.5">
            {#each inboxes as inbox}
              <a
                href="/app/conversations?inbox={inbox.id}"
                class="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                {#if channelIcon(inbox.channelType) === "whatsapp"}
                  <svg class="h-4 w-4 flex-shrink-0 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                {:else if channelIcon(inbox.channelType) === "email"}
                  <svg class="h-4 w-4 flex-shrink-0 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                {:else if channelIcon(inbox.channelType) === "telegram"}
                  <svg class="h-4 w-4 flex-shrink-0 text-sky-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>
                {:else if channelIcon(inbox.channelType) === "facebook"}
                  <svg class="h-4 w-4 flex-shrink-0 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 008.44-9.9c0-5.53-4.5-10.02-10-10.02z" />
                  </svg>
                {:else}
                  <svg class="h-4 w-4 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 003 12c0-1.605.42-3.113 1.157-4.418" />
                  </svg>
                {/if}
                <span class="truncate">{inbox.name}</span>
              </a>
            {/each}
          </nav>
        {/if}
      </div>
    {/if}

    <!-- Labels section -->
    {#if labels.length > 0}
      <div class="mb-1">
        <button
          class="flex w-full items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
          onclick={() => (labelsOpen = !labelsOpen)}
        >
          <svg class="h-3 w-3 transition-transform {labelsOpen ? 'rotate-90' : ''}" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
          </svg>
          {m.sidebar_labels()}
        </button>
        {#if labelsOpen}
          <nav class="mt-0.5 space-y-0.5">
            {#each labels as label}
              <a
                href="/app/conversations?label={label.id}"
                class="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                <span class="h-2.5 w-2.5 rounded flex-shrink-0" style="background-color: {label.color ?? '#94a3b8'}"></span>
                <span class="truncate">{label.title}</span>
              </a>
            {/each}
          </nav>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Bottom navigation -->
  <div class="border-t border-gray-100 px-2 py-2 dark:border-gray-800">
    <nav class="space-y-0.5">
      <a href="/app/contacts" class="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors {isActive('/app/contacts') ? 'bg-blue-50 text-blue-600 font-medium dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}">
        <svg class="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        {m.nav_contacts()}
      </a>
      <a href="/app/tickets" class="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors {isActive('/app/tickets') ? 'bg-blue-50 text-blue-600 font-medium dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}">
        <svg class="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
        {m.nav_tickets()}
      </a>
      <a href="/app/reports" class="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors {isActive('/app/reports') ? 'bg-blue-50 text-blue-600 font-medium dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}">
        <svg class="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 13h4v8H3zM10 9h4v12h-4zM17 5h4v16h-4z" />
        </svg>
        {m.nav_reports()}
      </a>
      <a href="/app/campaigns" class="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors {isActive('/app/campaigns') ? 'bg-blue-50 text-blue-600 font-medium dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}">
        <svg class="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
        {m.nav_campaigns()}
      </a>
      <a href="/app/help-center" class="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors {isActive('/app/help-center') ? 'bg-blue-50 text-blue-600 font-medium dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}">
        <svg class="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        {m.nav_help_center()}
      </a>
      <a href="/app/settings" class="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors {isActive('/app/settings') ? 'bg-blue-50 text-blue-600 font-medium dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}">
        <svg class="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        {m.nav_settings()}
      </a>
    </nav>
  </div>

  <!-- User info + notifications -->
  <div class="border-t border-gray-100 px-2 py-2 dark:border-gray-800">
    <div class="flex items-center gap-2">
      <a href="/app/profile" class="flex flex-1 items-center gap-2 rounded-md px-1.5 py-1 hover:bg-gray-50 dark:hover:bg-gray-800 min-w-0">
        <div class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
          {initials}
        </div>
        <div class="min-w-0">
          <p class="truncate text-xs font-medium text-gray-900 dark:text-white">{user.displayName ?? user.name}</p>
          <p class="truncate text-[10px] text-gray-400">{user.email}</p>
        </div>
      </a>
      <NotificationCenter />
    </div>
  </div>
</aside>
