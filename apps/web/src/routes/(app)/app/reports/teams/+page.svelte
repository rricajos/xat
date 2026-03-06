<script lang="ts">
  import type { PageData } from "./$types";
  let { data }: { data: PageData } = $props();
</script>

<div class="p-6">
  <div class="flex items-center justify-between mb-6">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Team Reports</h2>
    <div class="flex items-center gap-2">
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
      <a href="/api/v1/reports/export?type=teams&days={data.days}" download class="flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800">
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
        CSV
      </a>
    </div>
  </div>

  <table class="w-full">
    <thead class="bg-gray-50 dark:bg-gray-800/50">
      <tr>
        <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Team</th>
        <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Conversations</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
      {#each data.teams as row}
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
          <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.team.name}</td>
          <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.conversationsCount}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
