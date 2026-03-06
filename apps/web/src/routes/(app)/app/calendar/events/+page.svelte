<script lang="ts">
  import { invalidateAll } from "$app/navigation";

  const { data } = $props();
  let eventTypes = $state(data.eventTypes);

  const LOCATION_LABEL: Record<string, string> = {
    VIDEO_DYTE: "Video (Dyte)", VIDEO_GOOGLE_MEET: "Google Meet", VIDEO_ZOOM: "Zoom",
    PHONE: "Phone", IN_PERSON: "In Person", CUSTOM: "Custom",
  };

  async function deleteEt(id: number) {
    if (!confirm("Delete this event?")) return;
    await fetch(`/api/v1/calendar/event-types/${id}`, { method: "DELETE" });
    await invalidateAll();
    eventTypes = data.eventTypes;
  }

  async function toggleActive(et: typeof eventTypes[0]) {
    await fetch(`/api/v1/calendar/event-types/${et.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !et.isActive }),
    });
    await invalidateAll();
    eventTypes = data.eventTypes;
  }
</script>

<div class="p-6">
  <div class="mb-6 flex items-center justify-between">
    <h1 class="text-xl font-semibold text-gray-900 dark:text-white">Events</h1>
    <a href="/app/calendar/events/new" class="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
      + New event
    </a>
  </div>

  {#if eventTypes.length === 0}
    <div class="text-center py-16 text-gray-400">
      <svg class="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
      <p>No events yet. <a href="/app/calendar/events/new" class="text-blue-600 hover:underline">Create your first one!</a></p>
    </div>
  {:else}
    <div class="space-y-3">
      {#each eventTypes as et}
        <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-center gap-4">
          <div class="w-3 h-3 rounded-full flex-shrink-0" style="background:{et.color}"></div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <h3 class="font-medium text-gray-900 dark:text-white {et.isActive ? '' : 'opacity-50'}">{et.name}</h3>
              {#if !et.isActive}
                <span class="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">Inactive</span>
              {/if}
            </div>
            <div class="text-sm text-gray-500 flex items-center gap-3 mt-0.5">
              <span>{et.duration} min</span>
              <span>{LOCATION_LABEL[et.locationType] ?? et.locationType}</span>
              <span class="text-blue-500 text-xs font-mono">/{et.scope === "USER" ? "username" : et.scope === "TEAM" ? "team/slug" : "event"}/{et.slug}</span>
            </div>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <button
              onclick={() => toggleActive(et)}
              class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors {et.isActive ? 'bg-blue-600' : 'bg-gray-300'}"
            >
              <span class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform {et.isActive ? 'translate-x-4' : 'translate-x-1'}"></span>
            </button>
            <a href="/app/calendar/events/{et.id}" class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
            </a>
            <button onclick={() => deleteEt(et.id)} class="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
