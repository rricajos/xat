<script lang="ts">
  import { goto } from "$app/navigation";
  import { toggleDarkMode } from "$lib/stores/dark-mode";

  interface Props {
    open: boolean;
    onClose: () => void;
  }

  let { open, onClose }: Props = $props();
  let query = $state("");
  let selectedIndex = $state(0);
  let searchResults = $state<{ contacts: SearchContact[]; conversations: SearchConversation[] }>({
    contacts: [],
    conversations: [],
  });
  let searchTimeout: ReturnType<typeof setTimeout> | null = null;

  interface SearchContact {
    id: number;
    name: string | null;
    email: string | null;
    phoneNumber: string | null;
  }

  interface SearchConversation {
    id: number;
    displayId: number;
    status: number;
  }

  interface CommandItem {
    id: string;
    label: string;
    category: string;
    action: () => void;
  }

  const staticCommands: CommandItem[] = [
    { id: "nav-conversations", label: "Go to Conversations", category: "Navigation", action: () => goto("/app/conversations") },
    { id: "nav-contacts", label: "Go to Contacts", category: "Navigation", action: () => goto("/app/contacts") },
    { id: "nav-reports", label: "Go to Reports", category: "Navigation", action: () => goto("/app/reports") },
    { id: "nav-campaigns", label: "Go to Campaigns", category: "Navigation", action: () => goto("/app/campaigns") },
    { id: "nav-help-center", label: "Go to Help Center", category: "Navigation", action: () => goto("/app/help-center") },
    { id: "nav-settings", label: "Go to Settings", category: "Navigation", action: () => goto("/app/settings") },
    { id: "nav-captain", label: "Open Captain AI", category: "Navigation", action: () => goto("/app/captain") },
    { id: "settings-agents", label: "Manage Agents", category: "Settings", action: () => goto("/app/settings/agents") },
    { id: "settings-teams", label: "Manage Teams", category: "Settings", action: () => goto("/app/settings/teams") },
    { id: "settings-labels", label: "Manage Labels", category: "Settings", action: () => goto("/app/settings/labels") },
    { id: "settings-inboxes", label: "Manage Inboxes", category: "Settings", action: () => goto("/app/settings/inboxes") },
    { id: "settings-canned", label: "Canned Responses", category: "Settings", action: () => goto("/app/settings/canned-responses") },
    { id: "settings-automation", label: "Automation Rules", category: "Settings", action: () => goto("/app/settings/automation") },
    { id: "settings-audit", label: "Audit Log", category: "Settings", action: () => goto("/app/settings/audit-log") },
    { id: "reports-agents", label: "Agent Reports", category: "Reports", action: () => goto("/app/reports/agents") },
    { id: "reports-inboxes", label: "Inbox Reports", category: "Reports", action: () => goto("/app/reports/inboxes") },
    { id: "reports-teams", label: "Team Reports", category: "Reports", action: () => goto("/app/reports/teams") },
    { id: "reports-labels", label: "Label Reports", category: "Reports", action: () => goto("/app/reports/labels") },
    { id: "reports-csat", label: "CSAT Reports", category: "Reports", action: () => goto("/app/reports/csat") },
    { id: "toggle-dark", label: "Toggle Dark Mode", category: "Appearance", action: () => toggleDarkMode() },
    { id: "nav-profile", label: "Profile Settings", category: "Navigation", action: () => goto("/app/profile") },
  ];

  const allItems = $derived<CommandItem[]>(() => {
    const items: CommandItem[] = [];

    // Search result items first
    for (const c of searchResults.conversations) {
      items.push({
        id: `conv-${c.id}`,
        label: `Conversation #${c.displayId}`,
        category: "Conversations",
        action: () => goto(`/app/conversations/${c.displayId}`),
      });
    }
    for (const c of searchResults.contacts) {
      items.push({
        id: `contact-${c.id}`,
        label: c.name || c.email || c.phoneNumber || `Contact #${c.id}`,
        category: "Contacts",
        action: () => goto(`/app/contacts/${c.id}`),
      });
    }

    // Static commands filtered
    const q = query.trim().toLowerCase();
    if (q === "") {
      items.push(...staticCommands);
    } else {
      items.push(
        ...staticCommands.filter((cmd) =>
          cmd.label.toLowerCase().includes(q),
        ),
      );
    }

    return items;
  });

  const filtered = $derived(allItems());

  $effect(() => {
    if (open) {
      query = "";
      selectedIndex = 0;
      searchResults = { contacts: [], conversations: [] };
    }
  });

  $effect(() => {
    if (selectedIndex >= filtered.length) {
      selectedIndex = Math.max(0, filtered.length - 1);
    }
  });

  // Debounced search
  $effect(() => {
    const q = query.trim();
    if (searchTimeout) clearTimeout(searchTimeout);
    if (q.length < 2) {
      searchResults = { contacts: [], conversations: [] };
      return;
    }
    searchTimeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const json = await res.json();
          searchResults = json.data;
        }
      } catch {
        // Silently fail search
      }
    }, 200);
  });

  function executeCommand(cmd: CommandItem) {
    onClose();
    cmd.action();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, filtered.length - 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
    } else if (e.key === "Enter") {
      const cmd = filtered[selectedIndex];
      if (!cmd) return;
      e.preventDefault();
      executeCommand(cmd);
    }
  }
</script>

{#if open}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[15vh]"
    onkeydown={handleKeydown}
    onclick={onClose}
  >
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-gray-800"
      onclick={(e) => e.stopPropagation()}
    >
      <div class="border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-3 px-4">
          <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            bind:value={query}
            placeholder="Search conversations, contacts, or type a command..."
            class="w-full border-0 bg-transparent py-4 text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-white"
            autofocus
          />
          <kbd class="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-400 dark:bg-gray-700">
            ESC
          </kbd>
        </div>
      </div>

      <div class="max-h-80 overflow-y-auto py-2">
        {#if filtered.length === 0}
          <p class="px-4 py-8 text-center text-sm text-gray-500">No results found</p>
        {:else}
          {#each filtered as cmd, i}
            <button
              class="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors {i === selectedIndex
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50'}"
              onmouseenter={() => (selectedIndex = i)}
              onclick={() => executeCommand(cmd)}
            >
              {#if cmd.category === "Conversations"}
                <svg class="h-4 w-4 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              {:else if cmd.category === "Contacts"}
                <svg class="h-4 w-4 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              {:else}
                <svg class="h-4 w-4 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              {/if}
              <span class="flex-1 truncate">{cmd.label}</span>
              <span class="text-xs text-gray-400">{cmd.category}</span>
            </button>
          {/each}
        {/if}
      </div>

      <div class="border-t border-gray-200 px-4 py-2 dark:border-gray-700">
        <div class="flex items-center gap-4 text-xs text-gray-400">
          <span><kbd class="rounded bg-gray-100 px-1 dark:bg-gray-700">&uarr;&darr;</kbd> Navigate</span>
          <span><kbd class="rounded bg-gray-100 px-1 dark:bg-gray-700">Enter</kbd> Select</span>
          <span><kbd class="rounded bg-gray-100 px-1 dark:bg-gray-700">Esc</kbd> Close</span>
        </div>
      </div>
    </div>
  </div>
{/if}
