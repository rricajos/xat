<script lang="ts">
  import { enhance } from "$app/forms";
  import { goto } from "$app/navigation";
  import * as m from "$lib/paraglide/messages";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let searchQuery = $state("");
  let searchResults = $state<Array<{
    id: number;
    displayId: number;
    status: number;
    contactName: string | null;
    contactEmail: string | null;
  }>>([]);
  let searching = $state(false);
  let showSearch = $state(false);

  async function searchConversations() {
    if (!searchQuery.trim()) {
      searchResults = [];
      return;
    }
    searching = true;
    const formData = new FormData();
    formData.set("query", searchQuery);
    const res = await fetch("?/searchConversations", {
      method: "POST",
      body: formData,
    });
    const json = await res.json();
    // SvelteKit form action returns data nested
    const actionData = json.type === "success" ? json.data : null;
    searchResults = actionData?.conversations ?? [];
    searching = false;
  }

  function statusLabel(s: number): string {
    switch (s) {
      case 0: return m.status_open();
      case 1: return m.status_resolved();
      case 2: return m.status_pending();
      case 3: return m.status_snoozed();
      default: return "";
    }
  }

  function statusColor(s: number): string {
    switch (s) {
      case 0: return "bg-green-100 text-green-700";
      case 1: return "bg-gray-100 text-gray-600";
      case 2: return "bg-yellow-100 text-yellow-700";
      case 3: return "bg-blue-100 text-blue-700";
      default: return "bg-gray-100 text-gray-600";
    }
  }
</script>

<div class="flex h-full flex-col overflow-hidden">
  <!-- Header -->
  <div class="flex items-center gap-3 border-b border-gray-200 bg-white px-6 py-3 dark:border-gray-700 dark:bg-gray-900">
    <a href="/app/tickets" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
      </svg>
    </a>
    <h1 class="text-lg font-semibold text-gray-900 dark:text-white">{data.ticket.title}</h1>
    {#if data.stage}
      <span class="rounded-full px-2.5 py-0.5 text-xs font-medium text-white" style="background-color: {data.stage.color}">
        {data.stage.name}
      </span>
    {/if}
  </div>

  <div class="flex flex-1 overflow-hidden">
    <!-- Main content -->
    <div class="flex-1 overflow-y-auto p-6">
      <!-- Ticket details form -->
      <form
        method="POST"
        action="?/update"
        use:enhance
        class="mb-8 space-y-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
      >
        <div>
          <label for="title" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
          <input
            id="title"
            name="title"
            type="text"
            required
            value={data.ticket.title}
            class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label for="description" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{m.kanban_stage_description()}</label>
          <textarea
            id="description"
            name="description"
            rows={3}
            value={data.ticket.description ?? ""}
            class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          ></textarea>
        </div>

        <div class="flex gap-4">
          <div class="flex-1">
            <label for="priority" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{m.condition_priority()}</label>
            <select
              id="priority"
              name="priority"
              value={String(data.ticket.priority ?? 0)}
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="0">{m.priority_none()}</option>
              <option value="1">{m.priority_medium()}</option>
              <option value="2">{m.priority_high()}</option>
              <option value="3">{m.priority_urgent()}</option>
            </select>
          </div>

          <div class="flex-1">
            <label for="assigneeId" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{m.btn_assign()}</label>
            <select
              id="assigneeId"
              name="assigneeId"
              value={String(data.ticket.assigneeId ?? "")}
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">{m.conversation_unassigned()}</option>
              {#each data.agents as agent}
                <option value={String(agent.id)}>{agent.name}</option>
              {/each}
            </select>
          </div>
        </div>

        <div class="flex items-center justify-between">
          <button type="submit" class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            {m.btn_save()}
          </button>
        </div>
      </form>

      <!-- Move to stage -->
      <div class="mb-8 rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">{m.tickets_move_to()}</h3>
        <div class="flex flex-wrap gap-2">
          {#each data.boardStages as s}
            {#if s.id !== data.ticket.stageId}
              <form method="POST" action="?/move" use:enhance>
                <input type="hidden" name="stageId" value={s.id} />
                <button
                  type="submit"
                  class="flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <span class="h-2 w-2 rounded-full" style="background-color: {s.color}"></span>
                  {s.name}
                </button>
              </form>
            {/if}
          {/each}
        </div>
      </div>

      <!-- Linked conversations -->
      <div class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div class="mb-3 flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
            {m.nav_conversations()} ({data.linkedConversations.length})
          </h3>
          <button
            onclick={() => (showSearch = !showSearch)}
            class="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
          >
            {m.tickets_link_conversation()}
          </button>
        </div>

        <!-- Search to link -->
        {#if showSearch}
          <div class="mb-4 rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-700">
            <div class="flex gap-2">
              <input
                type="text"
                bind:value={searchQuery}
                oninput={searchConversations}
                placeholder={m.search_placeholder()}
                class="flex-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
            {#if searchResults.length > 0}
              <div class="mt-2 space-y-1">
                {#each searchResults as conv}
                  <div class="flex items-center justify-between rounded-md bg-white px-3 py-2 dark:bg-gray-800">
                    <div>
                      <span class="text-sm font-medium text-gray-900 dark:text-white">#{conv.displayId}</span>
                      <span class="ml-2 text-xs text-gray-500">
                        {conv.contactName ?? conv.contactEmail ?? "Unknown"}
                      </span>
                      <span class="ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium {statusColor(conv.status)}">
                        {statusLabel(conv.status)}
                      </span>
                    </div>
                    <form method="POST" action="?/linkConversation" use:enhance={() => {
                      return async ({ update }) => {
                        await update();
                        searchQuery = "";
                        searchResults = [];
                        showSearch = false;
                      };
                    }}>
                      <input type="hidden" name="conversationId" value={conv.id} />
                      <button type="submit" class="rounded bg-blue-600 px-2 py-0.5 text-xs text-white hover:bg-blue-700">
                        Link
                      </button>
                    </form>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/if}

        <!-- Linked list -->
        {#if data.linkedConversations.length > 0}
          <div class="space-y-2">
            {#each data.linkedConversations as conv}
              <div class="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50 px-3 py-2 dark:border-gray-600 dark:bg-gray-700">
                <a href="/app/conversations/{conv.id}" class="flex items-center gap-2 hover:underline">
                  <span class="text-sm font-medium text-blue-600 dark:text-blue-400">#{conv.displayId}</span>
                  <span class="text-xs text-gray-600 dark:text-gray-400">
                    {conv.contactName ?? conv.contactEmail ?? "Unknown"}
                  </span>
                  <span class="rounded-full px-1.5 py-0.5 text-[10px] font-medium {statusColor(conv.status)}">
                    {statusLabel(conv.status)}
                  </span>
                </a>
                <form method="POST" action="?/unlinkConversation" use:enhance>
                  <input type="hidden" name="conversationId" value={conv.id} />
                  <button type="submit" class="text-xs text-red-500 hover:text-red-700">
                    {m.tickets_unlink_conversation()}
                  </button>
                </form>
              </div>
            {/each}
          </div>
        {:else if !showSearch}
          <p class="text-xs text-gray-400">{m.conversation_no_messages()}</p>
        {/if}
      </div>

      <!-- Danger zone -->
      <div class="mt-8">
        <form
          method="POST"
          action="?/delete"
          use:enhance={() => {
            return async ({ result }) => {
              if (result.type === "success") {
                goto("/app/tickets");
              }
            };
          }}
        >
          <button
            type="submit"
            class="text-xs text-red-500 hover:text-red-700"
            onclick={(e) => {
              if (!confirm(m.confirm_delete())) e.preventDefault();
            }}
          >
            {m.btn_delete()} ticket
          </button>
        </form>
      </div>
    </div>
  </div>
</div>
