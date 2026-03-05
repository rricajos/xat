<script lang="ts">
  import { enhance } from "$app/forms";
  import { goto, invalidateAll } from "$app/navigation";
  import * as m from "$lib/paraglide/messages";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let showCreateBoard = $state(false);
  let showCreateTicket = $state<number | null>(null);
  let newTicketTitle = $state("");
  let dragTicketId = $state<number | null>(null);
  let dragOverStage = $state<number | null>(null);

  function priorityLabel(p: number | null): string {
    switch (p) {
      case 3: return m.priority_urgent();
      case 2: return m.priority_high();
      case 1: return m.priority_medium();
      default: return "";
    }
  }

  function priorityColor(p: number | null): string {
    switch (p) {
      case 3: return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case 2: return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
      case 1: return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      default: return "";
    }
  }

  function handleDragStart(ticketId: number) {
    dragTicketId = ticketId;
  }

  function handleDragOver(e: DragEvent, stageId: number) {
    e.preventDefault();
    dragOverStage = stageId;
  }

  function handleDragLeave() {
    dragOverStage = null;
  }

  async function handleDrop(stageId: number) {
    if (dragTicketId === null) return;
    dragOverStage = null;

    const formData = new FormData();
    formData.set("ticketId", String(dragTicketId));
    formData.set("newStageId", String(stageId));
    formData.set("newPosition", "0");

    dragTicketId = null;

    await fetch("?/moveTicket", {
      method: "POST",
      body: formData,
    });

    await invalidateAll();
  }
</script>

<div class="flex h-full flex-col overflow-hidden">
  <!-- Header -->
  <div class="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3 dark:border-gray-700 dark:bg-gray-900">
    <div class="flex items-center gap-3">
      <h1 class="text-lg font-semibold text-gray-900 dark:text-white">{m.tickets_title()}</h1>

      <!-- Board tabs -->
      {#if data.boards.length > 0}
        <div class="flex items-center gap-1 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-800">
          {#each data.boards as board}
            <a
              href="/app/tickets?board={board.id}"
              class="rounded-md px-3 py-1 text-xs font-medium transition-colors {data.activeBoard?.id === board.id ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}"
            >
              {board.name}
            </a>
          {/each}
        </div>
      {/if}
    </div>

    <div class="flex items-center gap-2">
      {#if data.activeBoard}
        <a
          href="/app/settings/kanban?board={data.activeBoard.id}"
          class="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          {m.kanban_settings()}
        </a>
      {/if}
      <button
        onclick={() => (showCreateBoard = !showCreateBoard)}
        class="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
      >
        {m.kanban_new_board()}
      </button>
    </div>
  </div>

  <!-- Create board form -->
  {#if showCreateBoard}
    <div class="border-b border-gray-200 bg-gray-50 px-6 py-3 dark:border-gray-700 dark:bg-gray-800">
      <form
        method="POST"
        action="?/createBoard"
        use:enhance={() => {
          return async ({ update }) => {
            await update();
            showCreateBoard = false;
          };
        }}
        class="flex items-center gap-3"
      >
        <input
          name="name"
          type="text"
          required
          placeholder="Board name..."
          class="flex-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
        <button type="submit" class="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
          {m.btn_create()}
        </button>
        <button type="button" onclick={() => (showCreateBoard = false)} class="text-xs text-gray-500 hover:text-gray-700">
          {m.btn_cancel()}
        </button>
      </form>
    </div>
  {/if}

  <!-- Kanban board -->
  {#if data.activeBoard && data.stages.length > 0}
    <div class="flex flex-1 gap-4 overflow-x-auto p-4">
      {#each data.stages as stage}
        {@const stageTickets = data.ticketsByStage[stage.id] ?? []}
        <div
          class="flex w-72 flex-shrink-0 flex-col rounded-lg bg-gray-100 dark:bg-gray-800 {dragOverStage === stage.id ? 'ring-2 ring-blue-400' : ''}"
          ondragover={(e) => handleDragOver(e, stage.id)}
          ondragleave={handleDragLeave}
          ondrop={() => handleDrop(stage.id)}
          role="region"
          aria-label={stage.name}
        >
          <!-- Stage header -->
          <div class="flex items-center justify-between px-3 py-2.5">
            <div class="flex items-center gap-2">
              <span class="h-2.5 w-2.5 rounded-full" style="background-color: {stage.color}"></span>
              <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">{stage.name}</h3>
              <span class="rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                {stageTickets.length}
              </span>
            </div>
            <button
              onclick={() => (showCreateTicket = showCreateTicket === stage.id ? null : stage.id)}
              class="rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700"
              title={m.tickets_new()}
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          <!-- Quick add ticket form -->
          {#if showCreateTicket === stage.id}
            <div class="px-2 pb-2">
              <form
                method="POST"
                action="?/createTicket"
                use:enhance={() => {
                  return async ({ update }) => {
                    await update();
                    showCreateTicket = null;
                    newTicketTitle = "";
                  };
                }}
              >
                <input type="hidden" name="stageId" value={stage.id} />
                <input
                  name="title"
                  type="text"
                  required
                  bind:value={newTicketTitle}
                  placeholder={m.tickets_new()}
                  class="mb-1.5 w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <div class="flex items-center gap-1.5">
                  <button type="submit" class="rounded bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700">
                    {m.btn_create()}
                  </button>
                  <button type="button" onclick={() => (showCreateTicket = null)} class="text-xs text-gray-400">
                    {m.btn_cancel()}
                  </button>
                </div>
              </form>
            </div>
          {/if}

          <!-- Tickets list -->
          <div class="flex-1 space-y-2 overflow-y-auto px-2 pb-2">
            {#each stageTickets as ticket}
              <a
                href="/app/tickets/{ticket.id}"
                class="block cursor-grab rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing dark:border-gray-600 dark:bg-gray-700"
                draggable="true"
                ondragstart={() => handleDragStart(ticket.id)}
              >
                <p class="text-sm font-medium text-gray-900 dark:text-white">{ticket.title}</p>

                {#if ticket.description}
                  <p class="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                    {ticket.description}
                  </p>
                {/if}

                <div class="mt-2 flex items-center justify-between">
                  <div class="flex items-center gap-1.5">
                    {#if ticket.priority && ticket.priority > 0}
                      <span class="rounded px-1.5 py-0.5 text-[10px] font-medium {priorityColor(ticket.priority)}">
                        {priorityLabel(ticket.priority)}
                      </span>
                    {/if}
                    {#if ticket.conversationCount > 0}
                      <span class="flex items-center gap-0.5 text-[10px] text-gray-400">
                        <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        {ticket.conversationCount}
                      </span>
                    {/if}
                  </div>
                  {#if ticket.assignee}
                    <span
                      class="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[9px] font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                      title={ticket.assignee.name}
                    >
                      {ticket.assignee.name.slice(0, 2).toUpperCase()}
                    </span>
                  {/if}
                </div>
              </a>
            {/each}

            {#if stageTickets.length === 0 && showCreateTicket !== stage.id}
              <p class="py-4 text-center text-xs text-gray-400">{m.tickets_no_tickets()}</p>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {:else if data.boards.length === 0}
    <!-- Empty state -->
    <div class="flex flex-1 items-center justify-center">
      <div class="text-center">
        <svg class="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">{m.kanban_no_boards()}</p>
        <button
          onclick={() => (showCreateBoard = true)}
          class="mt-3 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {m.kanban_new_board()}
        </button>
      </div>
    </div>
  {/if}
</div>
