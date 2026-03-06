<script lang="ts">
  import { enhance } from "$app/forms";
  import { goto } from "$app/navigation";
  import type { PageData } from "./$types";

  let { data, form }: { data: PageData; form: Record<string, unknown> | null } = $props();
  let showCreate = $state(false);
  let searchInput = $state(data.search);

  function handleSearch() {
    const params = new URLSearchParams();
    if (searchInput) params.set("search", searchInput);
    goto(`/app/settings/companies?${params.toString()}`);
  }
</script>

<div class="p-6">
  <div class="flex items-center justify-between mb-6">
    <div>
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Companies</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400">Manage organizations and companies associated with your contacts.</p>
    </div>
    <button onclick={() => showCreate = !showCreate} class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
      New Company
    </button>
  </div>

  {#if form?.error}
    <div class="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">{form.error}</div>
  {/if}

  {#if showCreate}
    <div class="mb-6 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-3">Create Company</h3>
      <form method="POST" action="?/create" use:enhance={() => { return async ({ update }) => { showCreate = false; await update(); }; }} class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="c-name" class="block text-xs font-medium text-gray-600 dark:text-gray-400">Name *</label>
            <input id="c-name" name="name" type="text" required placeholder="Acme Corp" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
          </div>
          <div>
            <label for="c-domain" class="block text-xs font-medium text-gray-600 dark:text-gray-400">Domain</label>
            <input id="c-domain" name="domain" type="text" placeholder="acme.com" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
          </div>
        </div>
        <div>
          <label for="c-desc" class="block text-xs font-medium text-gray-600 dark:text-gray-400">Description</label>
          <textarea id="c-desc" name="description" rows="2" placeholder="Brief description..." class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"></textarea>
        </div>
        <div class="flex gap-2">
          <button type="submit" class="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">Create</button>
          <button type="button" onclick={() => showCreate = false} class="rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300">Cancel</button>
        </div>
      </form>
    </div>
  {/if}

  <!-- Search -->
  <div class="mb-4">
    <form onsubmit={(e) => { e.preventDefault(); handleSearch(); }} class="flex gap-2">
      <input type="text" bind:value={searchInput} placeholder="Search companies..." class="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
      <button type="submit" class="rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300">Search</button>
    </form>
  </div>

  <!-- Table -->
  <div class="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
    <table class="w-full">
      <thead class="bg-gray-50 dark:bg-gray-800">
        <tr>
          <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Name</th>
          <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Domain</th>
          <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Created</th>
          <th class="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Actions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
        {#each data.companies as company}
          <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <div class="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  {company.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{company.name}</p>
                  {#if company.description}
                    <p class="text-xs text-gray-400 truncate max-w-xs">{company.description}</p>
                  {/if}
                </div>
              </div>
            </td>
            <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{company.domain ?? "-"}</td>
            <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{new Date(company.createdAt).toLocaleDateString()}</td>
            <td class="px-4 py-3 text-right">
              <form method="POST" action="?/delete" use:enhance class="inline">
                <input type="hidden" name="id" value={company.id} />
                <button type="submit" class="text-xs text-red-600 hover:text-red-800 dark:text-red-400">Delete</button>
              </form>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
    {#if data.companies.length === 0}
      <div class="py-12 text-center text-sm text-gray-400">No companies found</div>
    {/if}
  </div>

  {#if data.total > 25}
    <div class="mt-4 flex justify-center gap-2">
      {#if data.page > 1}
        <a href="/app/settings/companies?page={data.page - 1}" class="rounded bg-gray-100 px-3 py-1 text-sm dark:bg-gray-700 dark:text-gray-300">Previous</a>
      {/if}
      <span class="px-3 py-1 text-sm text-gray-500">Page {data.page}</span>
      {#if data.total > data.page * 25}
        <a href="/app/settings/companies?page={data.page + 1}" class="rounded bg-gray-100 px-3 py-1 text-sm dark:bg-gray-700 dark:text-gray-300">Next</a>
      {/if}
    </div>
  {/if}
</div>
