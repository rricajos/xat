<script lang="ts">
  import type { PageData } from "./$types";
  let { data }: { data: PageData } = $props();
</script>

<div class="p-6">
  <div class="flex items-center justify-between mb-6">
    <h2 class="text-lg font-semibold text-gray-900">Label Reports</h2>
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
        <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Label</th>
        <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Conversations</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-gray-100">
      {#each data.labels as row}
        <tr class="hover:bg-gray-50">
          <td class="px-4 py-3">
            <span
              class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
              style="background-color: {row.label.color}20; color: {row.label.color}"
            >
              <span class="h-2 w-2 rounded-full" style="background-color: {row.label.color}"></span>
              {row.label.title}
            </span>
          </td>
          <td class="px-4 py-3 text-sm text-gray-700">{row.conversationsCount}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
