<script lang="ts">
  import { goto, invalidateAll } from "$app/navigation";
  import { onMount } from "svelte";

  const { data } = $props();

  // ── Constants ────────────────────────────────────────────────────────────────
  const HOUR_H = 60; // px per hour = 1px per minute
  const HOURS = Array.from({ length: 24 }, (_, i) => i);
  const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // ── Week state ───────────────────────────────────────────────────────────────
  let weekStart = $state(new Date(data.weekStart));
  $effect(() => {
    weekStart = new Date(data.weekStart);
  });

  const weekDays = $derived(
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    }),
  );

  const monthLabel = $derived(
    (() => {
      const first = weekDays[0]!;
      const last = weekDays[6]!;
      if (first.getMonth() === last.getMonth()) {
        return first.toLocaleDateString("en", { month: "long", year: "numeric" });
      }
      return (
        first.toLocaleDateString("en", { month: "short" }) +
        " – " +
        last.toLocaleDateString("en", { month: "short", year: "numeric" })
      );
    })(),
  );

  const today = new Date().toDateString();

  function prevWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    goto(`?week=${d.toISOString().split("T")[0]}`);
  }
  function nextWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    goto(`?week=${d.toISOString().split("T")[0]}`);
  }
  function goToday() {
    goto("/app/calendar/overview");
  }

  // ── Time helpers ─────────────────────────────────────────────────────────────
  function formatHour(h: number): string {
    if (h === 0) return "12 AM";
    if (h < 12) return `${h} AM`;
    if (h === 12) return "12 PM";
    return `${h - 12} PM`;
  }

  function minuteToY(min: number): number {
    return min * (HOUR_H / 60);
  }

  function yToMinute(y: number): number {
    return y / (HOUR_H / 60);
  }

  function snapTo(min: number, step = 30): number {
    return Math.round(min / step) * step;
  }

  function formatTime(d: Date | string): string {
    return new Date(d).toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" });
  }

  function minToTimeStr(min: number): string {
    const h = Math.floor(min / 60) % 24;
    const m = min % 60;
    const period = h < 12 ? "AM" : "PM";
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${String(m).padStart(2, "0")} ${period}`;
  }

  // ── Current time indicator ────────────────────────────────────────────────────
  let nowMin = $state(new Date().getHours() * 60 + new Date().getMinutes());
  $effect(() => {
    const id = setInterval(() => {
      const n = new Date();
      nowMin = n.getHours() * 60 + n.getMinutes();
    }, 30_000);
    return () => clearInterval(id);
  });

  // ── Scroll to 7am on mount ────────────────────────────────────────────────────
  let gridEl: HTMLElement | undefined;
  onMount(() => {
    if (gridEl) gridEl.scrollTop = 7 * HOUR_H - 40;
  });

  // ── Events ───────────────────────────────────────────────────────────────────
  type Booking = (typeof data.bookings)[0];
  type Blocked = (typeof data.blockedTimes)[0];

  function bookingsForDay(day: Date): Booking[] {
    return data.bookings.filter(
      (b) => new Date(b.startAt).toDateString() === day.toDateString(),
    );
  }
  function blockedForDay(day: Date): Blocked[] {
    return (data.blockedTimes ?? []).filter(
      (b) => new Date(b.startAt).toDateString() === day.toDateString(),
    );
  }

  function eventTop(startAt: Date | string): number {
    const d = new Date(startAt);
    return minuteToY(d.getHours() * 60 + d.getMinutes());
  }
  function eventHeight(startAt: Date | string, endAt: Date | string): number {
    const dur = (new Date(endAt).getTime() - new Date(startAt).getTime()) / 60_000;
    return Math.max(minuteToY(dur), 20);
  }

  const STATUS_BG: Record<string, string> = {
    CONFIRMED: "bg-blue-600 border-blue-700",
    PENDING: "bg-amber-500 border-amber-600",
    CANCELLED: "bg-gray-400 border-gray-500 opacity-60",
    COMPLETED: "bg-green-600 border-green-700",
    NO_SHOW: "bg-gray-500 border-gray-600",
  };
  const STATUS_LABEL: Record<string, string> = {
    CONFIRMED: "Confirmed",
    PENDING: "Pending",
    CANCELLED: "Cancelled",
    COMPLETED: "Completed",
    NO_SHOW: "No show",
  };

  // ── Hover ghost ──────────────────────────────────────────────────────────────
  let ghost = $state<{ colIdx: number; startMin: number } | null>(null);
  let hoveringEvent = $state(false);

  function onColMouseMove(e: MouseEvent, colIdx: number) {
    if (hoveringEvent || qs) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const y = e.clientY - rect.top;
    ghost = { colIdx, startMin: Math.max(0, Math.min(snapTo(yToMinute(y), 30), 23 * 60)) };
  }
  function onColMouseLeave() {
    ghost = null;
  }

  // ── Quick create ─────────────────────────────────────────────────────────────
  interface QuickState {
    colIdx: number;
    startMin: number;
    popX: number;
    popY: number;
    expanded: boolean;
  }
  let qs = $state<QuickState | null>(null);
  let qTitle = $state("");
  let qDuration = $state(30);
  let qNotes = $state("");
  let qSaving = $state(false);

  function onColClick(e: MouseEvent, colIdx: number) {
    if ((e.target as HTMLElement).closest("[data-event]")) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const y = e.clientY - rect.top;
    const startMin = Math.max(0, Math.min(snapTo(yToMinute(y), 30), 23 * 60));

    const POP_W = 288;
    const POP_H_QUICK = 200;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const popX = e.clientX + POP_W + 8 > vw ? e.clientX - POP_W - 8 : e.clientX + 8;
    const popY = e.clientY + POP_H_QUICK > vh - 16 ? vh - POP_H_QUICK - 16 : e.clientY;

    qTitle = "";
    qDuration = 30;
    qNotes = "";
    qs = { colIdx, startMin, popX, popY, expanded: false };
    ghost = null;
    setTimeout(() => (document.getElementById("qc-title") as HTMLInputElement)?.focus(), 30);
  }

  function closeQs() {
    qs = null;
  }
  function expandQs() {
    if (qs) qs = { ...qs, expanded: true };
    setTimeout(() => (document.getElementById("qc-title") as HTMLInputElement)?.focus(), 30);
  }

  async function saveQs() {
    if (!qs || !qTitle.trim()) return;
    qSaving = true;
    const day = weekDays[qs.colIdx]!;
    const startAt = new Date(day);
    startAt.setHours(Math.floor(qs.startMin / 60), qs.startMin % 60, 0, 0);
    const endAt = new Date(startAt.getTime() + qDuration * 60_000);
    await fetch("/api/v1/calendar/blocked-times", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        reason: qTitle.trim() + (qNotes.trim() ? `\n\n${qNotes.trim()}` : ""),
      }),
    });
    qSaving = false;
    closeQs();
    invalidateAll();
  }

  // ── Selected event detail ────────────────────────────────────────────────────
  type SelEvent = { type: "booking"; item: Booking } | { type: "blocked"; item: Blocked };
  let selected = $state<SelEvent | null>(null);

  // Close quick create on Escape
  $effect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (qs) closeQs();
        else if (selected) selected = null;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
</script>

<!-- Backdrop: click outside popover to close -->
{#if qs}
  <div class="fixed inset-0 z-40" role="presentation" onclick={closeQs}></div>
{/if}

<!-- Quick-create popover -->
{#if qs}
  <div
    class="fixed z-50 w-72 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900"
    style="left: {qs.popX}px; top: {qs.popY}px"
    role="dialog"
    aria-modal="true"
    onclick={(e) => e.stopPropagation()}
  >
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-gray-100 px-4 py-2.5 dark:border-gray-800">
      <span class="text-xs text-gray-500">
        {weekDays[qs.colIdx]?.toLocaleDateString("en", {
          weekday: "short",
          month: "short",
          day: "numeric",
        })} · {minToTimeStr(qs.startMin)}
      </span>
      <button
        onclick={closeQs}
        class="rounded p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <div class="space-y-3 p-4">
      <!-- Title -->
      <input
        id="qc-title"
        type="text"
        bind:value={qTitle}
        placeholder="Add title"
        class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-gray-800"
        onkeydown={(e) => {
          if (e.key === "Enter") saveQs();
          if (e.key === "Escape") closeQs();
        }}
      />

      <!-- Duration -->
      <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <svg class="h-4 w-4 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <select
          bind:value={qDuration}
          class="cursor-pointer border-none bg-transparent focus:outline-none dark:text-gray-300"
        >
          <option value={15}>15 min</option>
          <option value={30}>30 min</option>
          <option value={45}>45 min</option>
          <option value={60}>1 hour</option>
          <option value={90}>1.5 hours</option>
          <option value={120}>2 hours</option>
        </select>
      </div>

      <!-- Notes (expanded) -->
      {#if qs.expanded}
        <div class="flex items-start gap-2">
          <svg class="mt-1.5 h-4 w-4 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
          </svg>
          <textarea
            bind:value={qNotes}
            placeholder="Add notes…"
            rows="2"
            class="flex-1 resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
          ></textarea>
        </div>
      {/if}
    </div>

    <!-- Actions -->
    <div class="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-800/50">
      {#if !qs.expanded}
        <button
          onclick={expandQs}
          class="text-xs text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
        >
          More options ↓
        </button>
      {:else}
        <div></div>
      {/if}
      <div class="flex items-center gap-2">
        <button
          onclick={closeQs}
          class="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          Cancel
        </button>
        <button
          onclick={saveQs}
          disabled={!qTitle.trim() || qSaving}
          class="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {qSaving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Calendar shell -->
<div class="flex h-full flex-col overflow-hidden bg-white dark:bg-gray-900">

  <!-- ── Toolbar ── -->
  <div class="flex flex-shrink-0 items-center gap-3 border-b border-gray-200 px-4 py-2 dark:border-gray-700">
    <button
      onclick={goToday}
      class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
    >
      Today
    </button>
    <div class="flex items-center">
      <button
        onclick={prevWeek}
        class="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
        title="Previous week"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>
      <button
        onclick={nextWeek}
        class="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
        title="Next week"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    </div>
    <h2 class="text-sm font-semibold text-gray-900 dark:text-white">{monthLabel}</h2>
  </div>

  <!-- ── Calendar body ── -->
  <div class="flex flex-1 overflow-hidden">

    <!-- Main grid -->
    <div class="flex min-w-0 flex-1 flex-col overflow-hidden">

      <!-- Day headers (sticky) -->
      <div
        class="grid flex-shrink-0 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
        style="grid-template-columns: 52px repeat(7, 1fr)"
      >
        <!-- gutter spacer -->
        <div class="border-r border-gray-100 dark:border-gray-800"></div>
        {#each weekDays as day}
          <div
            class="flex flex-col items-center py-2 last:border-r-0 border-r border-gray-100 dark:border-gray-800
              {day.toDateString() === today ? 'bg-blue-50/60 dark:bg-blue-950/20' : ''}"
          >
            <span class="text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
              {DAY_NAMES[day.getDay()]}
            </span>
            <span
              class="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold
                {day.toDateString() === today
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-800 dark:text-gray-200'}"
            >
              {day.getDate()}
            </span>
          </div>
        {/each}
      </div>

      <!-- Scrollable time grid -->
      <div class="flex-1 overflow-y-auto" bind:this={gridEl}>
        <div class="grid" style="grid-template-columns: 52px repeat(7, 1fr)">

          <!-- Time labels -->
          <div>
            {#each HOURS as h}
              <div
                class="relative flex items-start justify-end pr-2"
                style="height: {HOUR_H}px"
              >
                {#if h > 0}
                  <span class="absolute -top-2 right-2 text-[10px] font-medium text-gray-400 dark:text-gray-500">
                    {formatHour(h)}
                  </span>
                {/if}
              </div>
            {/each}
          </div>

          <!-- Day columns -->
          {#each weekDays as day, colIdx}
            {@const dayBookings = bookingsForDay(day)}
            {@const dayBlocked = blockedForDay(day)}
            {@const isToday = day.toDateString() === today}

            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
              class="relative border-l border-gray-100 dark:border-gray-800 cursor-pointer select-none
                {isToday ? 'bg-blue-50/20 dark:bg-blue-950/10' : ''}"
              style="height: {24 * HOUR_H}px"
              onmousemove={(e) => onColMouseMove(e, colIdx)}
              onmouseleave={onColMouseLeave}
              onclick={(e) => onColClick(e, colIdx)}
            >
              <!-- Hour lines -->
              {#each HOURS as h}
                <div
                  class="pointer-events-none absolute left-0 right-0 border-t border-gray-100 dark:border-gray-800"
                  style="top: {h * HOUR_H}px"
                ></div>
                <!-- Half-hour line (lighter/dashed) -->
                <div
                  class="pointer-events-none absolute left-0 right-0 border-t border-dashed border-gray-100/70 dark:border-gray-800/60"
                  style="top: {h * HOUR_H + HOUR_H / 2}px"
                ></div>
              {/each}

              <!-- Current time indicator -->
              {#if isToday}
                <div
                  class="pointer-events-none absolute left-0 right-0 z-10 flex items-center"
                  style="top: {minuteToY(nowMin)}px"
                >
                  <div class="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-red-500" style="margin-left: -5px"></div>
                  <div class="flex-1 border-t-2 border-red-500"></div>
                </div>
              {/if}

              <!-- Hover ghost -->
              {#if ghost?.colIdx === colIdx && !qs && !hoveringEvent}
                <div
                  class="pointer-events-none absolute left-0.5 right-0.5 rounded-md border border-blue-300 bg-blue-100/80 dark:border-blue-700 dark:bg-blue-900/30"
                  style="top: {minuteToY(ghost.startMin)}px; height: {minuteToY(30)}px"
                >
                  <span class="block px-1.5 pt-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-300">
                    {minToTimeStr(ghost.startMin)}
                  </span>
                </div>
              {/if}

              <!-- Bookings -->
              {#each dayBookings as booking}
                <button
                  data-event
                  onmouseenter={() => (hoveringEvent = true)}
                  onmouseleave={() => (hoveringEvent = false)}
                  onclick|stopPropagation={() => {
                    selected = { type: "booking", item: booking };
                  }}
                  class="absolute left-0.5 right-0.5 overflow-hidden rounded-md border border-white/20 px-1.5 py-0.5 text-left text-white transition-opacity hover:opacity-90
                    {STATUS_BG[booking.status] ?? 'bg-blue-600 border-blue-700'}
                    {selected?.type === 'booking' && selected.item.id === booking.id ? 'ring-2 ring-white/60 ring-offset-1' : ''}"
                  style="top: {eventTop(booking.startAt)}px; height: {eventHeight(booking.startAt, booking.endAt)}px; min-height: 20px"
                >
                  <div class="truncate text-[10px] font-semibold leading-tight">{booking.contactName}</div>
                  <div class="text-[10px] leading-tight opacity-80">{formatTime(booking.startAt)}</div>
                </button>
              {/each}

              <!-- Blocked times -->
              {#each dayBlocked as block}
                <button
                  data-event
                  onmouseenter={() => (hoveringEvent = true)}
                  onmouseleave={() => (hoveringEvent = false)}
                  onclick|stopPropagation={() => {
                    selected = { type: "blocked", item: block };
                  }}
                  class="absolute left-0.5 right-0.5 overflow-hidden rounded-md border border-gray-300 bg-gray-100 px-1.5 py-0.5 text-left transition-opacity hover:opacity-90 dark:border-gray-600 dark:bg-gray-700
                    {selected?.type === 'blocked' && selected.item.id === block.id ? 'ring-2 ring-gray-400 ring-offset-1' : ''}"
                  style="top: {eventTop(block.startAt)}px; height: {eventHeight(block.startAt, block.endAt)}px; min-height: 20px"
                >
                  <div class="truncate text-[10px] font-semibold leading-tight text-gray-700 dark:text-gray-200">
                    {block.reason?.split("\n")[0] ?? "Blocked"}
                  </div>
                  <div class="text-[10px] leading-tight text-gray-500 dark:text-gray-400">
                    {formatTime(block.startAt)}
                  </div>
                </button>
              {/each}
            </div>
          {/each}
        </div>
      </div>
    </div>

    <!-- ── Detail panel ── -->
    {#if selected}
      <div class="flex w-64 flex-shrink-0 flex-col border-l border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <!-- Panel header -->
        <div class="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <h3 class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {selected.type === "booking" ? "Booking" : "Blocked time"}
          </h3>
          <button
            onclick={() => (selected = null)}
            class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
          {#if selected.type === "booking"}
            {@const b = selected.item as Booking}
            <div>
              <p class="mb-0.5 text-[10px] uppercase tracking-wide text-gray-400">Contact</p>
              <p class="font-medium text-gray-900 dark:text-white">{b.contactName}</p>
              <p class="text-xs text-gray-500">{b.contactEmail}</p>
              {#if b.contactPhone}<p class="text-xs text-gray-500">{b.contactPhone}</p>{/if}
            </div>
            <div>
              <p class="mb-0.5 text-[10px] uppercase tracking-wide text-gray-400">Time</p>
              <p class="text-gray-700 dark:text-gray-300">{formatTime(b.startAt)} → {formatTime(b.endAt)}</p>
              <p class="text-xs text-gray-500">
                {new Date(b.startAt).toLocaleDateString("en", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
            <div>
              <p class="mb-0.5 text-[10px] uppercase tracking-wide text-gray-400">Status</p>
              <span
                class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white
                  {STATUS_BG[b.status]?.split(' ')[0] ?? 'bg-gray-400'}"
              >
                {STATUS_LABEL[b.status] ?? b.status}
              </span>
            </div>
            {#if b.meetingUrl}
              <a
                href={b.meetingUrl}
                target="_blank"
                class="flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
              >
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
                Join meeting
              </a>
            {/if}
            {#if b.notes}
              <div>
                <p class="mb-0.5 text-[10px] uppercase tracking-wide text-gray-400">Notes</p>
                <p class="text-xs text-gray-600 dark:text-gray-400">{b.notes}</p>
              </div>
            {/if}
            <a
              href="/app/calendar/bookings"
              class="block pt-1 text-[11px] text-gray-400 hover:text-blue-600 hover:underline"
            >
              All bookings →
            </a>
          {:else}
            {@const b = selected.item as Blocked}
            <div>
              <p class="mb-0.5 text-[10px] uppercase tracking-wide text-gray-400">Title</p>
              <p class="font-medium text-gray-900 dark:text-white">{b.reason?.split("\n")[0] ?? "Blocked"}</p>
            </div>
            {#if b.reason?.includes("\n")}
              <div>
                <p class="mb-0.5 text-[10px] uppercase tracking-wide text-gray-400">Notes</p>
                <p class="text-xs text-gray-600 dark:text-gray-400">{b.reason.split("\n\n")[1]}</p>
              </div>
            {/if}
            <div>
              <p class="mb-0.5 text-[10px] uppercase tracking-wide text-gray-400">Time</p>
              <p class="text-gray-700 dark:text-gray-300">{formatTime(b.startAt)} → {formatTime(b.endAt)}</p>
              <p class="text-xs text-gray-500">
                {new Date(b.startAt).toLocaleDateString("en", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          {/if}
        </div>
      </div>
    {/if}

  </div>
</div>
