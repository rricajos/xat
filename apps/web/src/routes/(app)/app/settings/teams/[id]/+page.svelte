<script lang="ts">
  import { enhance } from "$app/forms";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  let editMode = $state(false);
</script>

<div class="p-6">
  <div class="mb-6">
    <a
      href="/app/settings/teams"
      class="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
    >
      &larr; Back to Teams
    </a>
  </div>

  <!-- Team Info -->
  {#if editMode}
    <form
      method="POST"
      action="?/update"
      use:enhance={() => {
        return async ({ update }) => {
          await update();
          editMode = false;
        };
      }}
      class="mb-8 space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700"
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
          value={data.team.name}
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </div>
      <div>
        <label
          for="description"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label
        >
        <textarea
          id="description"
          name="description"
          rows="2"
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >{data.team.description ?? ""}</textarea
        >
      </div>
      <div class="flex items-center gap-2">
        <input
          type="checkbox"
          id="allowAutoAssign"
          name="allowAutoAssign"
          checked={data.team.allowAutoAssign ?? true}
          class="h-4 w-4 rounded border-gray-300"
        />
        <label for="allowAutoAssign" class="text-sm text-gray-700 dark:text-gray-300"
          >Allow auto-assignment (round-robin)</label
        >
      </div>
      <div class="flex gap-2">
        <button
          type="submit"
          class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >Save</button
        >
        <button
          type="button"
          onclick={() => (editMode = false)}
          class="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >Cancel</button
        >
      </div>
    </form>
  {:else}
    <div class="mb-8 flex items-start justify-between">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          {data.team.name}
        </h2>
        {#if data.team.description}
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {data.team.description}
          </p>
        {/if}
        <p class="mt-1 text-xs text-gray-400">
          Auto-assign: {data.team.allowAutoAssign ? "Enabled" : "Disabled"}
        </p>
      </div>
      <button
        onclick={() => (editMode = true)}
        class="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >Edit</button
      >
    </div>
  {/if}

  <!-- Members Section -->
  <div>
    <div class="mb-4 flex items-center justify-between">
      <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
        Members ({data.members.length})
      </h3>
    </div>

    <!-- Add Member -->
    {#if data.availableAgents.length > 0}
      <form
        method="POST"
        action="?/addMember"
        use:enhance
        class="mb-4 flex items-center gap-2"
      >
        <select
          name="userId"
          required
          class="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          <option value="">Select agent to add...</option>
          {#each data.availableAgents as agent}
            <option value={agent.id}>{agent.name ?? agent.email}</option>
          {/each}
        </select>
        <button
          type="submit"
          class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >Add</button
        >
      </form>
    {/if}

    <!-- Member List -->
    <div class="space-y-2">
      {#each data.members as member}
        <div
          class="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-700"
        >
          <div class="flex items-center gap-3">
            {#if member.avatarUrl}
              <img
                src={member.avatarUrl}
                alt={member.name ?? ""}
                class="h-8 w-8 rounded-full"
              />
            {:else}
              <div
                class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300"
              >
                {(member.name ?? member.email ?? "?").charAt(0).toUpperCase()}
              </div>
            {/if}
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                {member.name ?? member.email}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {member.email}
              </p>
            </div>
            <span
              class="ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs {member.availability === 0
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : member.availability === 1
                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}"
            >
              {member.availability === 0 ? "online" : member.availability === 1 ? "busy" : "offline"}
            </span>
          </div>
          <form method="POST" action="?/removeMember" use:enhance>
            <input type="hidden" name="userId" value={member.id} />
            <button
              type="submit"
              class="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >Remove</button
            >
          </form>
        </div>
      {/each}

      {#if data.members.length === 0}
        <p class="py-8 text-center text-sm text-gray-400">
          No members in this team yet. Add agents above.
        </p>
      {/if}
    </div>
  </div>
</div>
