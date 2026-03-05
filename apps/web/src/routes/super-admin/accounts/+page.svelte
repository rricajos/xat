<script lang="ts">
  import { enhance } from "$app/forms";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  let showCreate = $state(false);
</script>

<div class="p-8">
  <div class="mb-6 flex items-center justify-between">
    <h2 class="text-2xl font-bold text-gray-900">Accounts ({data.accounts.length})</h2>
    <button
      onclick={() => (showCreate = !showCreate)}
      class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
    >
      {showCreate ? "Cancel" : "Create Account"}
    </button>
  </div>

  {#if showCreate}
    <form
      method="POST"
      action="?/create"
      use:enhance={() => {
        return async ({ update }) => {
          await update();
          showCreate = false;
        };
      }}
      class="mb-6 flex gap-3 rounded-lg border border-gray-200 p-4"
    >
      <input
        name="name"
        type="text"
        required
        placeholder="Account name"
        class="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
      />
      <select
        name="locale"
        class="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
      >
        <option value="en">English</option>
        <option value="es">Spanish</option>
        <option value="pt">Portuguese</option>
        <option value="fr">French</option>
        <option value="de">German</option>
      </select>
      <button
        type="submit"
        class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Create
      </button>
    </form>
  {/if}

  <div class="rounded-lg bg-white shadow-sm overflow-hidden">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">ID</th>
          <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Name</th>
          <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Locale</th>
          <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Agents</th>
          <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500"
            >Conversations</th
          >
          <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Contacts</th>
          <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Created</th>
          <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500"></th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-200">
        {#each data.accounts as account}
          <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 text-sm font-medium text-gray-900">{account.id}</td>
            <td class="px-6 py-4 text-sm text-gray-700">
              {account.name}
              {#if account.domain}
                <span class="ml-1 text-xs text-gray-400">{account.domain}</span>
              {/if}
            </td>
            <td class="px-6 py-4 text-sm text-gray-500">{account.locale ?? "-"}</td>
            <td class="px-6 py-4 text-sm text-gray-500">{account.agentCount}</td>
            <td class="px-6 py-4 text-sm text-gray-500">{account.conversationCount}</td>
            <td class="px-6 py-4 text-sm text-gray-500">{account.contactCount}</td>
            <td class="px-6 py-4 text-sm text-gray-500">
              {new Date(account.createdAt).toLocaleDateString()}
            </td>
            <td class="px-6 py-4">
              <form method="POST" action="?/delete" use:enhance>
                <input type="hidden" name="accountId" value={account.id} />
                <button
                  type="submit"
                  class="text-xs text-red-600 hover:text-red-700"
                  onclick={(e) => {
                    if (!confirm(`Delete account "${account.name}"? This cannot be undone.`)) {
                      e.preventDefault();
                    }
                  }}>Delete</button
                >
              </form>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
