<script lang="ts">
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import PresenceIndicator from "$lib/components/PresenceIndicator.svelte";
  import type { ConversationListItem } from "$lib/server/services/conversation.service";

  interface Props {
    conversations: ConversationListItem[];
  }

  let { conversations }: Props = $props();

  let selectedIds = $state<Set<number>>(new Set());
  let bulkMode = $state(false);
  let bulkProcessing = $state(false);

  function isActive(id: number): boolean {
    return $page.params.id === String(id);
  }

  function toggleSelect(id: number) {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    selectedIds = next;
    if (next.size === 0) bulkMode = false;
  }

  function toggleSelectAll() {
    if (selectedIds.size === conversations.length) {
      selectedIds = new Set();
    } else {
      selectedIds = new Set(conversations.map((c) => c.id));
    }
  }

  function exitBulk() {
    selectedIds = new Set();
    bulkMode = false;
  }

  async function bulkAction(action: string, params?: Record<string, unknown>) {
    if (selectedIds.size === 0) return;
    bulkProcessing = true;
    try {
      await fetch("/api/v1/conversations/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationIds: Array.from(selectedIds),
          action,
          params,
        }),
      });
      exitBulk();
      goto($page.url.pathname + $page.url.search, { invalidateAll: true });
    } finally {
      bulkProcessing = false;
    }
  }

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

  const statusColors: Record<number, string> = {
    0: "bg-green-500",
    1: "bg-gray-400",
    2: "bg-yellow-500",
    3: "bg-blue-400",
  };
</script>

<!-- Bulk Actions Bar -->
{#if bulkMode && selectedIds.size > 0}
  <div
    class="flex items-center gap-2 border-b border-gray-200 bg-blue-50 px-3 py-2 dark:border-gray-700 dark:bg-blue-900/20"
  >
    <button
      onclick={toggleSelectAll}
      class="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
    >
      {selectedIds.size === conversations.length ? "Deselect All" : "Select All"}
    </button>
    <span class="text-xs text-gray-500 dark:text-gray-400">
      {selectedIds.size} selected
    </span>
    <div class="ml-auto flex gap-1">
      <button
        onclick={() => bulkAction("resolve")}
        disabled={bulkProcessing}
        class="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-200 disabled:opacity-50 dark:bg-green-900/30 dark:text-green-400"
      >
        Resolve
      </button>
      <button
        onclick={() => bulkAction("reopen")}
        disabled={bulkProcessing}
        class="rounded bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700 hover:bg-yellow-200 disabled:opacity-50 dark:bg-yellow-900/30 dark:text-yellow-400"
      >
        Reopen
      </button>
      <button
        onclick={() => bulkAction("unassign")}
        disabled={bulkProcessing}
        class="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300"
      >
        Unassign
      </button>
      <button
        onclick={exitBulk}
        class="rounded px-2 py-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        Cancel
      </button>
    </div>
  </div>
{/if}

<div class="flex-1 overflow-y-auto">
  {#if conversations.length === 0}
    <div class="flex h-full items-center justify-center text-sm text-gray-400">
      No conversations found
    </div>
  {:else}
    {#each conversations as conversation}
      <div
        class="flex border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800 {isActive(conversation.displayId)
          ? 'bg-blue-50 border-l-2 border-l-blue-600 dark:bg-blue-900/20'
          : ''}"
      >
        {#if bulkMode}
          <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
          <div class="flex items-center pl-3" onclick={() => toggleSelect(conversation.id)}>
            <input
              type="checkbox"
              checked={selectedIds.has(conversation.id)}
              class="h-3.5 w-3.5 rounded border-gray-300"
              tabindex={-1}
            />
          </div>
        {/if}

        <a
          href="/app/conversations/{conversation.displayId}"
          class="flex flex-1 gap-3 px-4 py-3"
          oncontextmenu={(e) => {
            e.preventDefault();
            bulkMode = true;
            toggleSelect(conversation.id);
          }}
        >
          <!-- Contact Avatar -->
          <div class="relative flex-shrink-0">
            {#if conversation.contact.avatarUrl}
              <img
                src={conversation.contact.avatarUrl}
                alt={conversation.contact.name ?? ""}
                class="h-9 w-9 rounded-full object-cover"
              />
            {:else}
              <div
                class="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300"
              >
                {(conversation.contact.name ?? conversation.contact.email ?? "?")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
            {/if}
            <span
              class="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-gray-900 {statusColors[conversation.status] ?? 'bg-gray-400'}"
            ></span>
          </div>

          <!-- Content -->
          <div class="min-w-0 flex-1">
            <div class="flex items-center justify-between">
              <span class="truncate text-sm font-medium text-gray-900 dark:text-white">
                {conversation.contact.name ?? conversation.contact.email ?? "Unknown"}
              </span>
              <span class="flex-shrink-0 text-xs text-gray-400">
                {formatTime(conversation.lastActivityAt)}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <p class="truncate text-xs text-gray-500 dark:text-gray-400">
                {truncate(conversation.lastMessage?.content ?? null, 60)}
              </p>
              <span class="ml-1 flex-shrink-0 text-xs text-gray-400">
                #{conversation.displayId}
              </span>
            </div>
            <div class="mt-1 flex items-center gap-1">
              <span
                class="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500 dark:bg-gray-700 dark:text-gray-400"
              >
                {conversation.inbox.name}
              </span>
              {#if conversation.assignee}
                <span class="inline-flex items-center gap-1 text-[10px] text-gray-400">
                  <PresenceIndicator userId={conversation.assignee.id} />
                  {conversation.assignee.name}
                </span>
              {/if}
            </div>
          </div>
        </a>
      </div>
    {/each}
  {/if}
</div>
