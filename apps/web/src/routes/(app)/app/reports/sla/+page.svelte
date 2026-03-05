<script lang="ts">
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<div class="p-6">
  <div class="flex items-center justify-between mb-6">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-white">SLA Reports</h2>
    <div class="flex gap-2">
      {#each [7, 30, 90] as d}
        <a
          href="?days={d}"
          class="rounded-md px-3 py-1 text-sm {data.days === d
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
        >
          {d}d
        </a>
      {/each}
    </div>
  </div>

  <div class="grid grid-cols-4 gap-4 mb-8">
    <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <p class="text-sm text-gray-500">Total Applied</p>
      <p class="text-2xl font-bold text-gray-900 dark:text-white">{data.metrics.totalApplied}</p>
    </div>
    <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <p class="text-sm text-gray-500">Hits</p>
      <p class="text-2xl font-bold text-green-600">{data.metrics.hits}</p>
    </div>
    <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <p class="text-sm text-gray-500">Misses</p>
      <p class="text-2xl font-bold text-red-600">{data.metrics.misses}</p>
    </div>
    <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <p class="text-sm text-gray-500">Hit Rate</p>
      <p class="text-2xl font-bold text-gray-900 dark:text-white">
        {data.metrics.hitRate !== null ? `${data.metrics.hitRate}%` : "—"}
      </p>
    </div>
  </div>

  {#if data.metrics.totalApplied === 0}
    <div class="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800">
      <p class="text-gray-500">No SLA policies have been applied to conversations in this period.</p>
      <a href="/app/settings/sla-policies" class="mt-2 inline-block text-sm text-blue-600 hover:text-blue-700">
        Configure SLA Policies
      </a>
    </div>
  {/if}
</div>
