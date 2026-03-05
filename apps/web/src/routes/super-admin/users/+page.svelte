<script lang="ts">
  import { enhance } from "$app/forms";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<div class="p-8">
  <h2 class="text-2xl font-bold text-gray-900 mb-6">Users ({data.users.length})</h2>

  <div class="rounded-lg bg-white shadow-sm overflow-hidden">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">ID</th>
          <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Name</th>
          <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Email</th>
          <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Type</th>
          <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500"
            >Availability</th
          >
          <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Created</th>
          <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500"></th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-200">
        {#each data.users as user}
          <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 text-sm font-medium text-gray-900">{user.id}</td>
            <td class="px-6 py-4 text-sm text-gray-700">{user.name}</td>
            <td class="px-6 py-4 text-sm text-gray-500">{user.email}</td>
            <td class="px-6 py-4">
              <span
                class="rounded-full px-2 py-0.5 text-xs font-medium {user.type === 'super_admin'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-600'}"
              >
                {user.type ?? "User"}
              </span>
            </td>
            <td class="px-6 py-4">
              <span
                class="inline-flex items-center gap-1 text-xs {user.availability === 0
                  ? 'text-green-600'
                  : user.availability === 1
                    ? 'text-yellow-600'
                    : 'text-gray-400'}"
              >
                <span
                  class="h-2 w-2 rounded-full {user.availability === 0
                    ? 'bg-green-500'
                    : user.availability === 1
                      ? 'bg-yellow-500'
                      : 'bg-gray-400'}"
                ></span>
                {user.availability === 0 ? "Online" : user.availability === 1 ? "Busy" : "Offline"}
              </span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-500">
              {new Date(user.createdAt).toLocaleDateString()}
            </td>
            <td class="px-6 py-4">
              {#if user.type === "super_admin"}
                <form method="POST" action="?/demote" use:enhance>
                  <input type="hidden" name="userId" value={user.id} />
                  <button type="submit" class="text-xs text-gray-500 hover:text-gray-700">
                    Remove Super Admin
                  </button>
                </form>
              {:else}
                <form method="POST" action="?/promote" use:enhance>
                  <input type="hidden" name="userId" value={user.id} />
                  <button type="submit" class="text-xs text-blue-600 hover:text-blue-700">
                    Make Super Admin
                  </button>
                </form>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
