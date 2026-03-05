<script lang="ts">
  import { onMount } from "svelte";
  import Sidebar from "$lib/components/layout/Sidebar.svelte";
  import CommandBar from "$lib/components/layout/CommandBar.svelte";
  import KeyboardShortcutsHelp from "$lib/components/layout/KeyboardShortcutsHelp.svelte";
  import { initKeyboardShortcuts } from "$lib/stores/keyboard-shortcuts";
  import { initDarkMode } from "$lib/stores/dark-mode";
  import type { LayoutData } from "./$types";
  import type { Snippet } from "svelte";

  let { data, children }: { data: LayoutData; children: Snippet } = $props();

  let commandBarOpen = $state(false);
  let shortcutsHelpOpen = $state(false);

  onMount(() => {
    initDarkMode();

    const cleanup = initKeyboardShortcuts(() => {
      commandBarOpen = !commandBarOpen;
    });

    return cleanup;
  });
</script>

<!-- Hidden button for keyboard shortcut to trigger help -->
<button
  data-shortcut="show-help"
  class="hidden"
  onclick={() => (shortcutsHelpOpen = true)}
></button>

<div class="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
  <Sidebar user={data.user} account={data.account} labels={data.labels} inboxes={data.inboxes} onOpenCommandBar={() => (commandBarOpen = true)} />
  <main class="flex flex-1 flex-col overflow-hidden">
    {@render children()}
  </main>
</div>

<CommandBar open={commandBarOpen} onClose={() => (commandBarOpen = false)} />
<KeyboardShortcutsHelp open={shortcutsHelpOpen} onClose={() => (shortcutsHelpOpen = false)} />
