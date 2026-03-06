<script lang="ts">
  import { goto } from "$app/navigation";

  const { data } = $props();
  const { eventType, selectedDate, slots, slug } = data;

  let currentDate = $state(selectedDate);
  let selectedSlot = $state<{ start: string; end: string } | null>(null);
  let step = $state<"select" | "form" | "loading">("select");
  let form = $state({ contactName: "", contactEmail: "", contactPhone: "", notes: "" });
  let error = $state("");

  const locationTypeLabel: Record<string, string> = {
    VIDEO_DYTE: "Video", VIDEO_GOOGLE_MEET: "Google Meet", VIDEO_ZOOM: "Zoom",
    PHONE: "Phone", IN_PERSON: "In Person", CUSTOM: "Custom",
  };

  function formatTime(isoStr: string) {
    return new Date(isoStr).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" });
  }

  async function submitBooking(e: SubmitEvent) {
    e.preventDefault();
    if (!selectedSlot) return;
    error = "";
    step = "loading";

    const res = await fetch("/api/v1/calendar/public/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventTypeId: eventType.id,
        contactName: form.contactName,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone || undefined,
        startAt: selectedSlot.start,
        notes: form.notes || undefined,
      }),
    });

    const json = await res.json();
    if (!res.ok) { error = json.error?.message ?? "Booking failed"; step = "form"; return; }
    goto(`/event/${slug}/success?cancelToken=${json.data.cancelToken}&start=${selectedSlot.start}`);
  }
</script>

<svelte:head>
  <title>{eventType.name}</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <div class="max-w-4xl mx-auto py-10 px-4">
    <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div class="flex flex-col md:flex-row">
        <!-- Info panel -->
        <div class="w-full md:w-64 border-b md:border-b-0 md:border-r border-gray-100 p-8">
          <div class="w-2 h-2 rounded-full mb-3" style="background:{eventType.color}"></div>
          <h1 class="text-xl font-bold text-gray-900 mb-2">{eventType.name}</h1>
          {#if eventType.description}
            <p class="text-sm text-gray-500 mb-4">{eventType.description}</p>
          {/if}
          <div class="space-y-2 text-sm text-gray-600">
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {eventType.duration} min
            </div>
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Any available agent
            </div>
          </div>
        </div>

        <!-- Slots/form panel -->
        <div class="flex-1 p-8">
          {#if step === "select"}
            <h2 class="font-semibold text-gray-900 mb-4">
              {new Date(currentDate + "T12:00:00").toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}
            </h2>
            {#if slots.length === 0}
              <p class="text-sm text-gray-400">No available times on this day.</p>
            {:else}
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {#each slots as slot}
                  <button
                    onclick={() => { selectedSlot = { start: slot.start.toString(), end: slot.end.toString() }; step = "form"; }}
                    class="py-2 px-3 rounded-lg border border-blue-200 text-blue-700 text-sm hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors"
                  >
                    {formatTime(slot.start.toString())}
                  </button>
                {/each}
              </div>
            {/if}
          {:else}
            <button onclick={() => { step = "select"; selectedSlot = null; }} class="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
              Change time
            </button>
            <h2 class="text-lg font-semibold mb-6">Enter your details</h2>
            {#if error}
              <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
            {/if}
            <form onsubmit={submitBooking} class="space-y-4">
              <div>
                <label for="cn" class="block text-sm font-medium text-gray-700 mb-1">Full name *</label>
                <input id="cn" type="text" bind:value={form.contactName} required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label for="ce" class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input id="ce" type="email" bind:value={form.contactEmail} required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label for="cp" class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input id="cp" type="tel" bind:value={form.contactPhone} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button type="submit" disabled={step === "loading"} class="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors">
                {step === "loading" ? "Confirming…" : "Confirm booking"}
              </button>
            </form>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>
