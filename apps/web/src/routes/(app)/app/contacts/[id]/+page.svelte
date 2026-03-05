<script lang="ts">
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
    <div class="mx-auto max-w-3xl p-6">
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
