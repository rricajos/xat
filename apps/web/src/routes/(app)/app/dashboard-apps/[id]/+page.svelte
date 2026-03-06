<script lang="ts">
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  function getAppUrl(): string | null {
    const content = data.app.content as Array<{ type: string; url: string }>;
    if (Array.isArray(content) && content.length > 0) {
      return content[0].url;
    }
    return null;
  }
</script>

<div class="flex h-full flex-col">
  <div class="flex items-center justify-between border-b border-gray-200 px-4 py-2 dark:border-gray-700">
    <div class="flex items-center gap-3">
      <a
        href="/app/settings/dashboard-apps"
        class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        &larr; Back
      </a>
      <h2 class="text-sm font-semibold text-gray-900 dark:text-white">{data.app.title}</h2>
    </div>
    {#if getAppUrl()}
      <a
        href={getAppUrl()}
        target="_blank"
        rel="noopener noreferrer"
        class="text-xs text-blue-600 hover:underline dark:text-blue-400"
      >
        Open in new tab
      </a>
    {/if}
  </div>
  <div class="flex-1">
    {#if getAppUrl()}
      <iframe
        src={getAppUrl()}
        title={data.app.title}
        class="h-full w-full border-0"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      ></iframe>
    {:else}
      <div class="flex h-full items-center justify-center text-sm text-gray-500 dark:text-gray-400">
        No URL configured for this app.
      </div>
    {/if}
  </div>
</div>
