<script lang="ts">
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const ratingLabels: Record<number, string> = {
    1: "Awful",
    2: "Bad",
    3: "Okay",
    4: "Good",
    5: "Excellent",
  };

  const ratingEmoji: Record<number, string> = {
    1: "😡",
    2: "😞",
    3: "😐",
    4: "😊",
    5: "😍",
  };
</script>

<div class="p-6">
  <div class="flex items-center justify-between mb-6">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-white">CSAT Reports</h2>
    <div class="flex gap-2">
      {#each [7, 30, 90] as d}
        <a
          href="?days={d}"
          class="rounded-md px-3 py-1 text-sm {data.days === d
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'}"
        >
          {d}d
        </a>
      {/each}
    </div>
  </div>

  <div class="grid grid-cols-3 gap-4 mb-8">
    <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <p class="text-sm text-gray-500 dark:text-gray-400">Total Responses</p>
      <p class="text-2xl font-bold text-gray-900 dark:text-white">{data.metrics.totalResponses}</p>
    </div>
    <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <p class="text-sm text-gray-500 dark:text-gray-400">Avg Rating</p>
      <p class="text-2xl font-bold text-gray-900 dark:text-white">
        {data.metrics.averageRating?.toFixed(1) ?? "—"}
      </p>
    </div>
    <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <p class="text-sm text-gray-500 dark:text-gray-400">Satisfaction Score</p>
      <p class="text-2xl font-bold text-gray-900 dark:text-white">
        {data.metrics.satisfactionScore !== null
          ? `${data.metrics.satisfactionScore}%`
          : "—"}
      </p>
    </div>
  </div>

  <div class="mb-8">
    <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Rating Distribution</h3>
    <div class="space-y-2">
      {#each [5, 4, 3, 2, 1] as rating}
        {@const ratingCount = data.metrics.ratingDistribution[rating] ?? 0}
        {@const percentage = data.metrics.totalResponses > 0
          ? Math.round((ratingCount / data.metrics.totalResponses) * 100)
          : 0}
        <div class="flex items-center gap-3">
          <span class="w-20 text-sm text-gray-600 dark:text-gray-400">
            {ratingEmoji[rating]} {ratingLabels[rating]}
          </span>
          <div class="flex-1 h-5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full {rating >= 4
                ? 'bg-green-500'
                : rating === 3
                  ? 'bg-yellow-500'
                  : 'bg-red-500'}"
              style="width: {percentage}%"
            ></div>
          </div>
          <span class="w-12 text-right text-sm text-gray-500 dark:text-gray-400">{ratingCount}</span>
        </div>
      {/each}
    </div>
  </div>

  <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Recent Responses</h3>
  <table class="w-full">
    <thead class="bg-gray-50 dark:bg-gray-800/50">
      <tr>
        <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Conversation</th>
        <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Rating</th>
        <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Feedback</th>
        <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Date</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
      {#each data.responses as response}
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
          <td class="px-4 py-3 text-sm text-blue-600 dark:text-blue-400">
            <a href="/app/conversations/{response.conversationId}">
              #{response.conversationId}
            </a>
          </td>
          <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">
            {ratingEmoji[response.rating]} {response.rating}/5
          </td>
          <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
            {response.feedbackText ?? "—"}
          </td>
          <td class="px-4 py-3 text-sm text-gray-400 dark:text-gray-500">
            {new Date(response.createdAt).toLocaleDateString()}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
