<script lang="ts">
  import { invalidateAll } from "$app/navigation";

  const { data } = $props();
  let connections = $state(data.connections);
  const { icalUrl } = data;

  let copied = $state(false);

  const PROVIDERS = [
    { id: "GOOGLE_CALENDAR", label: "Google Calendar", color: "#4285F4", icon: "G" },
    { id: "GOOGLE_MEET", label: "Google Meet", color: "#00897B", icon: "M" },
    { id: "OUTLOOK", label: "Outlook Calendar", color: "#0078D4", icon: "O" },
    { id: "ZOOM", label: "Zoom", color: "#2D8CFF", icon: "Z" },
  ];

  function isConnected(provider: string) {
    return connections.some((c) => c.provider === provider);
  }

  function connectUrl(provider: string) {
    return `/api/v1/calendar/external/${provider.toLowerCase()}/connect`;
  }

  async function disconnect(provider: string) {
    if (!confirm(`Disconnect ${provider}?`)) return;
    await fetch(`/api/v1/calendar/external/${provider.toLowerCase()}`, { method: "DELETE" });
    await invalidateAll();
    connections = data.connections;
  }

  function copyIcal() {
    navigator.clipboard.writeText(icalUrl);
    copied = true;
    setTimeout(() => (copied = false), 2000);
  }
</script>

<div class="p-6 max-w-2xl">
  <h1 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">Calendar Integrations</h1>

  <!-- External calendars -->
  <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-6">
    <h2 class="text-base font-semibold text-gray-900 dark:text-white mb-1">External Calendars</h2>
    <p class="text-sm text-gray-500 mb-5">Connect your calendar to automatically check for conflicts and sync bookings.</p>

    <div class="space-y-3">
      {#each PROVIDERS as p}
        <div class="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm" style="background:{p.color}">
              {p.icon}
            </div>
            <div>
              <div class="font-medium text-sm text-gray-900 dark:text-white">{p.label}</div>
              {#if isConnected(p.id)}
                <div class="text-xs text-green-600">Connected</div>
              {:else}
                <div class="text-xs text-gray-400">Not connected</div>
              {/if}
            </div>
          </div>

          {#if isConnected(p.id)}
            <button onclick={() => disconnect(p.id)} class="px-3 py-1.5 border border-red-200 text-red-600 text-sm rounded-lg hover:bg-red-50 transition-colors">
              Disconnect
            </button>
          {:else}
            <a href={connectUrl(p.id)} class="px-3 py-1.5 bg-gray-900 dark:bg-white dark:text-gray-900 text-white text-sm rounded-lg hover:opacity-90 transition-opacity">
              Connect
            </a>
          {/if}
        </div>
      {/each}
    </div>
  </div>

  <!-- iCal feed -->
  <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
    <h2 class="text-base font-semibold text-gray-900 dark:text-white mb-1">iCal Feed</h2>
    <p class="text-sm text-gray-500 mb-4">Subscribe to your bookings in any calendar app (Google, Outlook, Apple).</p>

    <div class="flex gap-2">
      <input
        type="text"
        value={icalUrl}
        readonly
        class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-mono truncate"
      />
      <button onclick={copyIcal} class="px-3 py-2 bg-gray-900 dark:bg-white dark:text-gray-900 text-white text-sm rounded-lg hover:opacity-90 transition-colors min-w-[80px]">
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  </div>
</div>
