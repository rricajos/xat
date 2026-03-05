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
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{m.settings_teams()}</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400">{m.settings_teams_description()}</p>
    </div>
    <button
      onclick={() => (showForm = !showForm)}
      class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
    >
      {showForm ? "Cancel" : "Create Team"}
    </button>
  </div>

  {#if showForm}
    <form
      method="POST"
      action="?/create"
      use:enhance={() => {
        return async ({ update }) => {
          await update();
          showForm = false;
        };
      }}
      class="mb-6 rounded-lg border border-gray-200 p-4 space-y-4 dark:border-gray-700"
    >
      <div>
        <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >Name</label
        >
        <input
          id="name"
          name="name"
          type="text"
          required
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </div>
      <div>
        <label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >Description</label
        >
        <textarea
          id="description"
          name="description"
          rows="2"
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        ></textarea>
      </div>
      <button
        type="submit"
        class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Create Team
      </button>
    </form>
  {/if}

  <div class="space-y-2">
    {#each data.teams as team}
      <a
        href="/app/settings/teams/{team.id}"
        class="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
      >
        <div>
          <p class="text-sm font-medium text-gray-900 dark:text-white">{team.name}</p>
          {#if team.description}
            <p class="text-xs text-gray-500 dark:text-gray-400">{team.description}</p>
          {/if}
        </div>
        <svg
          class="h-4 w-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </a>
    {/each}

    {#if data.teams.length === 0}
      <p class="text-center text-sm text-gray-400 py-8">No teams yet</p>
    {/if}
  </div>
</div>
