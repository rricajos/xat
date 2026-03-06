<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { goto } from "$app/navigation";
  import { io, type Socket } from "socket.io-client";

  interface Notification {
    id: number;
    notificationType: string;
    primaryActorType: string | null;
    primaryActorId: number | null;
    secondaryActorType: string | null;
    secondaryActorId: number | null;
    readAt: Date | null;
    snoozedUntil: Date | null;
    createdAt: Date;
  }

  let open = $state(false);
  let notifications = $state<Notification[]>([]);
  let unreadCount = $state(0);
  let loading = $state(false);
  let socket: Socket | null = null;
  let audioContext: AudioContext | null = null;

  onMount(async () => {
    await loadNotifications();
    connectSocket();
  });

  onDestroy(() => {
    socket?.disconnect();
  });

  function connectSocket() {
    const userId = document.body.dataset.userId;
    const accountId = document.body.dataset.accountId;
    if (!userId || !accountId) return;

    socket = io({
      path: "/ws",
      query: { userId, accountId },
      transports: ["websocket"],
    });

    socket.on("notification:created", (notification: Notification) => {
      notifications = [notification, ...notifications];
      unreadCount++;
      playNotificationSound();
    });
  }

  function playNotificationSound() {
    try {
      if (!audioContext) {
        audioContext = new AudioContext();
      }
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 800;
      oscillator.type = "sine";
      gainNode.gain.value = 0.1;
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + 0.3,
      );
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch {
      // Audio not available
    }
  }

  async function loadNotifications() {
    loading = true;
    try {
      const res = await fetch("/api/v1/notifications?limit=30");
      if (res.ok) {
        const result = await res.json();
        notifications = result.data ?? [];
        unreadCount = result.meta?.unreadCount ?? notifications.filter((n) => !n.readAt).length;
      }
    } finally {
      loading = false;
    }
  }

  async function markAsRead(notification: Notification) {
    if (notification.readAt) return;

    await fetch(`/api/v1/notifications/${notification.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ readAt: true }),
    });

    notification.readAt = new Date();
    notifications = [...notifications];
    unreadCount = Math.max(0, unreadCount - 1);
  }

  async function markAllAsRead() {
    await fetch("/api/v1/notifications/read-all", { method: "POST" });
    notifications = notifications.map((n) => ({ ...n, readAt: new Date() }));
    unreadCount = 0;
  }

  async function deleteNotification(e: Event, id: number) {
    e.stopPropagation();
    await fetch(`/api/v1/notifications/${id}`, { method: "DELETE" });
    notifications = notifications.filter((n) => n.id !== id);
    unreadCount = notifications.filter((n) => !n.readAt).length;
  }

  function handleNotificationClick(notification: Notification) {
    markAsRead(notification);

    if (notification.primaryActorType === "Conversation" && notification.primaryActorId) {
      open = false;
      goto(`/app/conversations/${notification.primaryActorId}`);
    }
  }

  function getNotificationText(n: Notification): string {
    switch (n.notificationType) {
      case "conversation_assignment":
        return "You were assigned a conversation";
      case "conversation_mention":
        return "You were mentioned in a conversation";
      case "new_message":
        return "New message in a conversation";
      case "conversation_resolved":
        return "A conversation was resolved";
      case "sla_breach":
        return "SLA breach warning";
      default:
        return "New notification";
    }
  }

  function getNotificationIcon(type: string): string {
    switch (type) {
      case "conversation_assignment":
        return "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z";
      case "conversation_mention":
        return "M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z";
      case "new_message":
        return "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z";
      default:
        return "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9";
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
    <div class="absolute bottom-full left-full z-50 mb-2 ml-2 w-96 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <div class="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
          Notifications
          {#if unreadCount > 0}
            <span class="ml-1.5 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              {unreadCount}
            </span>
          {/if}
        </h3>
        {#if unreadCount > 0}
          <button
            onclick={markAllAsRead}
            class="text-xs text-blue-600 hover:text-blue-700"
          >
            Mark all as read
          </button>
        {/if}
      </div>

      <div class="max-h-[28rem] overflow-y-auto">
        {#if loading}
          <p class="px-4 py-8 text-center text-sm text-gray-400">Loading...</p>
        {:else if notifications.length === 0}
          <div class="flex flex-col items-center justify-center py-12">
            <svg class="mb-2 h-10 w-10 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p class="text-sm text-gray-400">No notifications yet</p>
          </div>
        {:else}
          {#each notifications as notification}
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
              class="group flex cursor-pointer items-start gap-3 border-b border-gray-100 px-4 py-3 last:border-0 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50 {!notification.readAt
                ? 'bg-blue-50 dark:bg-blue-900/20'
                : ''}"
              onclick={() => handleNotificationClick(notification)}
            >
              <div class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full {!notification.readAt ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-700'}">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={getNotificationIcon(notification.notificationType)} />
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm {!notification.readAt ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}">
                  {getNotificationText(notification)}
                </p>
                {#if notification.primaryActorType === "Conversation" && notification.primaryActorId}
                  <p class="text-xs text-gray-400 mt-0.5">
                    Conversation #{notification.primaryActorId}
                  </p>
                {/if}
                <p class="mt-0.5 text-xs text-gray-400">
                  {timeAgo(notification.createdAt)}
                </p>
              </div>
              <button
                onclick={(e) => deleteNotification(e, notification.id)}
                class="hidden shrink-0 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-red-500 group-hover:block dark:hover:bg-gray-600"
                title="Delete"
              >
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          {/each}
        {/if}
      </div>
    </div>
  {/if}
</div>
