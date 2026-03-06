<script lang="ts">
  import { onMount } from "svelte";
  import { enhance } from "$app/forms";
  import { goto } from "$app/navigation";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let noteInput = $state("");
  let editMode = $state(false);
  let showMerge = $state(false);
  let mergeContactId = $state("");
  let merging = $state(false);
  let mergeError = $state<string | null>(null);

  // Activity timeline
  let activeTab = $state<"overview" | "timeline">("overview");

  interface TimelineItem {
    type: "conversation" | "note";
    id: number;
    createdAt: string;
    data: Record<string, unknown>;
  }

  let timeline = $state<TimelineItem[]>([]);
  let timelineLoading = $state(false);

  async function loadTimeline() {
    if (timeline.length > 0) return;
    timelineLoading = true;
    const res = await fetch(`/api/v1/contacts/${data.contact.id}/timeline`);
    if (res.ok) {
      const body = await res.json();
      timeline = body.data ?? [];
    }
    timelineLoading = false;
  }

  const convStatusLabels: Record<number, string> = { 0: "Open", 1: "Resolved", 2: "Pending", 3: "Snoozed" };

  async function handleMerge() {
    const secondaryId = parseInt(mergeContactId);
    if (isNaN(secondaryId) || secondaryId === data.contact.id) {
      mergeError = "Enter a valid contact ID different from this one";
      return;
    }
    merging = true;
    mergeError = null;
    try {
      const res = await fetch("/api/v1/contacts/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryContactId: data.contact.id,
          secondaryContactId: secondaryId,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        mergeError = result.error ?? "Merge failed";
        return;
      }
      showMerge = false;
      goto(`/app/contacts/${data.contact.id}`, { invalidateAll: true });
    } finally {
      merging = false;
    }
  }

  const statusLabels: Record<number, { label: string; color: string }> = {
    0: { label: "Open", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    1: { label: "Resolved", color: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300" },
    2: { label: "Pending", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
    3: { label: "Snoozed", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  };

  const initials = $derived(
    (data.contact.name ?? data.contact.email ?? "?").slice(0, 2).toUpperCase(),
  );
</script>

{#if showMerge}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
    <div class="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-800" onclick={(e) => e.stopPropagation()}>
      <h3 class="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Merge Contact</h3>
      <p class="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Enter the ID of the contact to merge into this one. Their conversations and notes will be moved here, and the other contact will be deleted.
      </p>
      {#if mergeError}
        <div class="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {mergeError}
        </div>
      {/if}
      <input
        type="number"
        bind:value={mergeContactId}
        placeholder="Contact ID to merge"
        class="mb-4 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
      />
      <div class="flex justify-end gap-2">
        <button
          onclick={() => { showMerge = false; mergeError = null; }}
          class="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
        >
          Cancel
        </button>
        <button
          onclick={handleMerge}
          disabled={merging}
          class="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {merging ? "Merging..." : "Merge"}
        </button>
      </div>
    </div>
  </div>
{/if}

<div class="flex h-full">
  <!-- Main Content -->
  <div class="flex-1 overflow-y-auto">
    <div class="max-w-6xl p-6">
      <!-- Contact Header -->
      <div class="flex items-start gap-4 mb-8">
        <div class="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xl font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
          {initials}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white truncate">
              {data.contact.name ?? "Unknown"}
            </h2>
            <button
              onclick={() => editMode = !editMode}
              class="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              {editMode ? "Cancel" : "Edit"}
            </button>
            <button
              onclick={() => (showMerge = !showMerge)}
              class="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              Merge
            </button>
          </div>
          {#if data.contact.email}
            <p class="text-sm text-gray-500 dark:text-gray-400">{data.contact.email}</p>
          {/if}
          {#if data.contact.phoneNumber}
            <p class="text-sm text-gray-500 dark:text-gray-400">{data.contact.phoneNumber}</p>
          {/if}

          <!-- Labels -->
          {#if data.labels && data.labels.length > 0}
            <div class="mt-2 flex flex-wrap gap-1.5">
              {#each data.labels as label}
                <span
                  class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                  style="background-color: {label.color}20; color: {label.color}"
                >
                  <span class="h-1.5 w-1.5 rounded-full" style="background-color: {label.color}"></span>
                  {label.title}
                </span>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      <!-- Edit Form -->
      {#if editMode}
        <form method="POST" action="?/update" use:enhance class="mb-8 rounded-lg border border-gray-200 p-4 space-y-4 dark:border-gray-700">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
              <input id="name" name="name" type="text" value={data.contact.name ?? ""}
                class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
            </div>
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <input id="email" name="email" type="email" value={data.contact.email ?? ""}
                class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
            </div>
            <div>
              <label for="phoneNumber" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
              <input id="phoneNumber" name="phoneNumber" type="text" value={data.contact.phoneNumber ?? ""}
                class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
            </div>
          </div>
          <button type="submit" class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Save Changes
          </button>
        </form>
      {/if}

      <!-- Tab switcher -->
      <div class="mb-6 flex border-b border-gray-200 dark:border-gray-700">
        <button
          onclick={() => activeTab = "overview"}
          class="border-b-2 -mb-px px-4 py-2 text-sm font-medium transition-colors {activeTab === 'overview'
            ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}"
        >
          Overview
        </button>
        <button
          onclick={() => { activeTab = 'timeline'; loadTimeline(); }}
          class="border-b-2 -mb-px px-4 py-2 text-sm font-medium transition-colors {activeTab === 'timeline'
            ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}"
        >
          Activity Timeline
        </button>
      </div>

      {#if activeTab === "timeline"}
        {#if timelineLoading}
          <p class="text-sm text-gray-400">Loading timeline…</p>
        {:else if timeline.length === 0}
          <p class="text-sm text-gray-400 text-center py-8">No activity recorded yet.</p>
        {:else}
          <ol class="relative border-l border-gray-200 dark:border-gray-700 ml-3 space-y-6">
            {#each timeline as item}
              <li class="ml-6">
                <span class="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full {item.type === 'conversation' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'}">
                  {#if item.type === "conversation"}
                    <svg class="h-3 w-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  {:else}
                    <svg class="h-3 w-3 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  {/if}
                </span>
                <div class="rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  {#if item.type === "conversation"}
                    <div class="flex items-center justify-between">
                      <a href="/app/conversations/{item.data.id}" class="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
                        Conversation #{item.data.id}
                      </a>
                      <span class="text-xs text-gray-400">{convStatusLabels[item.data.status as number] ?? "Unknown"}</span>
                    </div>
                    {#if item.data.inboxName}
                      <p class="mt-0.5 text-xs text-gray-500">{item.data.inboxName}</p>
                    {/if}
                    {#if item.data.lastMessage}
                      <p class="mt-1 text-xs text-gray-600 line-clamp-2 dark:text-gray-300">{item.data.lastMessage}</p>
                    {/if}
                  {:else}
                    <p class="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{item.data.content}</p>
                    {#if item.data.userName}
                      <p class="mt-1 text-xs text-gray-400">by {item.data.userName}</p>
                    {/if}
                  {/if}
                  <time class="mt-1 block text-[11px] text-gray-400">
                    {new Date(item.createdAt).toLocaleString()}
                  </time>
                </div>
              </li>
            {/each}
          </ol>
        {/if}
      {:else}

      <!-- Previous Conversations -->
      <div class="mb-8">
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Previous Conversations ({data.conversations.length})
        </h3>
        <div class="space-y-2">
          {#each data.conversations as conv}
            <a
              href="/app/conversations/{conv.displayId}"
              class="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 hover:bg-gray-50 transition-colors dark:border-gray-700 dark:hover:bg-gray-800"
            >
              <div class="flex items-center gap-3">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">#{conv.displayId}</span>
                <span class="rounded-full px-2 py-0.5 text-xs font-medium {statusLabels[conv.status]?.color ?? 'bg-gray-100 text-gray-500'}">
                  {statusLabels[conv.status]?.label ?? "Unknown"}
                </span>
                <span class="text-xs text-gray-400">{conv.inboxName} ({conv.inboxChannelType})</span>
              </div>
              <span class="text-xs text-gray-400">
                {new Date(conv.lastActivityAt).toLocaleDateString()}
              </span>
            </a>
          {/each}

          {#if data.conversations.length === 0}
            <p class="text-sm text-gray-400 py-4 text-center">No conversations yet</p>
          {/if}
        </div>
      </div>

      <!-- Notes -->
      <div>
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Notes</h3>

        <form
          method="POST"
          action="?/addNote"
          use:enhance={() => {
            return async ({ update }) => {
              noteInput = "";
              await update();
            };
          }}
          class="mb-4"
        >
          <div class="flex gap-2">
            <textarea
              name="content"
              bind:value={noteInput}
              placeholder="Add a note about this contact..."
              rows="2"
              class="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
              onkeydown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.currentTarget.form?.requestSubmit();
                }
              }}
            ></textarea>
            <button
              type="submit"
              disabled={!noteInput.trim()}
              class="self-end rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </form>

        <div class="space-y-3">
          {#each data.notes as note}
            <div class="rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3 dark:bg-yellow-900/10 dark:border-yellow-800/30">
              <p class="text-sm text-gray-800 whitespace-pre-wrap dark:text-gray-200">{note.content}</p>
              <div class="mt-2 flex items-center gap-2 text-xs text-gray-400">
                <span>{note.authorName}</span>
                <span>&middot;</span>
                <span>{new Date(note.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          {/each}

          {#if data.notes.length === 0}
            <p class="text-sm text-gray-400 text-center py-4">No notes yet</p>
          {/if}
        </div>
      </div>
      {/if}
    </div>
  </div>

  <!-- Contact Info Sidebar -->
  <aside class="w-64 flex-shrink-0 border-l border-gray-200 bg-white p-4 overflow-y-auto dark:border-gray-700 dark:bg-gray-900">
    <h4 class="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">
      Contact Details
    </h4>

    <div class="space-y-4">
      <div>
        <label class="text-xs text-gray-400">Identifier</label>
        <p class="text-sm text-gray-700 dark:text-gray-300">{data.contact.identifier ?? "-"}</p>
      </div>
      <div>
        <label class="text-xs text-gray-400">Company</label>
        <p class="text-sm text-gray-700 dark:text-gray-300">{data.contact.companyId ?? "None"}</p>
      </div>
      <div>
        <label class="text-xs text-gray-400">Last Activity</label>
        <p class="text-sm text-gray-700 dark:text-gray-300">
          {data.contact.lastActivityAt ? new Date(data.contact.lastActivityAt).toLocaleDateString() : "-"}
        </p>
      </div>
      <div>
        <label class="text-xs text-gray-400">Created</label>
        <p class="text-sm text-gray-700 dark:text-gray-300">
          {new Date(data.contact.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>

    <!-- Custom Attributes -->
    <h4 class="text-xs font-semibold uppercase tracking-wider text-gray-500 mt-6 mb-3">
      Custom Attributes
    </h4>
    {#if data.contact.customAttributes && Object.keys(data.contact.customAttributes as object).length > 0}
      <div class="space-y-2">
        {#each Object.entries(data.contact.customAttributes as Record<string, unknown>) as [key, value]}
          <div>
            <label class="text-xs text-gray-400">{key}</label>
            <p class="text-sm text-gray-700 dark:text-gray-300">{String(value)}</p>
          </div>
        {/each}
      </div>
    {:else}
      <p class="text-xs text-gray-400">No custom attributes</p>
    {/if}

    <!-- Add Label -->
    <h4 class="text-xs font-semibold uppercase tracking-wider text-gray-500 mt-6 mb-3">
      Labels
    </h4>
    {#if data.labels && data.labels.length > 0}
      <div class="flex flex-wrap gap-1.5">
        {#each data.labels as label}
          <form method="POST" action="?/removeLabel" use:enhance class="inline-flex">
            <input type="hidden" name="labelId" value={label.id} />
            <button
              type="submit"
              class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium hover:opacity-80"
              style="background-color: {label.color}20; color: {label.color}"
              title="Remove label"
            >
              {label.title}
              <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </form>
        {/each}
      </div>
    {:else}
      <p class="text-xs text-gray-400 mb-2">No labels</p>
    {/if}

    {#if data.availableLabels && data.availableLabels.length > 0}
      <form method="POST" action="?/addLabel" use:enhance class="mt-2">
        <select
          name="labelId"
          onchange={(e) => (e.currentTarget as HTMLSelectElement).form?.requestSubmit()}
          class="w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          <option value="">+ Add label</option>
          {#each data.availableLabels as label}
            <option value={label.id}>{label.title}</option>
          {/each}
        </select>
      </form>
    {/if}
  </aside>
</div>
