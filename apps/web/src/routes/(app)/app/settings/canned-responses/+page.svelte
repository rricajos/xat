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
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{m.settings_canned_responses()}</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400">{m.settings_canned_responses_description()}</p>
    </div>
    <button
      onclick={() => showForm = !showForm}
      class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
    >
      {showForm ? "Cancel" : "Add Response"}
    </button>
  </div>

  {#if showForm}
    <form method="POST" action="?/create" use:enhance class="mb-6 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4 dark:bg-gray-800/50">
      <div>
        <label for="shortCode" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Short Code
        </label>
        <div class="mt-1 flex items-center">
          <span class="text-gray-400 dark:text-gray-500 mr-1">/</span>
          <input
            id="shortCode"
            name="shortCode"
            type="text"
            required
            placeholder="greeting"
            class="block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          />
        </div>
      </div>
      <div>
        <label for="content" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Content</label>
        <textarea
          id="content"
          name="content"
          rows="4"
          required
          placeholder="Hello! How can I help you today?"
          class="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
        ></textarea>
      </div>
      <button type="submit" class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
        Save Response
      </button>
    </form>
  {/if}

  <div class="space-y-2">
    {#each data.cannedResponses as response}
      <div class="flex items-start justify-between rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50">
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 dark:text-white">/{response.shortCode}</p>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400 truncate">{response.content}</p>
        </div>
        <form method="POST" action="?/delete" use:enhance class="flex-shrink-0 ml-4">
          <input type="hidden" name="id" value={response.id} />
          <button type="submit" class="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
            Delete
          </button>
        </form>
      </div>
    {/each}

    {#if data.cannedResponses.length === 0}
      <p class="text-center text-sm text-gray-400 dark:text-gray-500 py-8">No canned responses yet</p>
    {/if}
  </div>
</div>
