<script lang="ts">
  import * as m from "$lib/paraglide/messages";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const channelIcons: Record<string, string> = {
    web_widget: "Globe",
    email: "Mail",
    api: "Code",
    whatsapp: "WhatsApp",
    facebook: "Facebook",
    telegram: "Telegram",
    twitter: "Twitter",
    instagram: "Instagram",
  };
</script>

<div class="p-6">
  <div class="flex items-center justify-between mb-6">
    <div>
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{m.settings_inboxes()}</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400">{m.settings_inboxes_description()}</p>
    </div>
    <a
      href="/app/settings/inboxes/new"
      class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
    >
      Add Inbox
    </a>
  </div>

  <div class="space-y-2">
    {#each data.inboxes as inbox}
      <div class="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-xs font-medium text-gray-600">
            {channelIcons[inbox.channelType] ?? inbox.channelType}
          </div>
          <div>
            <p class="text-sm font-medium text-gray-900">{inbox.name}</p>
            <p class="text-xs text-gray-500">{inbox.channelType}</p>
          </div>
        </div>
        <a
          href="/app/settings/inboxes/{inbox.id}"
          class="text-xs text-blue-600 hover:text-blue-700"
        >
          Settings
        </a>
      </div>
    {/each}

    {#if data.inboxes.length === 0}
      <p class="text-center text-sm text-gray-400 py-8">No inboxes yet. Create one to start receiving messages.</p>
    {/if}
  </div>
</div>
