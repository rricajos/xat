<script lang="ts">
  const { data } = $props();
  const { agent, eventTypes } = data;

  const locationTypeLabel: Record<string, string> = {
    VIDEO_DYTE: "Video",
    VIDEO_GOOGLE_MEET: "Google Meet",
    VIDEO_ZOOM: "Zoom",
    PHONE: "Phone",
    IN_PERSON: "In Person",
    CUSTOM: "Custom",
  };
</script>

<svelte:head>
  <title>{agent.displayName ?? agent.name} — Calendar</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <div class="max-w-2xl mx-auto py-16 px-4">
    <!-- Agent header -->
    <div class="text-center mb-10">
      {#if agent.avatarUrl}
        <img
          src={agent.avatarUrl}
          alt={agent.name}
          class="w-20 h-20 rounded-full mx-auto mb-4 object-cover border-2 border-white shadow"
        />
      {:else}
        <div class="w-20 h-20 rounded-full mx-auto mb-4 bg-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow">
          {(agent.displayName ?? agent.name).charAt(0).toUpperCase()}
        </div>
      {/if}
      <h1 class="text-2xl font-bold text-gray-900">{agent.displayName ?? agent.name}</h1>
      {#if agent.jobTitle}
        <p class="mt-1 text-sm font-medium text-gray-500">{agent.jobTitle}</p>
      {/if}
      {#if agent.bio}
        <p class="mt-2 text-sm text-gray-500 max-w-md mx-auto">{agent.bio}</p>
      {/if}
    </div>

    <!-- Event type cards -->
    {#if eventTypes.length === 0}
      <p class="text-center text-gray-500">No event types available.</p>
    {:else}
      <div class="space-y-3">
        {#each eventTypes as et}
          <a
            href="/{agent.calendarUsername}/{et.slug}"
            class="block bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-500 hover:shadow-sm transition-all group"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-3 h-3 rounded-full flex-shrink-0"
                style="background:{et.color}"
              ></div>
              <div class="flex-1 min-w-0">
                <h2 class="font-semibold text-gray-900 group-hover:text-blue-600">
                  {et.name}
                </h2>
                {#if et.description}
                  <p class="text-sm text-gray-500 truncate">{et.description}</p>
                {/if}
              </div>
              <div class="text-sm text-gray-400 flex items-center gap-3 flex-shrink-0">
                <span>{et.duration} min</span>
                <span>{locationTypeLabel[et.locationType] ?? et.locationType}</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </a>
        {/each}
      </div>
    {/if}
  </div>
</div>
