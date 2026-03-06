<script lang="ts">
  import { enhance } from "$app/forms";
  import type { PageData } from "./$types";

  let { data, form }: { data: PageData; form: Record<string, unknown> | null } = $props();
</script>

<div class="flex h-full flex-col bg-white dark:bg-gray-900">
  <div class="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
    <div class="flex items-center gap-3">
      <a href="/app/contacts" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </a>
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">New Contact</h2>
    </div>
  </div>

  <div class="flex-1 overflow-auto p-6">
    {#if form?.error}
      <div class="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
        {form.error}
      </div>
    {/if}

    <form method="POST" use:enhance class="max-w-lg space-y-4">
      <div>
        <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
        <input id="name" name="name" type="text" placeholder="John Doe"
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
      </div>

      <div>
        <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
        <input id="email" name="email" type="email" placeholder="john@example.com"
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
      </div>

      <div>
        <label for="phoneNumber" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
        <input id="phoneNumber" name="phoneNumber" type="tel" placeholder="+1234567890"
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
      </div>

      <div>
        <label for="companyId" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Company</label>
        <select id="companyId" name="companyId"
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white">
          <option value="">No company</option>
          {#each data.companies as company}
            <option value={company.id}>{company.name}</option>
          {/each}
        </select>
      </div>

      <div class="flex gap-3 pt-4">
        <button type="submit" class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Create Contact
        </button>
        <a href="/app/contacts" class="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300">
          Cancel
        </a>
      </div>
    </form>
  </div>
</div>
