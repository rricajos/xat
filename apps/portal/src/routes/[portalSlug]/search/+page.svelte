<script lang="ts">
  import type { PageData } from "./$types";
  let { data }: { data: PageData } = $props();
</script>

<div>
  <h2 class="mb-4 text-xl font-semibold text-[var(--portal-text)]">
    {#if data.query}
      Search results for "{data.query}"
    {:else}
      Search
    {/if}
  </h2>

  {#if data.results.length === 0}
    <p class="text-gray-500">
      {#if data.query}
        No articles found matching your search.
      {:else}
        Enter a search term to find articles.
      {/if}
    </p>
  {:else}
    <div class="space-y-3">
      {#each data.results as article}
        <a
          href="/{data.portal.slug}/articles/{article.slug}"
          class="block rounded-lg border border-gray-200 bg-white p-4 hover:border-blue-300 hover:shadow-sm transition-all"
        >
          <h3 class="font-medium text-[var(--portal-text)]">{article.title}</h3>
          {#if article.description}
            <p class="mt-1 text-sm text-[var(--portal-text-light)] line-clamp-2">{article.description}</p>
          {/if}
        </a>
      {/each}
    </div>
  {/if}
</div>
