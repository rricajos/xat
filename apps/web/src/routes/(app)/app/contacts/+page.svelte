<script lang="ts">
  import { goto } from "$app/navigation";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  let searchInput = $state(data.search);
  let importMessage = $state<string | null>(null);

  function handleSearch() {
    const params = new URLSearchParams();
    if (searchInput) params.set("search", searchInput);
    goto(`/app/contacts?${params.toString()}`);
  }

  function formatDate(date: Date | null): string {
    if (!date) return "-";
    return new Date(date).toLocaleDateString();
  }

  async function handleImport(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/v1/contacts/import", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    if (result.data) {
      importMessage = `Imported ${result.data.imported}, skipped ${result.data.skipped}`;
      setTimeout(() => {
        importMessage = null;
        goto("/app/contacts", { invalidateAll: true });
      }, 2000);
    }
    input.value = "";
  }

  const totalPages = $derived(Math.ceil(data.total / 25));
</script>

<div class="flex h-full flex-col bg-white dark:bg-gray-900">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Contacts</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">{data.total} contacts</p>
      </div>
      <div class="flex gap-2">
        <a
          href="/api/v1/contacts/export"
          class="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Export CSV
        </a>
        <button
          onclick={() => document.getElementById("import-csv")?.click()}
          class="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Import CSV
        </button>
        <input
          id="import-csv"
          type="file"
          accept=".csv"
          class="hidden"
          onchange={handleImport}
        />
        <a
          href="/app/contacts/new"
          class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          New Contact
        </a>
      </div>
    </div>

    {#if importMessage}
      <div class="border-b border-green-200 bg-green-50 px-6 py-2 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
        {importMessage}
      </div>
    {/if}

    <!-- Search -->
    <div class="border-b border-gray-200 dark:border-gray-700 px-6 py-3">
      <form onsubmit={(e) => { e.preventDefault(); handleSearch(); }} class="flex gap-2">
        <input
          type="text"
          bind:value={searchInput}
          placeholder="Search contacts by name, email, or phone..."
          class="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
        <button
          type="submit"
          class="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
        >
          Search
        </button>
      </form>
    </div>

    <!-- Table -->
    <div class="flex-1 overflow-auto">
      <table class="w-full">
        <thead class="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Name</th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Email</th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Phone</th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Company</th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Last Activity</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
          {#each data.contacts as contact}
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td class="px-6 py-3">
                <a href="/app/contacts/{contact.id}" class="flex items-center gap-3">
                  <div class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    {(contact.name ?? contact.email ?? "?").slice(0, 2).toUpperCase()}
                  </div>
                  <span class="text-sm font-medium text-gray-900 dark:text-white">
                    {contact.name ?? "-"}
                  </span>
                </a>
              </td>
              <td class="px-6 py-3 text-sm text-gray-500 dark:text-gray-400">{contact.email ?? "-"}</td>
              <td class="px-6 py-3 text-sm text-gray-500 dark:text-gray-400">{contact.phoneNumber ?? "-"}</td>
              <td class="px-6 py-3 text-sm text-gray-500 dark:text-gray-400">{contact.companyId ?? "-"}</td>
              <td class="px-6 py-3 text-sm text-gray-500 dark:text-gray-400">{formatDate(contact.lastActivityAt)}</td>
            </tr>
          {/each}
        </tbody>
      </table>

      {#if data.contacts.length === 0}
        <div class="flex h-64 items-center justify-center text-sm text-gray-400">
          No contacts found
        </div>
      {/if}
    </div>

    <!-- Pagination -->
    {#if totalPages > 1}
      <div class="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 px-6 py-3">
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Page {data.currentPage} of {totalPages}
        </p>
        <div class="flex gap-2">
          {#if data.currentPage > 1}
            <a
              href="/app/contacts?page={data.currentPage - 1}{data.search ? `&search=${data.search}` : ''}"
              class="rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
            >
              Previous
            </a>
          {/if}
          {#if data.currentPage < totalPages}
            <a
              href="/app/contacts?page={data.currentPage + 1}{data.search ? `&search=${data.search}` : ''}"
              class="rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
            >
              Next
            </a>
          {/if}
        </div>
      </div>
    {/if}
</div>
