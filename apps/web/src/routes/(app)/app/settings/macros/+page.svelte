<script lang="ts">
  import { enhance } from "$app/forms";
  import * as m from "$lib/paraglide/messages";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  let showForm = $state(false);
</script>

<div class="p-6">
  <div class="flex items-center justify-between mb-6">
    <div>
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{m.settings_macros()}</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400">{m.settings_macros_description()}</p>
    </div>
    <button
      onclick={() => (showForm = !showForm)}
      class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
    >
      {showForm ? "Cancel" : "New Macro"}
    </button>
  </div>

  {#if showForm}
    <form
      method="POST"
      action="?/create"
      use:enhance
      class="mb-6 rounded-lg border border-gray-200 p-4 dark:border-gray-700"
    >
      <div class="flex gap-3">
        <input
          name="name"
          type="text"
          required
          placeholder="Macro name"
          class="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
        <select
          name="visibility"
          class="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          <option value="personal">Personal</option>
          <option value="global">Global</option>
        </select>
        <button
          type="submit"
          class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Create
        </button>
      </div>
      <p class="mt-2 text-xs text-gray-500">
        Actions can be configured after creation.
      </p>
    </form>
  {/if}

  <table class="w-full">
    <thead class="bg-gray-50 dark:bg-gray-800">
      <tr>
        <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Name</th>
        <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Visibility</th>
        <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Actions</th>
        <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Created</th>
        <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500"></th>
      </tr>
    </thead>
    <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
      {#each data.macros as macro}
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-800">
          <td class="px-4 py-3 text-sm font-medium">
            <a
              href="/app/settings/macros/{macro.id}"
              class="text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
            >
              {macro.name}
            </a>
          </td>
          <td class="px-4 py-3">
            <span class="rounded-full px-2 py-0.5 text-xs font-medium {macro.visibility === 'global'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600'}">
              {macro.visibility}
            </span>
          </td>
          <td class="px-4 py-3 text-sm text-gray-500">
            {(macro.actions as unknown[]).length} actions
          </td>
          <td class="px-4 py-3 text-sm text-gray-500">
            {new Date(macro.createdAt).toLocaleDateString()}
          </td>
          <td class="px-4 py-3">
            <form method="POST" action="?/delete" use:enhance>
              <input type="hidden" name="macroId" value={macro.id} />
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
