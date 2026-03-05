<script lang="ts">
  import * as m from "$lib/paraglide/messages";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<div class="p-6">
  <div class="mb-6">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{m.settings_audit_log()}</h2>
    <p class="text-sm text-gray-500 dark:text-gray-400">{m.settings_audit_log_description()}</p>
  </div>

  <table class="w-full">
    <thead class="bg-gray-50">
      <tr>
        <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Time</th>
        <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">User</th>
        <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Action</th>
        <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Resource</th>
        <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">IP Address</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-gray-100">
      {#each data.logs as log}
        <tr class="hover:bg-gray-50">
          <td class="px-4 py-3 text-sm text-gray-500">
            {new Date(log.createdAt).toLocaleString()}
          </td>
          <td class="px-4 py-3 text-sm text-gray-700">
            {log.userName ?? "System"}
          </td>
          <td class="px-4 py-3">
            <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              {log.action}
            </span>
          </td>
          <td class="px-4 py-3 text-sm text-gray-500">
            {#if log.auditableType}
              {log.auditableType} #{log.auditableId}
            {:else}
              —
            {/if}
          </td>
          <td class="px-4 py-3 text-sm text-gray-400">
            {log.ipAddress ?? "—"}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>

  {#if data.total > 50}
    <div class="mt-4 flex justify-center gap-2">
      {#if data.page > 1}
        <a
          href="?page={data.page - 1}"
          class="rounded-md border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
        >
          Previous
        </a>
      {/if}
      <span class="px-3 py-1 text-sm text-gray-500">
        Page {data.page} of {Math.ceil(data.total / 50)}
      </span>
      {#if data.page * 50 < data.total}
        <a
          href="?page={data.page + 1}"
          class="rounded-md border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
        >
          Next
        </a>
      {/if}
    </div>
  {/if}
</div>
