<script lang="ts">
  import { goto } from "$app/navigation";

  const { data } = $props();
  const { eventType, agent, selectedDate, slots, username, slug } = data;

  let currentDate = $state(selectedDate);
  let selectedSlot = $state<{ start: string; end: string } | null>(null);
  let step = $state<"select" | "form" | "loading">("select");

  let form = $state({
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    notes: "",
  });

  let error = $state("");

  const locationTypeLabel: Record<string, string> = {
    VIDEO_DYTE: "Video",
    VIDEO_GOOGLE_MEET: "Google Meet",
    VIDEO_ZOOM: "Zoom",
    PHONE: "Phone",
    IN_PERSON: "In Person",
    CUSTOM: "Custom",
  };

  // Generate calendar grid for current month
  function getCalendarDays(dateStr: string) {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = d.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: Array<{ date: string; label: number; disabled: boolean }> = [];

    // Fill leading empty cells
    for (let i = 0; i < firstDay; i++) days.push({ date: "", label: 0, disabled: true });

    const today = new Date().toISOString().split("T")[0]!;
    for (let i = 1; i <= daysInMonth; i++) {
      const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      days.push({ date, label: i, disabled: date < today });
    }
    return days;
  }

  const calendarDays = $derived(getCalendarDays(currentDate));
  const monthLabel = $derived(
    new Date(currentDate + "T12:00:00").toLocaleDateString("en", { month: "long", year: "numeric" }),
  );

  async function selectDate(date: string) {
    currentDate = date;
    selectedSlot = null;
    await goto(`/${username}/${slug}?date=${date}`, { invalidateAll: true });
  }

  async function submitBooking(e: SubmitEvent) {
    e.preventDefault();
    if (!selectedSlot) return;
    error = "";
    step = "loading";

    try {
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
      if (!res.ok) {
        error = json.error?.message ?? "Booking failed";
        step = "form";
        return;
      }

      goto(`/${username}/${slug}/success?cancelToken=${json.data.cancelToken}&start=${selectedSlot.start}`);
    } catch {
      error = "Network error, please try again";
      step = "form";
    }
  }

  function formatTime(isoStr: string) {
    return new Date(isoStr).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" });
  }
</script>

<svelte:head>
  <title>{eventType.name} — {agent.displayName ?? agent.name}</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <div class="max-w-5xl mx-auto py-10 px-4">
    <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div class="flex flex-col md:flex-row">

        <!-- Left panel: event info -->
        <div class="w-full md:w-72 border-b md:border-b-0 md:border-r border-gray-100 p-8">
          <a href="/{username}" class="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 mb-6">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            {agent.displayName ?? agent.name}
          </a>

          <div class="w-2 h-2 rounded-full mb-3" style="background:{eventType.color}"></div>
          <h1 class="text-xl font-bold text-gray-900 mb-2">{eventType.name}</h1>

          {#if eventType.description}
            <p class="text-sm text-gray-500 mb-4">{eventType.description}</p>
          {/if}

          <div class="space-y-2 text-sm text-gray-600">
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {eventType.duration} min
            </div>
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {locationTypeLabel[eventType.locationType] ?? eventType.locationType}
            </div>
          </div>

          {#if selectedSlot}
            <div class="mt-6 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
              <div class="font-medium">{new Date(currentDate + "T12:00:00").toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}</div>
              <div>{formatTime(selectedSlot.start)}</div>
            </div>
          {/if}
        </div>

        <!-- Right panel: calendar + slots / form -->
        <div class="flex-1 p-8">
          {#if step === "select"}
            <!-- Month calendar -->
            <div class="mb-6">
              <div class="flex items-center justify-between mb-4">
                <h2 class="font-semibold text-gray-900">{monthLabel}</h2>
                <div class="flex gap-1">
                  <button
                    onclick={() => {
                      const d = new Date(currentDate + "T12:00:00");
                      d.setMonth(d.getMonth() - 1);
                      currentDate = d.toISOString().split("T")[0]!;
                    }}
                    class="p-1.5 rounded hover:bg-gray-100 text-gray-500"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onclick={() => {
                      const d = new Date(currentDate + "T12:00:00");
                      d.setMonth(d.getMonth() + 1);
                      currentDate = d.toISOString().split("T")[0]!;
                    }}
                    class="p-1.5 rounded hover:bg-gray-100 text-gray-500"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7 7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-2">
                {#each ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as d}
                  <div>{d}</div>
                {/each}
              </div>
              <div class="grid grid-cols-7 gap-1">
                {#each calendarDays as day}
                  {#if !day.date}
                    <div></div>
                  {:else}
                    <button
                      onclick={() => !day.disabled && selectDate(day.date)}
                      disabled={day.disabled}
                      class={[
                        "h-9 w-9 mx-auto rounded-full text-sm flex items-center justify-center transition-colors",
                        day.date === currentDate
                          ? "bg-blue-600 text-white font-semibold"
                          : day.disabled
                            ? "text-gray-300 cursor-not-allowed"
                            : "text-gray-700 hover:bg-blue-50 hover:text-blue-600",
                      ].join(" ")}
                    >
                      {day.label}
                    </button>
                  {/if}
                {/each}
              </div>
            </div>

            <!-- Time slots -->
            <div>
              <h3 class="text-sm font-medium text-gray-700 mb-3">
                {new Date(currentDate + "T12:00:00").toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}
              </h3>
              {#if slots.length === 0}
                <p class="text-sm text-gray-400">No available times on this day.</p>
              {:else}
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {#each slots as slot}
                    <button
                      onclick={() => {
                        selectedSlot = { start: slot.start.toString(), end: slot.end.toString() };
                        step = "form";
                      }}
                      class="py-2 px-3 rounded-lg border border-blue-200 text-blue-700 text-sm hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors"
                    >
                      {formatTime(slot.start.toString())}
                    </button>
                  {/each}
                </div>
              {/if}
            </div>

          {:else if step === "form" || step === "loading"}
            <!-- Booking form -->
            <div>
              <button
                onclick={() => { step = "select"; selectedSlot = null; }}
                class="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
                Change time
              </button>

              <h2 class="text-lg font-semibold text-gray-900 mb-6">Enter your details</h2>

              {#if error}
                <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              {/if}

              <form onsubmit={submitBooking} class="space-y-4">
                <div>
                  <label for="contactName" class="block text-sm font-medium text-gray-700 mb-1">Full name *</label>
                  <input
                    id="contactName"
                    type="text"
                    bind:value={form.contactName}
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label for="contactEmail" class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    id="contactEmail"
                    type="email"
                    bind:value={form.contactEmail}
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label for="contactPhone" class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    id="contactPhone"
                    type="tel"
                    bind:value={form.contactPhone}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label for="notes" class="block text-sm font-medium text-gray-700 mb-1">Additional notes</label>
                  <textarea
                    id="notes"
                    bind:value={form.notes}
                    rows="3"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={step === "loading"}
                  class="w-full py-2.5 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {step === "loading" ? "Confirming…" : "Confirm booking"}
                </button>
              </form>
            </div>
          {/if}
        </div>

      </div>
    </div>
  </div>
</div>
