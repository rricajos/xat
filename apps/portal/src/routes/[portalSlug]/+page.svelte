<script lang="ts">
  import type { PageData } from "./$types";
  let { data }: { data: PageData } = $props();
</script>

<div>
  <h2 class="mb-6 text-xl font-semibold text-[var(--portal-text)]">Categories</h2>

  {#if data.categories.length === 0}
    <p class="text-gray-500">No categories yet.</p>
  {:else}
    <div class="grid gap-4 sm:grid-cols-2">
      {#each data.categories as cat}
        <a
          href="/{data.portal.slug}/categories/{cat.slug}"
          class="rounded-lg border border-gray-200 bg-white p-5 hover:border-blue-300 hover:shadow-sm transition-all"
        >
          <h3 class="font-semibold text-[var(--portal-text)]">{cat.name}</h3>
          {#if cat.description}
            <p class="mt-1 text-sm text-[var(--portal-text-light)]">{cat.description}</p>
          {/if}
          <p class="mt-2 text-xs text-gray-400">{cat.articleCount} articles</p>
        </a>
      {/each}
    </div>
  {/if}
</div>
