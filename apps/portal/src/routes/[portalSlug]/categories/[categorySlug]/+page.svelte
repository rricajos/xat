<script lang="ts">
  import type { PageData } from "./$types";
  let { data }: { data: PageData } = $props();
</script>

<div>
  <h2 class="mb-2 text-xl font-semibold text-[var(--portal-text)]">{data.category.name}</h2>
  {#if data.category.description}
    <p class="mb-6 text-[var(--portal-text-light)]">{data.category.description}</p>
  {/if}

  {#if data.articles.length === 0}
    <p class="text-gray-500">No articles in this category yet.</p>
  {:else}
    <div class="space-y-3">
      {#each data.articles as article}
        <a
          href="/{data.portal.slug}/articles/{article.slug}"
          class="block rounded-lg border border-gray-200 bg-white p-4 hover:border-blue-300 hover:shadow-sm transition-all"
        >
          <h3 class="font-medium text-[var(--portal-text)]">{article.title}</h3>
          {#if article.description}
            <p class="mt-1 text-sm text-[var(--portal-text-light)] line-clamp-2">{article.description}</p>
          {/if}
          <p class="mt-2 text-xs text-gray-400">
            Updated {new Date(article.updatedAt).toLocaleDateString()}
          </p>
        </a>
      {/each}
    </div>
  {/if}
</div>
