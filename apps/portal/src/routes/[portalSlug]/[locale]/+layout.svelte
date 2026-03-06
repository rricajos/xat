<script lang="ts">
  import type { LayoutData } from "./$types";

  let { data, children } = $props<{ data: LayoutData; children: any }>();
</script>

<div class="min-h-screen bg-background">
  <header
    class="border-b px-6 py-4"
    style:background-color={data.portal.color ?? "#1f93ff"}
  >
    <div class="mx-auto max-w-4xl">
      <h1 class="text-2xl font-bold text-white">{data.portal.name}</h1>
      {#if data.portal.headerText}
        <p class="mt-1 text-white/80">{data.portal.headerText}</p>
      {/if}
      {#if data.availableLocales.length > 1}
        <nav class="mt-2 flex gap-2">
          {#each data.availableLocales as loc}
            <a
              href="/{data.portal.slug}/{loc}"
              class="rounded px-2 py-1 text-sm text-white/90 hover:bg-white/20"
              class:bg-white/20={loc === data.locale}
              class:font-bold={loc === data.locale}
            >
              {loc.toUpperCase()}
            </a>
          {/each}
        </nav>
      {/if}
    </div>
  </header>

  <div class="mx-auto max-w-4xl px-6 py-8">
    <div class="flex gap-8">
      <aside class="w-56 shrink-0">
        <nav class="space-y-1">
          {#each data.categories as cat}
            <a
              href="/{data.portal.slug}/{data.locale}/categories/{cat.slug}"
              class="block rounded px-3 py-2 text-sm hover:bg-muted"
            >
              {cat.name}
            </a>
          {/each}
        </nav>
      </aside>

      <main class="flex-1">
        {@render children()}
      </main>
    </div>
  </div>
</div>
