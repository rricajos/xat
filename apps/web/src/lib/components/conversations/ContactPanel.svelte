<script lang="ts">
  interface Props {
    contact: {
      id: number;
      name: string | null;
      email: string | null;
      phoneNumber: string | null;
      avatarUrl: string | null;
      additionalAttributes: unknown;
      customAttributes: unknown;
      lastActivityAt: Date | null;
      createdAt: Date;
    };
    previousConversations?: Array<{
      id: number;
      displayId: number;
      status: number;
      lastActivityAt: Date;
    }>;
    labels?: Array<{
      id: number;
      title: string;
      color: string;
    }>;
    conversationLabels?: Array<{
      id: number;
      title: string;
      color: string;
    }>;
  }

  let { contact, previousConversations = [], labels = [], conversationLabels = [] }: Props = $props();

  const initials = $derived(
    (contact.name ?? contact.email ?? "?").slice(0, 2).toUpperCase(),
  );

  const customAttrs = $derived(
    contact.customAttributes && typeof contact.customAttributes === "object"
      ? Object.entries(contact.customAttributes as Record<string, unknown>)
      : [],
  );

  const statusLabels: Record<number, { label: string; color: string }> = {
    0: { label: "Open", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    1: { label: "Resolved", color: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300" },
    2: { label: "Pending", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
    3: { label: "Snoozed", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  };
</script>

<aside class="w-[280px] flex-shrink-0 overflow-y-auto border-l border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
  <!-- Contact Header -->
  <div class="border-b border-gray-200 p-4 text-center dark:border-gray-700">
    {#if contact.avatarUrl}
      <img
        src={contact.avatarUrl}
        alt={contact.name ?? ""}
        class="mx-auto h-16 w-16 rounded-full object-cover"
      />
    {:else}
      <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 text-lg font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
        {initials}
      </div>
    {/if}
    <h3 class="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
      {contact.name ?? "Unknown"}
    </h3>
    {#if contact.email}
      <p class="text-xs text-gray-500 dark:text-gray-400">{contact.email}</p>
    {/if}
  </div>

  <!-- Contact Details -->
  <div class="p-4 space-y-4 border-b border-gray-200 dark:border-gray-700">
    <h4 class="text-xs font-semibold uppercase tracking-wider text-gray-500">
      Contact Information
    </h4>

    {#if contact.email}
      <div>
        <label class="text-xs text-gray-400">Email</label>
        <p class="text-sm text-gray-700 dark:text-gray-300">{contact.email}</p>
      </div>
    {/if}

    {#if contact.phoneNumber}
      <div>
        <label class="text-xs text-gray-400">Phone</label>
        <p class="text-sm text-gray-700 dark:text-gray-300">{contact.phoneNumber}</p>
      </div>
    {/if}

    {#if contact.lastActivityAt}
      <div>
        <label class="text-xs text-gray-400">Last Activity</label>
        <p class="text-sm text-gray-700 dark:text-gray-300">
          {new Date(contact.lastActivityAt).toLocaleDateString()}
        </p>
      </div>
    {/if}

    <div>
      <label class="text-xs text-gray-400">Created</label>
      <p class="text-sm text-gray-700 dark:text-gray-300">
        {new Date(contact.createdAt).toLocaleDateString()}
      </p>
    </div>
  </div>

  <!-- Conversation Labels -->
  {#if conversationLabels.length > 0}
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <h4 class="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
        Labels
      </h4>
      <div class="flex flex-wrap gap-1">
        {#each conversationLabels as label}
          <span
            class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
            style="background-color: {label.color}20; color: {label.color}"
          >
            <span class="h-1.5 w-1.5 rounded-full" style="background-color: {label.color}"></span>
            {label.title}
          </span>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Custom Attributes -->
  {#if customAttrs.length > 0}
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <h4 class="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
        Custom Attributes
      </h4>
      <div class="space-y-2">
        {#each customAttrs as [key, value]}
          <div>
            <label class="text-xs text-gray-400">{key}</label>
            <p class="text-sm text-gray-700 dark:text-gray-300">{String(value)}</p>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Previous Conversations -->
  {#if previousConversations.length > 0}
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <h4 class="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
        Previous Conversations ({previousConversations.length})
      </h4>
      <div class="space-y-1.5">
        {#each previousConversations.slice(0, 5) as conv}
          <a
            href="/app/conversations/{conv.displayId}"
            class="flex items-center justify-between rounded-md px-2 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div class="flex items-center gap-2">
              <span class="text-gray-600 dark:text-gray-300">#{conv.displayId}</span>
              <span class="rounded-full px-1.5 py-0.5 text-[10px] font-medium {statusLabels[conv.status]?.color ?? 'bg-gray-100 text-gray-500'}">
                {statusLabels[conv.status]?.label ?? "Unknown"}
              </span>
            </div>
            <span class="text-gray-400">{new Date(conv.lastActivityAt).toLocaleDateString()}</span>
          </a>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Actions -->
  <div class="p-4">
    <a
      href="/app/contacts/{contact.id}"
      class="block w-full rounded-md bg-gray-100 px-3 py-2 text-center text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
    >
      View Contact Profile
    </a>
  </div>
</aside>
