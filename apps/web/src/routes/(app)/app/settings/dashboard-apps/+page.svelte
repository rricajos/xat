<script lang="ts">
  import { enhance } from "$app/forms";
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();
  let showCreate = $state(false);
</script>

<div class="p-6">
  <div class="mb-6 flex items-center justify-between">
    <div>
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Dashboard Apps</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Embed external applications within your dashboard using iframes.
      </p>
    </div>
    <button
      onclick={() => (showCreate = !showCreate)}
      class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
    >
      {showCreate ? "Cancel" : "Add App"}
    </button>
  </div>

  {#if form?.error}
    <div class="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
      {form.error}
    </div>
  {/if}

  {#if showCreate}
    <form
      method="POST"
      action="?/create"
      use:enhance={() => {
        return async ({ update, result }) => {
          await update();
          if (result.type === "success") showCreate = false;
        };
      }}
      class="mb-6 rounded-lg border border-gray-200 p-4 dark:border-gray-700"
    >
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label for="app-title" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Title
          </label>
          <input
            id="app-title"
            name="title"
            type="text"
            required
            placeholder="e.g. CRM Dashboard"
            class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div>
          <label for="app-url" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            URL
          </label>
          <input
            id="app-url"
            name="url"
            type="url"
            required
            placeholder="https://example.com/app"
            class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
      </div>
      <div class="mt-4 flex justify-end">
        <button
          type="submit"
          class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Create App
        </button>
      </div>
    </form>
  {/if}

  <div class="rounded-lg border border-gray-200 dark:border-gray-700">
    <table class="w-full">
      <thead class="bg-gray-50 dark:bg-gray-800">
        <tr>
          <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Title</th>
          <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">URL</th>
          <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Created</th>
          <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Actions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
        {#each data.dashboardApps as app}
          <tr class="hover:bg-gray-50 dark:hover:bg-gray-800">
            <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
              {app.title}
            </td>
            <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
              {#if Array.isArray(app.content) && app.content.length > 0}
                <a href={app.content[0].url} target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline dark:text-blue-400">
                  {app.content[0].url}
                </a>
              {:else}
                —
              {/if}
            </td>
            <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
              {new Date(app.createdAt).toLocaleDateString()}
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <a
                  href="/app/dashboard-apps/{app.id}"
                  class="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Open
                </a>
                <form method="POST" action="?/delete" use:enhance>
                  <input type="hidden" name="appId" value={app.id} />
                  <button type="submit" class="text-xs text-red-600 hover:text-red-700 dark:text-red-400">
                    Delete
                  </button>
                </form>
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>

    {#if data.dashboardApps.length === 0}
      <div class="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        No dashboard apps configured. Add one to embed external tools.
      </div>
    {/if}
  </div>
</div>
