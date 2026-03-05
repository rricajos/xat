<script lang="ts">
  import { getShortcutsList } from "$lib/stores/keyboard-shortcuts";

  interface Props {
    open: boolean;
    onClose: () => void;
  }

  let { open, onClose }: Props = $props();

  const shortcuts = getShortcutsList();

  const grouped = $derived(() => {
    const map = new Map<string, typeof shortcuts>();
    for (const s of shortcuts) {
      const list = map.get(s.category) ?? [];
      list.push(s);
      map.set(s.category, list);
    }
    return Array.from(map.entries());
  });

  const globalShortcuts = [
    { keys: ["Ctrl", "K"], description: "Open command bar" },
    { keys: ["?"], description: "Show keyboard shortcuts" },
  ];
</script>

{#if open}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    onclick={onClose}
  >
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-gray-800"
      onclick={(e) => e.stopPropagation()}
    >
      <div class="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Keyboard Shortcuts</h2>
        <button
          onclick={onClose}
          class="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="max-h-96 overflow-y-auto px-6 py-4">
        <div class="mb-4">
          <h3 class="mb-2 text-xs font-semibold uppercase text-gray-400">Global</h3>
          {#each globalShortcuts as shortcut}
            <div class="flex items-center justify-between py-1.5">
              <span class="text-sm text-gray-700 dark:text-gray-300">{shortcut.description}</span>
              <div class="flex gap-1">
                {#each shortcut.keys as key}
                  <kbd class="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    {key}
                  </kbd>
                {/each}
              </div>
            </div>
          {/each}
        </div>

        {#each grouped() as [category, items]}
          <div class="mb-4">
            <h3 class="mb-2 text-xs font-semibold uppercase text-gray-400">{category}</h3>
            {#each items as shortcut}
              <div class="flex items-center justify-between py-1.5">
                <span class="text-sm text-gray-700 dark:text-gray-300">{shortcut.description}</span>
                <div class="flex gap-1">
                  {#if shortcut.alt}
                    <kbd class="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">Alt</kbd>
                  {/if}
                  {#if shortcut.ctrl}
                    <kbd class="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">Ctrl</kbd>
                  {/if}
                  {#if shortcut.shift}
                    <kbd class="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">Shift</kbd>
                  {/if}
                  <kbd class="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    {shortcut.key.toUpperCase()}
                  </kbd>
                </div>
              </div>
            {/each}
          </div>
        {/each}
      </div>
    </div>
  </div>
{/if}
