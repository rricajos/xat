<script lang="ts">
  import { enhance } from "$app/forms";

  const { data, form } = $props();

  const RATINGS = [
    { value: 1, emoji: "😡", label: "Awful" },
    { value: 2, emoji: "😞", label: "Bad" },
    { value: 3, emoji: "😐", label: "Okay" },
    { value: 4, emoji: "😊", label: "Good" },
    { value: 5, emoji: "😍", label: "Excellent" },
  ];

  let selectedRating = $state<number | null>(data.preRating);
</script>

<svelte:head>
  <title>Rate your support experience</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
  <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 max-w-md w-full text-center">

    {#if data.alreadySubmitted || form?.submitted}
      <!-- Thank you state -->
      <div class="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
        <svg class="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 class="text-2xl font-bold text-gray-900 mb-2">Thank you!</h1>
      <p class="text-gray-500">Your feedback has been submitted. We appreciate you taking the time.</p>

    {:else}
      <!-- Rating form -->
      <div class="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-5">
        <svg class="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      </div>
      <h1 class="text-2xl font-bold text-gray-900 mb-2">How was your experience?</h1>
      <p class="text-gray-500 mb-8">Please rate the support you received.</p>

      <form method="POST" use:enhance class="space-y-6">
        <!-- Star / emoji rating -->
        <div class="flex justify-center gap-3">
          {#each RATINGS as r}
            <label class="cursor-pointer group">
              <input
                type="radio"
                name="rating"
                value={r.value}
                class="sr-only"
                checked={selectedRating === r.value}
                onchange={() => selectedRating = r.value}
              />
              <div class="flex flex-col items-center gap-1">
                <span
                  class="text-3xl transition-transform group-hover:scale-110 {selectedRating === r.value ? 'scale-125' : 'opacity-50'}"
                >
                  {r.emoji}
                </span>
                <span class="text-xs text-gray-400 {selectedRating === r.value ? 'text-gray-700 font-medium' : ''}">{r.label}</span>
              </div>
            </label>
          {/each}
        </div>

        <!-- Optional feedback -->
        <div class="text-left">
          <label for="csat-feedback" class="block text-sm font-medium text-gray-700 mb-1">
            Additional feedback <span class="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="csat-feedback"
            name="feedbackText"
            rows="3"
            placeholder="Tell us more about your experience…"
            class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none"
          ></textarea>
        </div>

        {#if form?.error}
          <p class="text-sm text-red-600">{form.error}</p>
        {/if}

        <button
          type="submit"
          disabled={!selectedRating}
          class="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Submit Feedback
        </button>
      </form>
    {/if}
  </div>
</div>
