<script lang="ts">
  const { data } = $props();
  const { booking } = data;

  let cancelling = $state(false);
  let cancelled = $state(false);
  let cancelError = $state("");

  const formattedDate = new Date(booking.startAt).toLocaleString("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  async function confirmCancel() {
    cancelling = true;
    cancelError = "";
    const res = await fetch(`/api/v1/calendar/public/bookings/${booking.cancelToken}/cancel`, {
      method: "POST",
    });
    if (res.ok) {
      cancelled = true;
    } else {
      cancelError = "Could not cancel the booking. It may have already been cancelled.";
    }
    cancelling = false;
  }
</script>

<svelte:head>
  <title>Cancel booking</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
  <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 max-w-md w-full text-center">
    {#if cancelled}
      <!-- Cancelled state -->
      <div class="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
        <svg class="w-7 h-7 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h1 class="text-2xl font-bold text-gray-900 mb-2">Booking cancelled</h1>
      <p class="text-gray-500">Your booking has been cancelled. A confirmation email has been sent.</p>

    {:else if booking.status === "CANCELLED"}
      <!-- Already cancelled -->
      <div class="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
        <svg class="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1 class="text-xl font-bold text-gray-900 mb-2">Already cancelled</h1>
      <p class="text-gray-500">This booking has already been cancelled.</p>

    {:else}
      <!-- Confirm cancel -->
      <div class="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
        <svg class="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h1 class="text-2xl font-bold text-gray-900 mb-2">Cancel booking?</h1>
      <p class="text-gray-500 mb-6">You are about to cancel the following booking:</p>

      <div class="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-400">Contact</span>
          <span class="font-medium text-gray-800">{booking.contactName}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-400">Date</span>
          <span class="text-gray-700">{formattedDate}</span>
        </div>
        {#if booking.notes}
          <div class="flex justify-between">
            <span class="text-gray-400">Notes</span>
            <span class="text-gray-600">{booking.notes}</span>
          </div>
        {/if}
      </div>

      {#if cancelError}
        <p class="mb-4 text-sm text-red-600">{cancelError}</p>
      {/if}

      <div class="flex gap-3">
        <a href="/" class="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          Keep booking
        </a>
        <button onclick={confirmCancel} disabled={cancelling}
          class="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-60 transition-colors">
          {cancelling ? "Cancelling…" : "Yes, cancel"}
        </button>
      </div>
    {/if}
  </div>
</div>
