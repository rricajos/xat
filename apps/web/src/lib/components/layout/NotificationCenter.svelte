<script lang="ts">
  import { onMount } from "svelte";

  interface Notification {
    id: number;
    notificationType: string;
    primaryActorType: string | null;
    primaryActorId: number | null;
    readAt: Date | null;
    createdAt: Date;
  }

  let open = $state(false);
  let notifications = $state<Notification[]>([]);
  let unreadCount = $state(0);
  let loading = $state(false);

  onMount(async () => {
    await loadNotifications();
  });

  async function loadNotifications() {
    loading = true;
    try {
      const res = await fetch("/api/v1/notifications");
      if (res.ok) {
        const data = await res.json();
        notifications = data.data ?? [];
        unreadCount = notifications.filter((n) => !n.readAt).length;
      }
    } finally {
      loading = false;
    }
  }

  async function markAllAsRead() {
    await fetch("/api/v1/notifications/read-all", { method: "POST" });
    notifications = notifications.map((n) => ({ ...n, readAt: new Date() }));
    unreadCount = 0;
  }

  function getNotificationText(n: Notification): string {
    switch (n.notificationType) {
      case "conversation_assignment":
        return "You were assigned a conversation";
      case "conversation_mention":
        return "You were mentioned in a conversation";
      case "new_message":
        return "New message in a conversation";
      default:
        return "New notification";
    }
  }

  function timeAgo(date: Date): string {
    const now = new Date();
    const diff = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }
</script>

<div class="relative">
  <button
    onclick={() => { open = !open; if (open) loadNotifications(); }}
    class="relative flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
    title="Notifications"
  >
    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
    {#if unreadCount > 0}
      <span class="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
        {unreadCount > 9 ? "9+" : unreadCount}
      </span>
    {/if}
  </button>

  {#if open}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="fixed inset-0 z-40"
      onclick={() => (open = false)}
    ></div>
    <div class="absolute bottom-full left-full z-50 mb-2 ml-2 w-80 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <div class="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
        {#if unreadCount > 0}
          <button
            onclick={markAllAsRead}
            class="text-xs text-blue-600 hover:text-blue-700"
          >
            Mark all as read
          </button>
        {/if}
      </div>

      <div class="max-h-96 overflow-y-auto">
        {#if loading}
          <p class="px-4 py-8 text-center text-sm text-gray-400">Loading...</p>
        {:else if notifications.length === 0}
          <p class="px-4 py-8 text-center text-sm text-gray-400">No notifications</p>
        {:else}
          {#each notifications as notification}
            <div
              class="border-b border-gray-100 px-4 py-3 last:border-0 dark:border-gray-700 {!notification.readAt
                ? 'bg-blue-50 dark:bg-blue-900/20'
                : ''}"
            >
              <p class="text-sm text-gray-700 dark:text-gray-300">
                {getNotificationText(notification)}
              </p>
              <p class="mt-0.5 text-xs text-gray-400">
                {timeAgo(notification.createdAt)}
              </p>
            </div>
          {/each}
        {/if}
      </div>
    </div>
  {/if}
</div>
