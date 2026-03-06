<script lang="ts">
  import { enhance } from "$app/forms";
  import * as m from "$lib/paraglide/messages";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  let showForm = $state(false);

  const availabilityLabels: Record<number, { label: string; color: string }> = {
    0: { label: "Online", color: "bg-green-500" },
    1: { label: "Busy", color: "bg-yellow-500" },
    2: { label: "Offline", color: "bg-gray-400" },
  };
</script>

<div class="p-6">
  <div class="flex items-center justify-between mb-6">
    <div>
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{m.settings_agents()}</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400">{m.settings_agents_description()}</p>
    </div>
    <button
      onclick={() => showForm = !showForm}
      class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
    >
      {showForm ? "Cancel" : "Invite Agent"}
    </button>
  </div>

  {#if showForm}
    <form method="POST" action="?/invite" use:enhance class="mb-6 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4 dark:bg-gray-800/50">
      <div>
        <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
        <input
          id="name"
          name="name"
          type="text"
          required
          class="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
        />
      </div>
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          class="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
        />
      </div>
      <div>
        <label for="role" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
        <select
          id="role"
          name="role"
          class="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
        >
          <option value="agent">Agent</option>
          <option value="administrator">Administrator</option>
        </select>
      </div>
      <button type="submit" class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
        Send Invitation
      </button>
    </form>
  {/if}

  <div class="space-y-2">
    {#each data.agents as agent}
      <div class="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50">
        <div class="flex items-center gap-3">
          <div class="relative">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300">
              {agent.name.slice(0, 2).toUpperCase()}
            </div>
            <span
              class="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-gray-900 {availabilityLabels[agent.availability ?? 2]?.color}"
            ></span>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">{agent.name}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">{agent.email}</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <span class="rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400 capitalize">
            {agent.role}
          </span>
          <form method="POST" action="?/remove" use:enhance>
            <input type="hidden" name="userId" value={agent.id} />
            <button type="submit" class="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
              Remove
            </button>
          </form>
        </div>
      </div>
    {/each}
  </div>
</div>
