<script lang="ts">
  import { page } from "$app/stores";
  import { enhance } from "$app/forms";
  import ResizablePanel from "$lib/components/layout/ResizablePanel.svelte";
  import * as m from "$lib/paraglide/messages";
  import type { LayoutData } from "./$types";
  import type { Snippet } from "svelte";

  let { data, children }: { data: LayoutData; children: Snippet } = $props();

  let showCreateBoard = $state(false);
  let boardName = $state("");

  function activeBoardId(): number | null {
    const param = $page.url.searchParams.get("board");
    if (param) return parseInt(param);
    return data.boards[0]?.id ?? null;
  }

  function isBoardActive(boardId: number): boolean {
    return activeBoardId() === boardId;
  }
</script>

<div class="flex h-full">
  <ResizablePanel defaultWidth={240} minWidth={180} maxWidth={380} storageKey="panel:secondary">
    <aside class="flex h-full w-full flex-col overflow-y-auto border-r border-gray-200 bg-white py-4 dark:border-gray-700 dark:bg-gray-900">
      <div class="mb-4 flex items-center justify-between px-4">
        <h2 class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {m.tickets_title()}
        </h2>
        <button
          onclick={() => (showCreateBoard = !showCreateBoard)}
          class="flex h-5 w-5 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          title={m.kanban_new_board()}
        >
          <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {#if showCreateBoard}
        <div class="mb-3 px-3">
          <form
            method="POST"
            action="/app/tickets?/createBoard"
            use:enhance={() => {
              return async ({ update }) => {
                await update();
                showCreateBoard = false;
                boardName = "";
              };
            }}
            class="space-y-1.5"
          >
            <input
              name="name"
              type="text"
              required
              bind:value={boardName}
              placeholder="Board name..."
              class="w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
            <div class="flex gap-1">
              <button type="submit" class="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700">
                {m.btn_create()}
              </button>
              <button type="button" onclick={() => (showCreateBoard = false)} class="rounded-md bg-gray-100 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400">
                {m.btn_cancel()}
              </button>
            </div>
          </form>
        </div>
      {/if}

      {#if data.boards.length > 0}
        <nav class="space-y-0.5">
          {#each data.boards as board}
            <a
              href="/app/tickets?board={board.id}"
              class="flex items-center gap-2.5 px-4 py-2 text-sm {isBoardActive(board.id)
                ? 'bg-blue-50 text-blue-700 font-medium dark:bg-blue-900/20 dark:text-blue-400'
                : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'}"
            >
              <svg class="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              <span class="truncate">{board.name}</span>
            </a>
          {/each}
        </nav>
      {:else}
        <p class="px-4 text-sm text-gray-400 dark:text-gray-500">{m.kanban_no_boards()}</p>
      {/if}
    </aside>
  </ResizablePanel>

  <div class="flex flex-1 flex-col overflow-hidden">
    {@render children()}
  </div>
</div>
