<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";

  const { data } = $props();
  const { inboxes, calendarUsername, teams } = data;
  const existingSettings = (data.eventType.settings ?? {}) as { notificationInboxIds?: number[]; bufferMinutes?: number; minNoticeHours?: number; maxBookingsPerDay?: number };
  const existingInboxIds: number[] = existingSettings.notificationInboxIds ?? [];

  function teamSlug(name: string) {
    return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  }

  let saving = $state(false);
  let error = $state("");
  let copied = $state(false);
  let showAdvanced = $state(false);

  let form = $state({
    name: data.eventType.name,
    slug: data.eventType.slug,
    description: data.eventType.description ?? "",
    duration: data.eventType.duration,
    locationType: data.eventType.locationType,
    color: data.eventType.color ?? "#3B82F6",
    scope: data.eventType.scope,
    teamId: data.eventType.teamId ? String(data.eventType.teamId) : "",
    notificationInboxIds: existingInboxIds,
    bufferMinutes: existingSettings.bufferMinutes ?? 0,
    minNoticeHours: existingSettings.minNoticeHours ?? 1,
    maxBookingsPerDay: existingSettings.maxBookingsPerDay ?? 0,
  });

  const selectedTeam = $derived(teams.find((t) => String(t.id) === form.teamId));

  const LOCATION_TYPES = [
    { value: "VIDEO_DYTE", label: "Video (Dyte)" },
    { value: "VIDEO_GOOGLE_MEET", label: "Google Meet" },
    { value: "VIDEO_ZOOM", label: "Zoom" },
    { value: "PHONE", label: "Phone" },
    { value: "IN_PERSON", label: "In Person" },
    { value: "CUSTOM", label: "Custom" },
  ];

  const SCOPES = $derived([
    { value: "USER", label: "User", description: (slug: string) => `/${calendarUsername || ":username"}/${slug || ":slug"}` },
    { value: "TEAM", label: "Team", description: (slug: string) => `/team/${selectedTeam ? teamSlug(selectedTeam.name) : ":teamname"}/${slug || ":slug"}` },
    { value: "GLOBAL", label: "Global", description: (slug: string) => `/event/${slug || ":slug"}` },
  ]);

  function toggleInbox(id: number) {
    if (form.notificationInboxIds.includes(id)) {
      form.notificationInboxIds = form.notificationInboxIds.filter((i) => i !== id);
    } else {
      form.notificationInboxIds = [...form.notificationInboxIds, id];
    }
  }

  const previewUrl = $derived.by(() => {
    const origin = $page.url.origin;
    const s = form.slug || ":slug";
    if (form.scope === "USER") return `${origin}/${calendarUsername || ":username"}/${s}`;
    if (form.scope === "TEAM") return `${origin}/team/${selectedTeam ? teamSlug(selectedTeam.name) : ":teamname"}/${s}`;
    return `${origin}/event/${s}`;
  });

  const previewClickable = $derived(
    (form.scope === "GLOBAL" && !!form.slug) ||
    (form.scope === "USER" && !!calendarUsername && !!form.slug) ||
    (form.scope === "TEAM" && !!selectedTeam && !!form.slug)
  );

  async function copyUrl() {
    await navigator.clipboard.writeText(previewUrl);
    copied = true;
    setTimeout(() => (copied = false), 2000);
  }

  async function save(e: SubmitEvent) {
    e.preventDefault();
    saving = true;
    error = "";
    const res = await fetch(`/api/v1/calendar/event-types/${data.eventType.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        slug: form.slug,
        description: form.description || undefined,
        duration: Number(form.duration),
        locationType: form.locationType,
        color: form.color,
        scope: form.scope,
        teamId: form.scope === "TEAM" && form.teamId ? Number(form.teamId) : undefined,
        settings: {
          notificationInboxIds: form.notificationInboxIds.length ? form.notificationInboxIds : undefined,
          bufferMinutes: form.bufferMinutes > 0 ? form.bufferMinutes : undefined,
          minNoticeHours: form.minNoticeHours > 0 ? form.minNoticeHours : undefined,
          maxBookingsPerDay: form.maxBookingsPerDay > 0 ? form.maxBookingsPerDay : undefined,
        },
      }),
    });
    if (res.ok) {
      goto("/app/calendar/events");
    } else {
      const body = await res.json().catch(() => ({}));
      error = body.error ?? "Failed to save changes";
      saving = false;
    }
  }
</script>

<div class="p-6 max-w-xl">
  <div class="mb-6 flex items-center gap-3">
    <a href="/app/calendar/events" aria-label="Back to events"
      class="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
    </a>
    <h1 class="text-xl font-semibold text-gray-900 dark:text-white">Edit Event</h1>
  </div>

  {#if error}
    <div class="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
  {/if}

  <form onsubmit={save} class="space-y-5">
    <div>
      <label for="ev-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
      <input id="ev-name" type="text" bind:value={form.name} required
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>

    <div>
      <label for="ev-slug" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL slug *</label>
      <input id="ev-slug" type="text" bind:value={form.slug} required pattern="[a-z0-9-]+"
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
      <p class="mt-1 text-xs text-gray-400">Lowercase letters, numbers and hyphens only.</p>
    </div>

    <div>
      <label for="ev-desc" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
      <textarea id="ev-desc" bind:value={form.description} rows="2"
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label for="ev-duration" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration (min) *</label>
        <input id="ev-duration" type="number" bind:value={form.duration} min="5" max="480" step="5" required
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label for="ev-color" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Color</label>
        <input id="ev-color" type="color" bind:value={form.color}
          class="w-full h-[38px] px-1 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer" />
      </div>
    </div>

    <div>
      <label for="ev-location" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location type</label>
      <select id="ev-location" bind:value={form.locationType}
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
        {#each LOCATION_TYPES as lt}
          <option value={lt.value}>{lt.label}</option>
        {/each}
      </select>
    </div>

    <!-- Scope selector with URL pattern descriptions -->
    <div>
      <p class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Scope</p>
      <div class="space-y-2">
        {#each SCOPES as scope}
          <label class="flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors {form.scope === scope.value ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}">
            <input type="radio" bind:group={form.scope} value={scope.value} class="mt-0.5 accent-blue-600" />
            <div class="min-w-0">
              <div class="text-sm font-medium text-gray-800 dark:text-gray-200">{scope.label}</div>
              <div class="text-xs font-mono text-gray-400 dark:text-gray-500 truncate">{scope.description(form.slug)}</div>
            </div>
          </label>
        {/each}
      </div>
    </div>

    <!-- Team selector (only when TEAM scope) -->
    {#if form.scope === "TEAM"}
      <div>
        <label for="ev-team" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Team *</label>
        {#if teams.length === 0}
          <p class="text-xs text-gray-400">No teams found. <a href="/app/settings/teams" class="text-blue-600 hover:underline">Create a team first.</a></p>
        {:else}
          <select id="ev-team" bind:value={form.teamId} required
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select a team…</option>
            {#each teams as team}
              <option value={team.id}>{team.name}</option>
            {/each}
          </select>
        {/if}
      </div>
    {/if}

    <!-- Preview link -->
    <div class="p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
      <div class="text-xs text-gray-400 uppercase tracking-wide mb-1.5">Public booking link</div>
      <div class="flex items-center gap-2">
        {#if previewClickable}
          <a href={previewUrl} target="_blank" class="flex-1 text-sm font-mono text-blue-600 hover:underline truncate">{previewUrl}</a>
        {:else}
          <span class="flex-1 text-sm font-mono text-gray-400 truncate">{previewUrl}</span>
        {/if}
        <button type="button" onclick={copyUrl} aria-label="Copy booking link"
          class="flex-shrink-0 text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400">
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      {#if form.scope === "USER" && !calendarUsername}
        <p class="mt-1.5 text-xs text-amber-600 dark:text-amber-500">Set your calendar username in <a href="/app/profile" class="underline">profile settings</a> to activate this link.</p>
      {/if}
    </div>

    <!-- Notification inboxes (multi-select) -->
    <div>
      <p class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notification inboxes</p>
      {#if inboxes.length === 0}
        <p class="text-xs text-gray-400">No inboxes configured yet.</p>
      {:else}
        <div class="border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-100 dark:divide-gray-700">
          {#each inboxes as inbox}
            <label class="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 first:rounded-t-lg last:rounded-b-lg">
              <input type="checkbox" checked={form.notificationInboxIds.includes(inbox.id)}
                onchange={() => toggleInbox(inbox.id)} class="accent-blue-600" />
              <span class="text-sm text-gray-700 dark:text-gray-300">{inbox.name}</span>
            </label>
          {/each}
        </div>
        <p class="mt-1 text-xs text-gray-400">Booking notifications will be sent through the selected inboxes.</p>
      {/if}
    </div>

    <!-- Advanced settings -->
    <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button type="button" onclick={() => showAdvanced = !showAdvanced}
        class="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
        <span>Advanced settings</span>
        <svg class="w-4 h-4 transition-transform {showAdvanced ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
      </button>
      {#if showAdvanced}
        <div class="px-4 pb-4 space-y-4 border-t border-gray-100 dark:border-gray-700 pt-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="ev-buffer" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Buffer time (min)</label>
              <input id="ev-buffer" type="number" bind:value={form.bufferMinutes} min="0" max="120" step="5"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p class="mt-0.5 text-xs text-gray-400">Before &amp; after each booking</p>
            </div>
            <div>
              <label for="ev-notice" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min notice (hours)</label>
              <input id="ev-notice" type="number" bind:value={form.minNoticeHours} min="0" max="72" step="1"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p class="mt-0.5 text-xs text-gray-400">How far in advance</p>
            </div>
          </div>
          <div class="w-1/2 pr-2">
            <label for="ev-maxday" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max bookings/day</label>
            <input id="ev-maxday" type="number" bind:value={form.maxBookingsPerDay} min="0" max="50" step="1"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <p class="mt-0.5 text-xs text-gray-400">0 = unlimited</p>
          </div>
        </div>
      {/if}
    </div>

    <div class="flex gap-3 pt-2">
      <a href="/app/calendar/events"
        class="flex-1 py-2 text-center border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800">
        Cancel
      </a>
      <button type="submit" disabled={saving}
        class="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
        {saving ? "Saving…" : "Save changes"}
      </button>
    </div>
  </form>
</div>
