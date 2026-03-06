<script lang="ts">
  import { invalidateAll } from "$app/navigation";

  const { data } = $props();

  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  type Period = { start: string; end: string };
  type DaySchedule = { dayOfWeek: number; enabled: boolean; periods: Period[] };

  function defaultSchedule(): DaySchedule[] {
    return Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i,
      enabled: i >= 1 && i <= 5,
      periods: [{ start: "09:00", end: "17:00" }],
    }));
  }

  const initialSchedule = data.schedule
    ? (() => {
        const avail = data.schedule.availability as Array<{ dayOfWeek: number; periods: Period[] }>;
        return Array.from({ length: 7 }, (_, i) => {
          const day = avail.find((d) => d.dayOfWeek === i);
          return { dayOfWeek: i, enabled: !!day, periods: day?.periods ?? [{ start: "09:00", end: "17:00" }] };
        });
      })()
    : defaultSchedule();

  let schedule = $state<DaySchedule[]>(initialSchedule);
  let timezone = $state(data.schedule?.timezone ?? "UTC");
  let saving = $state(false);
  let saved = $state(false);

  let blockedTimes = $state(data.blockedTimes);
  let newBlock = $state({ startAt: "", endAt: "", reason: "" });

  const TIMEZONES = Intl.supportedValuesOf("timeZone");

  function addPeriod(dayIdx: number) {
    schedule[dayIdx]!.periods = [...schedule[dayIdx]!.periods, { start: "09:00", end: "17:00" }];
  }

  function removePeriod(dayIdx: number, pIdx: number) {
    schedule[dayIdx]!.periods = schedule[dayIdx]!.periods.filter((_, i) => i !== pIdx);
  }

  async function saveSchedule(e: SubmitEvent) {
    e.preventDefault();
    saving = true;
    const availability = schedule.filter((d) => d.enabled).map(({ dayOfWeek, periods }) => ({ dayOfWeek, periods }));
    await fetch("/api/v1/calendar/schedules", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timezone, availability }),
    });
    saving = false;
    saved = true;
    setTimeout(() => (saved = false), 3000);
  }

  async function addBlockedTime(e: SubmitEvent) {
    e.preventDefault();
    await fetch("/api/v1/calendar/blocked-times", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startAt: newBlock.startAt, endAt: newBlock.endAt, reason: newBlock.reason || undefined }),
    });
    newBlock = { startAt: "", endAt: "", reason: "" };
    await invalidateAll();
    blockedTimes = data.blockedTimes;
  }

  async function deleteBlockedTime(id: number) {
    await fetch(`/api/v1/calendar/blocked-times/${id}`, { method: "DELETE" });
    await invalidateAll();
    blockedTimes = data.blockedTimes;
  }
</script>

<div class="p-6 max-w-3xl">
  <h1 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">Availability</h1>

  <form onsubmit={saveSchedule} class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-6">
    <!-- Timezone -->
    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Timezone</label>
      <select bind:value={timezone} class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
        {#each TIMEZONES as tz}
          <option value={tz}>{tz}</option>
        {/each}
      </select>
    </div>

    <!-- Weekly hours -->
    <div class="space-y-4">
      {#each schedule as day, i}
        <div class="flex items-start gap-4">
          <!-- Day toggle -->
          <div class="flex items-center gap-2 w-28 pt-1 flex-shrink-0">
            <button
              type="button"
              onclick={() => (day.enabled = !day.enabled)}
              class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors {day.enabled ? 'bg-blue-600' : 'bg-gray-300'}"
            >
              <span class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform {day.enabled ? 'translate-x-4' : 'translate-x-1'}"></span>
            </button>
            <span class="text-sm text-gray-700 dark:text-gray-300 {day.enabled ? '' : 'opacity-50'}">{DAYS[i]!.slice(0, 3)}</span>
          </div>

          <!-- Periods -->
          {#if day.enabled}
            <div class="flex-1 space-y-2">
              {#each day.periods as period, pIdx}
                <div class="flex items-center gap-2">
                  <input type="time" bind:value={period.start} class="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <span class="text-gray-400 text-sm">–</span>
                  <input type="time" bind:value={period.end} class="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {#if day.periods.length > 1}
                    <button type="button" onclick={() => removePeriod(i, pIdx)} class="text-gray-400 hover:text-red-500 text-lg leading-none">×</button>
                  {/if}
                </div>
              {/each}
              <button type="button" onclick={() => addPeriod(i)} class="text-xs text-blue-600 hover:underline">+ Add break</button>
            </div>
          {:else}
            <span class="text-sm text-gray-400 pt-1">Unavailable</span>
          {/if}
        </div>
      {/each}
    </div>

    <div class="mt-6 flex items-center gap-3">
      <button type="submit" disabled={saving} class="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-60">
        {saving ? "Saving…" : "Save availability"}
      </button>
      {#if saved}
        <span class="text-sm text-green-600">Saved!</span>
      {/if}
    </div>
  </form>

  <!-- Blocked times -->
  <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
    <h2 class="text-base font-semibold text-gray-900 dark:text-white mb-4">Blocked Times</h2>

    <form onsubmit={addBlockedTime} class="flex flex-wrap gap-3 mb-4 items-end">
      <div>
        <label class="block text-xs text-gray-500 mb-1">Start</label>
        <input type="datetime-local" bind:value={newBlock.startAt} required class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label class="block text-xs text-gray-500 mb-1">End</label>
        <input type="datetime-local" bind:value={newBlock.endAt} required class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label class="block text-xs text-gray-500 mb-1">Reason (optional)</label>
        <input type="text" bind:value={newBlock.reason} placeholder="Holiday, vacation…" class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <button type="submit" class="px-3 py-2 bg-gray-900 dark:bg-white dark:text-gray-900 text-white text-sm rounded-lg hover:opacity-90">Block time</button>
    </form>

    {#if blockedTimes.length === 0}
      <p class="text-sm text-gray-400">No blocked times.</p>
    {:else}
      <div class="space-y-2">
        {#each blockedTimes as block}
          <div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
            <div class="text-sm text-gray-700 dark:text-gray-300">
              {new Date(block.startAt).toLocaleString()} – {new Date(block.endAt).toLocaleString()}
              {#if block.reason} <span class="text-gray-400">— {block.reason}</span>{/if}
            </div>
            <button onclick={() => deleteBlockedTime(block.id)} class="text-gray-400 hover:text-red-500 text-sm">Remove</button>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
