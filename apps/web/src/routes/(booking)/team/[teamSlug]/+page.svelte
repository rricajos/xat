<script lang="ts">
  const { data } = $props();
  const { team, eventTypes, teamSlug } = data;

  const locationTypeLabel: Record<string, string> = {
    VIDEO_DYTE: "Video", VIDEO_GOOGLE_MEET: "Google Meet", VIDEO_ZOOM: "Zoom",
    PHONE: "Phone", IN_PERSON: "In Person", CUSTOM: "Custom",
  };
</script>

<svelte:head>
  <title>{team.name} — Calendar</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <div class="max-w-2xl mx-auto py-16 px-4">
    <div class="text-center mb-10">
      <div class="w-16 h-16 rounded-full mx-auto mb-4 bg-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow">
        {team.name.charAt(0).toUpperCase()}
      </div>
      <h1 class="text-2xl font-bold text-gray-900">{team.name}</h1>
      {#if team.description}
        <p class="text-gray-500 mt-1">{team.description}</p>
      {/if}
    </div>

    {#if eventTypes.length === 0}
      <p class="text-center text-gray-400">No event types available for this team.</p>
    {:else}
      <div class="space-y-3">
        {#each eventTypes as et}
          <a
            href="/team/{teamSlug}/{et.slug}"
            class="block bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-500 hover:shadow-sm transition-all group"
          >
            <div class="flex items-center gap-3">
              <div class="w-3 h-3 rounded-full" style="background:{et.color}"></div>
              <div class="flex-1">
                <h2 class="font-semibold text-gray-900 group-hover:text-indigo-600">{et.name}</h2>
                {#if et.description}<p class="text-sm text-gray-500 truncate">{et.description}</p>{/if}
              </div>
              <div class="text-sm text-gray-400 flex items-center gap-3">
                <span>{et.duration} min</span>
                <span>{locationTypeLabel[et.locationType] ?? et.locationType}</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
              </div>
            </div>
          </a>
        {/each}
      </div>
    {/if}
  </div>
</div>
