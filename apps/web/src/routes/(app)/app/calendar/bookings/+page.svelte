<script lang="ts">
  import { goto, invalidateAll } from "$app/navigation";
  import { page } from "$app/stores";

  const { data } = $props();
  let bookings = $state(data.bookings);
  let activeStatus = $state(data.status);

  const STATUSES = ["ALL", "CONFIRMED", "PENDING", "COMPLETED", "CANCELLED", "NO_SHOW"];

  const STATUS_BADGE: Record<string, string> = {
    CONFIRMED: "bg-blue-100 text-blue-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    CANCELLED: "bg-red-100 text-red-500",
    COMPLETED: "bg-green-100 text-green-700",
    NO_SHOW: "bg-gray-100 text-gray-500",
  };

  async function filterByStatus(s: string) {
    activeStatus = s;
    const url = new URL($page.url);
    if (s === "ALL") url.searchParams.delete("status");
    else url.searchParams.set("status", s);
    goto(url.toString(), { invalidateAll: true });
  }

  async function updateStatus(id: number, status: string) {
    await fetch(`/api/v1/calendar/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await invalidateAll();
    bookings = data.bookings;
  }
</script>

<div class="p-6">
  <div class="mb-6 flex items-center justify-between">
    <h1 class="text-xl font-semibold text-gray-900 dark:text-white">Bookings</h1>
  </div>

  <!-- Status tabs -->
  <div class="flex gap-1 mb-5 flex-wrap">
    {#each STATUSES as s}
      <button
        onclick={() => filterByStatus(s)}
        class="px-3 py-1.5 text-sm rounded-lg transition-colors {activeStatus === s ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}"
      >
        {s}
      </button>
    {/each}
  </div>

  {#if bookings.length === 0}
    <div class="text-center py-16 text-gray-400">
      <svg class="w-10 h-10 mx-auto mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12" />
      </svg>
      <p>No bookings found.</p>
    </div>
  {:else}
    <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <table class="w-full text-sm">
        <thead class="border-b border-gray-200 dark:border-gray-700">
          <tr class="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            <th class="px-4 py-3">Contact</th>
            <th class="px-4 py-3">Date & Time</th>
            <th class="px-4 py-3">Duration</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
          {#each bookings as b}
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td class="px-4 py-3">
                <div class="font-medium text-gray-900 dark:text-white">{b.contactName}</div>
                <div class="text-gray-500 text-xs">{b.contactEmail}</div>
              </td>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-400">
                {new Date(b.startAt).toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" })}
                <br /><span class="text-xs">{new Date(b.startAt).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}</span>
              </td>
              <td class="px-4 py-3 text-gray-500">
                {Math.round((new Date(b.endAt).getTime() - new Date(b.startAt).getTime()) / 60000)} min
              </td>
              <td class="px-4 py-3">
                <span class="px-2 py-0.5 rounded-full text-xs font-medium {STATUS_BADGE[b.status] ?? 'bg-gray-100 text-gray-500'}">
                  {b.status}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-1">
                  {#if b.status === "CONFIRMED" || b.status === "PENDING"}
                    <button onclick={() => updateStatus(b.id, "COMPLETED")} class="text-xs px-2 py-1 rounded bg-green-50 text-green-700 hover:bg-green-100">Complete</button>
                    <button onclick={() => updateStatus(b.id, "CANCELLED")} class="text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100">Cancel</button>
                    <button onclick={() => updateStatus(b.id, "NO_SHOW")} class="text-xs px-2 py-1 rounded bg-gray-50 text-gray-600 hover:bg-gray-100">No show</button>
                  {/if}
                  {#if b.meetingUrl}
                    <a href={b.meetingUrl} target="_blank" class="text-xs px-2 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100">Join</a>
                  {/if}
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
