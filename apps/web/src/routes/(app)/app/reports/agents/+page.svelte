<script lang="ts">
  import type { PageData } from "./$types";
  let { data }: { data: PageData } = $props();
</script>

<div class="p-6">
  <div class="flex items-center justify-between mb-6">
    <h2 class="text-lg font-semibold text-gray-900">Agent Reports</h2>
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

  <table class="w-full">
    <thead class="bg-gray-50">
      <tr>
        <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Agent</th>
        <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Conversations</th>
        <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Resolved</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-gray-100">
      {#each data.agents as row}
        <tr class="hover:bg-gray-50">
          <td class="px-4 py-3">
            <div class="flex items-center gap-3">
              <div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700">
                {row.agent.name?.charAt(0)?.toUpperCase() ?? "?"}
              </div>
              <span class="text-sm font-medium text-gray-900">{row.agent.name}</span>
            </div>
          </td>
          <td class="px-4 py-3 text-sm text-gray-700">{row.conversationsCount}</td>
          <td class="px-4 py-3 text-sm text-gray-700">{row.resolutionCount}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
