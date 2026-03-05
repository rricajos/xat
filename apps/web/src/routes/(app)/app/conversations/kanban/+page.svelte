<script lang="ts">
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const statusConfig: Record<number, { label: string; color: string; bg: string; border: string }> = {
    0: { label: "Open", color: "text-green-700", bg: "bg-green-50", border: "border-green-200" },
    2: { label: "Pending", color: "text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-200" },
    3: { label: "Snoozed", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
    1: { label: "Resolved", color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200" },
  };

  const columnOrder = [0, 2, 3, 1];

  function formatTime(date: Date): string {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return d.toLocaleDateString();
  }

  function truncate(text: string | null, max: number): string {
    if (!text) return "";
    return text.length > max ? text.slice(0, max) + "..." : text;
  }

  const priorityLabels: Record<number, { text: string; class: string }> = {
    0: { text: "None", class: "" },
    1: { text: "Low", class: "text-blue-600 bg-blue-50" },
    2: { text: "Medium", class: "text-yellow-600 bg-yellow-50" },
    3: { text: "High", class: "text-orange-600 bg-orange-50" },
    4: { text: "Urgent", class: "text-red-600 bg-red-50" },
  };
</script>

<div class="flex h-full flex-col bg-gray-100 dark:bg-gray-950">
  <!-- Header -->
  <div class="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3 dark:border-gray-700 dark:bg-gray-900">
    <div class="flex items-center gap-3">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Kanban</h2>
      <a
        href="/app/conversations"
        class="rounded-md px-2.5 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
      >
        List view
      </a>
    </div>
  </div>

  <!-- Board -->
  <div class="flex flex-1 gap-4 overflow-x-auto p-4">
    {#each columnOrder as status}
      {@const config = statusConfig[status]!}
      {@const conversations = data.columns[status] ?? []}
      <div class="flex w-72 flex-shrink-0 flex-col rounded-lg border {config.border} bg-white dark:border-gray-700 dark:bg-gray-900">
        <!-- Column Header -->
        <div class="flex items-center justify-between px-3 py-2.5 border-b {config.border} dark:border-gray-700">
          <div class="flex items-center gap-2">
            <span class="inline-flex h-2.5 w-2.5 rounded-full {config.bg.replace('50', '500')}"></span>
            <span class="text-sm font-semibold {config.color} dark:text-gray-200">{config.label}</span>
          </div>
          <span class="rounded-full {config.bg} px-2 py-0.5 text-xs font-medium {config.color}">
            {conversations.length}
          </span>
        </div>

        <!-- Cards -->
        <div class="flex-1 overflow-y-auto p-2 space-y-2">
          {#if conversations.length === 0}
            <div class="flex h-24 items-center justify-center text-xs text-gray-400">
              No conversations
            </div>
          {:else}
            {#each conversations as conv}
              <a
                href="/app/conversations/{conv.displayId}"
                class="block rounded-lg border border-gray-150 bg-white p-3 shadow-sm transition-all hover:shadow-md hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
              >
                <!-- Top row: contact + time -->
                <div class="flex items-start justify-between gap-2">
                  <div class="flex items-center gap-2 min-w-0">
                    {#if conv.contact.avatarUrl}
                      <img
                        src={conv.contact.avatarUrl}
                        alt=""
                        class="h-6 w-6 flex-shrink-0 rounded-full object-cover"
                      />
                    {:else}
                      <div class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-[10px] font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        {(conv.contact.name ?? conv.contact.email ?? "?").slice(0, 2).toUpperCase()}
                      </div>
                    {/if}
                    <span class="truncate text-sm font-medium text-gray-900 dark:text-white">
                      {conv.contact.name ?? conv.contact.email ?? "Unknown"}
                    </span>
                  </div>
                  <span class="flex-shrink-0 text-[10px] text-gray-400">
                    {formatTime(conv.lastActivityAt)}
                  </span>
                </div>

                <!-- Last message preview -->
                {#if conv.lastMessage?.content}
                  <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                    {truncate(conv.lastMessage.content, 80)}
                  </p>
                {/if}

                <!-- Bottom row: inbox, assignee, id -->
                <div class="mt-2 flex items-center justify-between">
                  <div class="flex items-center gap-1.5 min-w-0">
                    <span class="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                      {conv.inbox.name}
                    </span>
                    {#if conv.priority && conv.priority > 0}
                      {@const p = priorityLabels[conv.priority]}
                      {#if p}
                        <span class="rounded px-1.5 py-0.5 text-[10px] font-medium {p.class}">
                          {p.text}
                        </span>
                      {/if}
                    {/if}
                  </div>
                  <div class="flex items-center gap-1.5">
                    {#if conv.assignee}
                      {#if conv.assignee.avatarUrl}
                        <img
                          src={conv.assignee.avatarUrl}
                          alt={conv.assignee.name}
                          class="h-4 w-4 rounded-full object-cover"
                          title={conv.assignee.name}
                        />
                      {:else}
                        <div
                          class="flex h-4 w-4 items-center justify-center rounded-full bg-blue-100 text-[8px] font-medium text-blue-700"
                          title={conv.assignee.name}
                        >
                          {conv.assignee.name.slice(0, 1).toUpperCase()}
                        </div>
                      {/if}
                    {/if}
                    <span class="text-[10px] text-gray-400">#{conv.displayId}</span>
                  </div>
                </div>
              </a>
            {/each}
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>
