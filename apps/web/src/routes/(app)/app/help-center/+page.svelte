<script lang="ts">
  import { enhance } from "$app/forms";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  let showForm = $state(false);
</script>

<div class="h-full overflow-y-auto bg-white dark:bg-gray-950">
  <div class="max-w-6xl p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-lg font-semibold text-gray-900">Help Center</h2>
        <p class="text-sm text-gray-500">Manage your knowledge base portals</p>
      </div>
      <button
        onclick={() => showForm = !showForm}
        class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        {showForm ? "Cancel" : "New Portal"}
      </button>
    </div>

    {#if showForm}
      <form method="POST" action="?/create" use:enhance class="mb-6 rounded-lg border border-gray-200 p-4 space-y-4">
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700">Portal Name</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Help Center"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label for="slug" class="block text-sm font-medium text-gray-700">Slug</label>
          <input
            id="slug"
            name="slug"
            type="text"
            required
            placeholder="help-center"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <p class="mt-1 text-xs text-gray-400">URL: /hc/your-slug</p>
        </div>
        <button type="submit" class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Create Portal
        </button>
      </form>
    {/if}

    <div class="space-y-3">
      {#each data.portals as portal}
        <a
          href="/app/help-center/{portal.id}"
          class="block rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-medium text-gray-900">{portal.name}</h3>
              <p class="text-xs text-gray-500 mt-1">/hc/{portal.slug}</p>
            </div>
            <span class="rounded-full px-2 py-0.5 text-xs {portal.archived
              ? 'bg-gray-100 text-gray-500'
              : 'bg-green-100 text-green-700'}">
              {portal.archived ? "Archived" : "Active"}
            </span>
          </div>
        </a>
      {/each}

      {#if data.portals.length === 0}
        <div class="text-center py-12">
          <svg class="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <p class="mt-2 text-sm text-gray-400">Create your first portal to build a knowledge base</p>
        </div>
      {/if}
    </div>
  </div>
</div>
