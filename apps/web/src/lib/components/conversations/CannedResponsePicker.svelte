<script lang="ts">
  interface CannedResponse {
    id: number;
    shortCode: string;
    content: string;
  }

  interface Props {
    responses: CannedResponse[];
    query: string;
    onSelect: (content: string) => void;
  }

  let { responses, query, onSelect }: Props = $props();

  const filtered = $derived(
    query.length > 0
      ? responses.filter((r) =>
          r.shortCode.toLowerCase().includes(query.toLowerCase()),
        ).slice(0, 8)
      : responses.slice(0, 8),
  );

  let selectedIndex = $state(0);

  $effect(() => {
    // Reset selection when query changes
    const _q = query;
    selectedIndex = 0;
  });

  export function handleKeydown(e: KeyboardEvent): boolean {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, filtered.length - 1);
      return true;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
      return true;
    }
    if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      const selected = filtered[selectedIndex];
      if (selected) {
        onSelect(selected.content);
      }
      return true;
    }
    if (e.key === "Escape") {
      onSelect("");
      return true;
    }
    return false;
  }
</script>

{#if filtered.length > 0}
  <div class="absolute bottom-full left-0 right-0 z-20 mb-1 max-h-60 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
    {#each filtered as response, i}
      <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
      <div
        class="flex cursor-pointer items-start gap-3 px-3 py-2 {i === selectedIndex
          ? 'bg-blue-50 dark:bg-blue-900/20'
          : 'hover:bg-gray-50 dark:hover:bg-gray-700'}"
        onclick={() => onSelect(response.content)}
      >
        <span class="flex-shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono text-gray-600 dark:bg-gray-700 dark:text-gray-300">
          /{response.shortCode}
        </span>
        <span class="text-sm text-gray-600 truncate dark:text-gray-400">
          {response.content}
        </span>
      </div>
    {/each}
  </div>
{/if}
