<script lang="ts">
  import type { PageData } from "./$types";
  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Help Center — Xat</title>
</svelte:head>

<div class="min-h-screen bg-[var(--portal-bg)]">
  <header class="bg-white border-b border-gray-200">
    <div class="mx-auto max-w-4xl px-6 py-8">
      <h1 class="text-3xl font-bold text-[var(--portal-text)]">Help Center</h1>
      <p class="mt-2 text-[var(--portal-text-light)]">Browse our knowledge base portals</p>
    </div>
  </header>

  <main class="mx-auto max-w-4xl px-6 py-8">
    {#if data.portals.length === 0}
      <p class="text-gray-500">No portals available yet.</p>
    {:else}
      <div class="grid gap-4 sm:grid-cols-2">
        {#each data.portals as portal}
          <a
            href="/{portal.slug}"
            class="rounded-lg border border-gray-200 bg-white p-6 hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <h2 class="text-lg font-semibold text-[var(--portal-text)]">{portal.name}</h2>
            {#if portal.headerText}
              <p class="mt-1 text-sm text-[var(--portal-text-light)]">{portal.headerText}</p>
            {/if}
          </a>
        {/each}
      </div>
    {/if}
  </main>
</div>
