<script lang="ts">
  import type { PageData } from "./$types";

  let { data } = $props<{ data: PageData }>();
</script>

<div>
  <h2 class="text-xl font-semibold mb-4">
    {data.portal.pageTitle ?? data.portal.name}
  </h2>

  {#if data.categories.length > 0}
    <div class="grid gap-4 sm:grid-cols-2">
      {#each data.categories as cat}
        <a
          href="/{data.portal.slug}/{data.locale}/categories/{cat.slug}"
          class="rounded-lg border p-4 hover:bg-muted/50 transition-colors"
        >
          <h3 class="font-semibold">{cat.name}</h3>
          {#if cat.description}
            <p class="mt-1 text-sm text-muted-foreground">{cat.description}</p>
          {/if}
        </a>
      {/each}
    </div>
  {:else}
    <p class="text-muted-foreground">No content available for this language yet.</p>
  {/if}
</div>
