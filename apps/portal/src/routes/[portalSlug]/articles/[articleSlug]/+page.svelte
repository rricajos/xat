<script lang="ts">
  import type { PageData } from "./$types";
  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>{data.article.title} — {data.portal.name}</title>
  {#if data.article.description}
    <meta name="description" content={data.article.description} />
  {/if}
</svelte:head>

<article>
  {#if data.category}
    <nav class="mb-4 text-sm text-[var(--portal-text-light)]">
      <a href="/{data.portal.slug}" class="hover:text-[var(--portal-primary)]">Home</a>
      <span class="mx-1">/</span>
      <a href="/{data.portal.slug}/categories/{data.category.slug}" class="hover:text-[var(--portal-primary)]">
        {data.category.name}
      </a>
    </nav>
  {/if}

  <h1 class="text-2xl font-bold text-[var(--portal-text)]">{data.article.title}</h1>

  <div class="mt-2 flex items-center gap-3 text-sm text-gray-400">
    <span>Updated {new Date(data.article.updatedAt).toLocaleDateString()}</span>
    <span>{data.article.views} views</span>
  </div>

  <div class="prose prose-gray mt-6 max-w-none">
    {@html data.article.content ?? ""}
  </div>
</article>
