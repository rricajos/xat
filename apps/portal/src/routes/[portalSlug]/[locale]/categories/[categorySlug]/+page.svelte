<script lang="ts">
  import type { PageData } from "./$types";

  let { data } = $props<{ data: PageData }>();
</script>

<div>
  <h2 class="text-xl font-semibold">{data.category.name}</h2>
  {#if data.category.description}
    <p class="mt-1 text-muted-foreground">{data.category.description}</p>
  {/if}

  <div class="mt-6 space-y-2">
    {#each data.articles as article}
      <a
        href="/{data.portal.slug}/{data.locale}/articles/{article.slug}"
        class="block rounded-lg border p-4 hover:bg-muted/50 transition-colors"
      >
        <h3 class="font-medium">{article.title}</h3>
        {#if article.description}
          <p class="mt-1 text-sm text-muted-foreground line-clamp-2">
            {article.description}
          </p>
        {/if}
      </a>
    {:else}
      <p class="text-muted-foreground">No articles in this category.</p>
    {/each}
  </div>
</div>
