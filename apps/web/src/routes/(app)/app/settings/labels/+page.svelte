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
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{m.settings_labels()}</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400">{m.settings_labels_description()}</p>
    </div>
    <button
      onclick={() => showForm = !showForm}
      class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
    >
      {showForm ? "Cancel" : "Add Label"}
    </button>
  </div>

  {#if showForm}
    <form method="POST" action="?/create" use:enhance class="mb-6 rounded-lg border border-gray-200 p-4 space-y-4">
      <div>
        <label for="title" class="block text-sm font-medium text-gray-700">Title</label>
        <input
          id="title"
          name="title"
          type="text"
          required
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div>
        <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
        <input
          id="description"
          name="description"
          type="text"
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div>
        <label for="color" class="block text-sm font-medium text-gray-700">Color</label>
        <input id="color" name="color" type="color" value="#1f93ff" class="mt-1 h-10 w-20" />
      </div>
      <button type="submit" class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
        Create Label
      </button>
    </form>
  {/if}

  <div class="space-y-2">
    {#each data.labels as label}
      <div class="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
        <div class="flex items-center gap-3">
          <span class="h-3 w-3 rounded-full" style="background-color: {label.color}"></span>
          <div>
            <p class="text-sm font-medium text-gray-900">{label.title}</p>
            {#if label.description}
              <p class="text-xs text-gray-500">{label.description}</p>
            {/if}
          </div>
        </div>
        <form method="POST" action="?/delete" use:enhance>
          <input type="hidden" name="labelId" value={label.id} />
          <button type="submit" class="text-xs text-red-600 hover:text-red-700">
            Delete
          </button>
        </form>
      </div>
    {/each}

    {#if data.labels.length === 0}
      <p class="text-center text-sm text-gray-400 py-8">No labels yet</p>
    {/if}
  </div>
</div>
