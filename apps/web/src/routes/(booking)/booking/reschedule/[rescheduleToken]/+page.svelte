<script lang="ts">
  const { data } = $props();
  const { booking, rescheduleToken } = data;

  let selectedDate = $state(data.selectedDate);
  let slots = $state(data.slots);
  let selectedSlot = $state<string | null>(null);
  let loading = $state(false);
  let rescheduling = $state(false);
  let rescheduled = $state(false);
  let error = $state("");

  const formattedOriginal = new Date(booking.startAt).toLocaleString("en", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  async function loadSlots(date: string) {
    loading = true;
    slots = [];
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const slotsRes = await fetch(
      `/api/v1/calendar/public/slots?eventTypeId=${booking.eventTypeId}&date=${date}&tz=${encodeURIComponent(tz)}`
    );
    if (slotsRes.ok) {
      const body = await slotsRes.json();
      slots = body.data ?? [];
    }
    loading = false;
  }

  async function confirmReschedule() {
    if (!selectedSlot) return;
    rescheduling = true;
    error = "";
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const res = await fetch(`/api/v1/calendar/public/bookings/${rescheduleToken}/reschedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startAt: selectedSlot, timezone: tz }),
    });
    if (res.ok) {
      rescheduled = true;
    } else {
      const body = await res.json().catch(() => ({}));
      error = body.error ?? "Could not reschedule. Please try again.";
    }
    rescheduling = false;
  }

  function formatSlot(iso: string) {
    return new Date(iso).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" });
  }
</script>

<svelte:head>
  <title>Reschedule booking</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
  <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 max-w-lg w-full">

    {#if rescheduled}
      <div class="text-center">
        <div class="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg class="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Booking rescheduled!</h1>
        <p class="text-gray-500">You will receive a confirmation email with the updated details.</p>
      </div>

    {:else}
      <div class="flex items-center gap-3 mb-6">
        <div class="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
          <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h1 class="text-xl font-bold text-gray-900">Reschedule booking</h1>
          <p class="text-sm text-gray-500">Currently scheduled: {formattedOriginal}</p>
        </div>
      </div>

      <!-- Date picker -->
      <div class="mb-5">
        <label for="reschedule-date" class="block text-sm font-medium text-gray-700 mb-1">Select a new date</label>
        <input
          id="reschedule-date"
          type="date"
          value={selectedDate}
          min={new Date().toISOString().slice(0, 10)}
          onchange={(e) => { selectedDate = (e.currentTarget as HTMLInputElement).value; selectedSlot = null; loadSlots(selectedDate); }}
          class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      <!-- Time slots -->
      <div class="mb-6">
        <p class="text-sm font-medium text-gray-700 mb-2">Available times</p>
        {#if loading}
          <p class="text-sm text-gray-400">Loading slots…</p>
        {:else if slots.length === 0}
          <p class="text-sm text-gray-400">No available slots on this date.</p>
        {:else}
          <div class="grid grid-cols-3 gap-2">
            {#each slots.filter((s) => s.available) as slot}
              <button
                type="button"
                onclick={() => selectedSlot = slot.start}
                class="rounded-xl border px-3 py-2 text-sm font-medium transition-colors {selectedSlot === slot.start
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'}"
              >
                {formatSlot(slot.start)}
              </button>
            {/each}
          </div>
        {/if}
      </div>

      {#if error}
        <p class="mb-4 text-sm text-red-600">{error}</p>
      {/if}

      <div class="flex gap-3">
        <a
          href="/booking/cancel/{booking.cancelToken}"
          class="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors text-center"
        >
          Cancel instead
        </a>
        <button
          onclick={confirmReschedule}
          disabled={!selectedSlot || rescheduling}
          class="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors"
        >
          {rescheduling ? "Rescheduling…" : "Confirm reschedule"}
        </button>
      </div>
    {/if}
  </div>
</div>
