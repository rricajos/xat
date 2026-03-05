<script lang="ts">
  import { enhance } from "$app/forms";
  import * as m from "$lib/paraglide/messages";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  let showForm = $state(false);

  function formatMinutes(seconds: number | null): string {
    if (!seconds) return "—";
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    const remaining = mins % 60;
    return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
  }
</script>

<div class="p-6">
  <div class="flex items-center justify-between mb-6">
    <div>
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{m.settings_sla()}</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400">{m.settings_sla_description()}</p>
    </div>
    <button
      onclick={() => (showForm = !showForm)}
      class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
    >
      {showForm ? "Cancel" : "New SLA Policy"}
    </button>
  </div>

  {#if showForm}
    <form
      method="POST"
      action="?/create"
      use:enhance
      class="mb-6 rounded-lg border border-gray-200 p-4 dark:border-gray-700"
    >
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="sm:col-span-2">
          <label for="sla-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
          <input
            id="sla-name"
            name="name"
            type="text"
            required
            placeholder="e.g. Premium Support"
            class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div class="sm:col-span-2">
          <label for="sla-desc" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
          <input
            id="sla-desc"
            name="description"
            type="text"
            placeholder="Optional description"
            class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div>
          <label for="sla-frt" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            First Response Time (minutes)
          </label>
          <input
            id="sla-frt"
            name="firstResponseTime"
            type="number"
            min="1"
            placeholder="e.g. 15"
            class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div>
          <label for="sla-nrt" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Next Response Time (minutes)
          </label>
          <input
            id="sla-nrt"
            name="nextResponseTime"
            type="number"
            min="1"
            placeholder="e.g. 60"
            class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div>
          <label for="sla-rt" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Resolution Time (minutes)
          </label>
          <input
            id="sla-rt"
            name="resolutionTime"
            type="number"
            min="1"
            placeholder="e.g. 480"
            class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
      </div>
      <div class="mt-4">
        <button
          type="submit"
          class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Create Policy
        </button>
      </div>
    </form>
  {/if}

  <table class="w-full">
    <thead class="bg-gray-50 dark:bg-gray-800">
      <tr>
        <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Name</th>
        <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">First Response</th>
        <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Next Response</th>
        <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Resolution</th>
        <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
        <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Actions</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
      {#each data.policies as policy}
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-800">
          <td class="px-4 py-3">
            <div>
              <span class="text-sm font-medium text-gray-900 dark:text-white">{policy.name}</span>
              {#if policy.description}
                <p class="text-xs text-gray-500">{policy.description}</p>
              {/if}
            </div>
          </td>
          <td class="px-4 py-3 text-sm text-gray-500">
            {formatMinutes(policy.firstResponseTimeThreshold)}
          </td>
          <td class="px-4 py-3 text-sm text-gray-500">
            {formatMinutes(policy.nextResponseTimeThreshold)}
          </td>
          <td class="px-4 py-3 text-sm text-gray-500">
            {formatMinutes(policy.resolutionTimeThreshold)}
          </td>
          <td class="px-4 py-3">
            <form method="POST" action="?/toggle" use:enhance>
              <input type="hidden" name="slaId" value={policy.id} />
              <input type="hidden" name="active" value={String(policy.active)} />
              <button
                type="submit"
                class="rounded-full px-2 py-0.5 text-xs font-medium {policy.active
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'}"
              >
                {policy.active ? "Active" : "Inactive"}
              </button>
            </form>
          </td>
          <td class="px-4 py-3">
            <form method="POST" action="?/delete" use:enhance>
              <input type="hidden" name="slaId" value={policy.id} />
              <button type="submit" class="text-xs text-red-600 hover:text-red-700">
                Delete
              </button>
            </form>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
