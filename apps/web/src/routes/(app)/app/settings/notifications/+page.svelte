<script lang="ts">
  import { onMount } from "svelte";

  const NOTIFICATION_LABELS: Record<string, string> = {
    conversation_creation: "New conversation created",
    conversation_assignment: "Conversation assigned to me",
    conversation_mention: "Mentioned in a conversation",
    message_created: "New message in my conversations",
    conversation_resolved: "Conversation resolved",
    participant_added: "Added as conversation participant",
  };

  interface Pref {
    notificationType: string;
    emailEnabled: boolean;
    pushEnabled: boolean;
    webEnabled: boolean;
  }

  let prefs = $state<Pref[]>([]);
  let loading = $state(true);
  let saving = $state(false);
  let saved = $state(false);

  onMount(async () => {
    const res = await fetch("/api/v1/notification-preferences");
    if (res.ok) {
      const body = await res.json();
      prefs = body.data ?? [];
    }
    loading = false;
  });

  async function save() {
    saving = true;
    saved = false;
    await fetch("/api/v1/notification-preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferences: prefs }),
    });
    saving = false;
    saved = true;
    setTimeout(() => { saved = false; }, 2500);
  }
</script>

<div class="p-6">
  <div class="mb-6">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Notification Preferences</h2>
    <p class="text-sm text-gray-500 dark:text-gray-400">Choose which events notify you and through which channels.</p>
  </div>

  {#if loading}
    <div class="text-sm text-gray-400">Loading…</div>
  {:else}
    <div class="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <th class="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Event</th>
            <th class="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">Web</th>
            <th class="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">Email</th>
            <th class="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">Push</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
          {#each prefs as pref}
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td class="px-4 py-3 text-gray-700 dark:text-gray-300">
                {NOTIFICATION_LABELS[pref.notificationType] ?? pref.notificationType}
              </td>
              <td class="px-4 py-3 text-center">
                <input
                  type="checkbox"
                  bind:checked={pref.webEnabled}
                  class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </td>
              <td class="px-4 py-3 text-center">
                <input
                  type="checkbox"
                  bind:checked={pref.emailEnabled}
                  class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </td>
              <td class="px-4 py-3 text-center">
                <input
                  type="checkbox"
                  bind:checked={pref.pushEnabled}
                  class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <div class="mt-4 flex items-center gap-3">
      <button
        onclick={save}
        disabled={saving}
        class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save preferences"}
      </button>
      {#if saved}
        <span class="text-sm text-green-600 dark:text-green-400">Saved!</span>
      {/if}
    </div>
  {/if}
</div>
