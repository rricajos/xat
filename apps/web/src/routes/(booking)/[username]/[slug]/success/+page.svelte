<script lang="ts">
  import { page } from "$app/stores";

  const cancelToken = $derived($page.url.searchParams.get("cancelToken") ?? "");
  const start = $derived($page.url.searchParams.get("start") ?? "");

  const formattedDate = $derived(
    start
      ? new Date(start).toLocaleString("en", {
          weekday: "long",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "",
  );

  async function cancelBooking() {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    const res = await fetch(`/api/v1/calendar/public/bookings/${cancelToken}/cancel`, {
      method: "POST",
    });
    if (res.ok) {
      window.location.href = "/booking/cancelled";
    }
  }
</script>

<svelte:head>
  <title>Booking confirmed</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
  <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 max-w-md w-full text-center">
    <div class="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
      <svg class="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
    </div>

    <h1 class="text-2xl font-bold text-gray-900 mb-2">Booking confirmed!</h1>
    <p class="text-gray-500 mb-6">A confirmation email has been sent to you.</p>

    {#if formattedDate}
      <div class="bg-gray-50 rounded-xl p-4 mb-6 text-sm text-gray-700">
        <div class="font-medium">{formattedDate}</div>
      </div>
    {/if}

    {#if cancelToken}
      <button
        onclick={cancelBooking}
        class="text-sm text-gray-400 hover:text-red-500 transition-colors"
      >
        Cancel this booking
      </button>
    {/if}
  </div>
</div>
