<script lang="ts">
  import type { LayoutData } from "./$types";
  import type { Snippet } from "svelte";
  import "../app.css";

  let { data, children }: { data: LayoutData; children: Snippet } = $props();
  const portal = data.portal;
</script>

<svelte:head>
  <title>{portal.pageTitle || portal.name} — Help Center</title>
  {#if portal.color}
    <style>
      :root { --portal-primary: {portal.color}; }
    </style>
  {/if}
</svelte:head>

<div class="min-h-screen bg-[var(--portal-bg)]">
  <header class="border-b border-gray-200 bg-white">
    <div class="mx-auto max-w-5xl px-6 py-6">
      <a href="/{portal.slug}" class="text-2xl font-bold text-[var(--portal-text)]">
        {portal.name}
      </a>
      {#if portal.headerText}
        <p class="mt-1 text-[var(--portal-text-light)]">{portal.headerText}</p>
      {/if}

      <form action="/{portal.slug}/search" method="GET" class="mt-4">
        <input
          name="q"
          type="text"
          placeholder="Search articles..."
          class="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-[var(--portal-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--portal-primary)]"
        />
      </form>
    </div>
  </header>

  <div class="mx-auto max-w-5xl px-6 py-8">
    <div class="flex gap-8">
      <aside class="hidden w-56 shrink-0 lg:block">
        <nav class="space-y-1">
          <a
            href="/{portal.slug}"
            class="block rounded-md px-3 py-2 text-sm font-medium text-[var(--portal-text)] hover:bg-gray-100"
          >
            All Categories
          </a>
          {#each data.categories as category}
            <a
              href="/{portal.slug}/categories/{category.slug}"
              class="block rounded-md px-3 py-2 text-sm text-[var(--portal-text-light)] hover:bg-gray-100 hover:text-[var(--portal-text)]"
            >
              {category.name}
            </a>
          {/each}
        </nav>
      </aside>

      <main class="min-w-0 flex-1">
        {@render children()}
      </main>
    </div>
  </div>

  <footer class="border-t border-gray-200 bg-white py-6 text-center text-sm text-gray-400">
    Powered by Xat
  </footer>
</div>
