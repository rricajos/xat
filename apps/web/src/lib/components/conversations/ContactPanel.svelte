<script lang="ts">
  import { onMount } from "svelte";

  interface AttrDef {
    id: number;
    attributeKey: string;
    attributeDisplayName: string;
    attributeDisplayType: string;
  }

  interface Props {
    contact: {
      id: number;
      name: string | null;
      email: string | null;
      phoneNumber: string | null;
      avatarUrl: string | null;
      additionalAttributes: unknown;
      customAttributes: unknown;
      lastActivityAt: Date | null;
      createdAt: Date;
    };
    conversationId?: number;
    conversationCustomAttributes?: Record<string, unknown>;
    conversationAttrDefs?: AttrDef[];
    contactAttrDefs?: AttrDef[];
    previousConversations?: Array<{
      id: number;
      displayId: number;
      status: number;
      lastActivityAt: Date;
    }>;
    labels?: Array<{
      id: number;
      title: string;
      color: string;
    }>;
    conversationLabels?: Array<{
      id: number;
      title: string;
      color: string;
    }>;
  }

  let {
    contact,
    conversationId,
    conversationCustomAttributes = {},
    conversationAttrDefs = [],
    contactAttrDefs = [],
    previousConversations = [],
    labels = [],
    conversationLabels = [],
  }: Props = $props();

  const initials = $derived(
    (contact.name ?? contact.email ?? "?").slice(0, 2).toUpperCase(),
  );

  let editingConvAttrs = $state(false);
  let editingContactAttrs = $state(false);
  let convAttrValues = $state<Record<string, string>>({});
  let contactAttrValues = $state<Record<string, string>>({});
  let savingAttrs = $state(false);

  function startEditConv() {
    convAttrValues = Object.fromEntries(
      conversationAttrDefs.map((d) => [d.attributeKey, String(conversationCustomAttributes[d.attributeKey] ?? "")])
    );
    editingConvAttrs = true;
  }

  function startEditContact() {
    const existing = (contact.customAttributes && typeof contact.customAttributes === "object")
      ? contact.customAttributes as Record<string, unknown>
      : {};
    contactAttrValues = Object.fromEntries(
      contactAttrDefs.map((d) => [d.attributeKey, String(existing[d.attributeKey] ?? "")])
    );
    editingContactAttrs = true;
  }

  async function saveConvAttrs() {
    if (!conversationId) return;
    savingAttrs = true;
    const attrs: Record<string, unknown> = {};
    for (const d of conversationAttrDefs) {
      const v = convAttrValues[d.attributeKey];
      if (v !== undefined && v !== "") attrs[d.attributeKey] = v;
    }
    await fetch(`/api/v1/conversations/${conversationId}/custom-attributes`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customAttributes: attrs }),
    });
    conversationCustomAttributes = attrs;
    editingConvAttrs = false;
    savingAttrs = false;
  }

  async function saveContactAttrs() {
    savingAttrs = true;
    const attrs: Record<string, unknown> = {};
    for (const d of contactAttrDefs) {
      const v = contactAttrValues[d.attributeKey];
      if (v !== undefined && v !== "") attrs[d.attributeKey] = v;
    }
    await fetch(`/api/v1/contacts/${contact.id}/custom-attributes`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customAttributes: attrs }),
    });
    editingContactAttrs = false;
    savingAttrs = false;
  }

  const staticContactAttrs = $derived(
    contact.customAttributes && typeof contact.customAttributes === "object"
      ? Object.entries(contact.customAttributes as Record<string, unknown>)
      : [],
  );

  const statusLabels: Record<number, { label: string; color: string }> = {
    0: { label: "Open", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    1: { label: "Resolved", color: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300" },
    2: { label: "Pending", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
    3: { label: "Snoozed", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  };

  // Participants
  interface Participant {
    id: number;
    userId: number;
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
  }

  let participants = $state<Participant[]>([]);
  let addingParticipant = $state(false);
  let participantSearch = $state("");
  let participantSearchResults = $state<Array<{ id: number; name: string | null; email: string | null }>>([]);

  async function loadParticipants() {
    if (!conversationId) return;
    const res = await fetch(`/api/v1/conversations/${conversationId}/participants`);
    if (res.ok) {
      const body = await res.json();
      participants = body.data ?? [];
    }
  }

  async function addParticipant(userId: number) {
    if (!conversationId) return;
    await fetch(`/api/v1/conversations/${conversationId}/participants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds: [userId] }),
    });
    addingParticipant = false;
    participantSearch = "";
    await loadParticipants();
  }

  async function removeParticipant(userId: number) {
    if (!conversationId) return;
    await fetch(`/api/v1/conversations/${conversationId}/participants`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    await loadParticipants();
  }

  onMount(() => {
    if (conversationId) loadParticipants();
  });
</script>

<aside class="w-[280px] flex-shrink-0 overflow-y-auto border-l border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
  <!-- Contact Header -->
  <div class="border-b border-gray-200 p-4 text-center dark:border-gray-700">
    {#if contact.avatarUrl}
      <img
        src={contact.avatarUrl}
        alt={contact.name ?? ""}
        class="mx-auto h-16 w-16 rounded-full object-cover"
      />
    {:else}
      <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 text-lg font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
        {initials}
      </div>
    {/if}
    <h3 class="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
      {contact.name ?? "Unknown"}
    </h3>
    {#if contact.email}
      <p class="text-xs text-gray-500 dark:text-gray-400">{contact.email}</p>
    {/if}
  </div>

  <!-- Contact Details -->
  <div class="p-4 space-y-4 border-b border-gray-200 dark:border-gray-700">
    <h4 class="text-xs font-semibold uppercase tracking-wider text-gray-500">
      Contact Information
    </h4>

    {#if contact.email}
      <div>
        <label class="text-xs text-gray-400">Email</label>
        <p class="text-sm text-gray-700 dark:text-gray-300">{contact.email}</p>
      </div>
    {/if}

    {#if contact.phoneNumber}
      <div>
        <label class="text-xs text-gray-400">Phone</label>
        <p class="text-sm text-gray-700 dark:text-gray-300">{contact.phoneNumber}</p>
      </div>
    {/if}

    {#if contact.lastActivityAt}
      <div>
        <label class="text-xs text-gray-400">Last Activity</label>
        <p class="text-sm text-gray-700 dark:text-gray-300">
          {new Date(contact.lastActivityAt).toLocaleDateString()}
        </p>
      </div>
    {/if}

    <div>
      <label class="text-xs text-gray-400">Created</label>
      <p class="text-sm text-gray-700 dark:text-gray-300">
        {new Date(contact.createdAt).toLocaleDateString()}
      </p>
    </div>
  </div>

  <!-- Conversation Labels -->
  {#if conversationLabels.length > 0}
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <h4 class="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
        Labels
      </h4>
      <div class="flex flex-wrap gap-1">
        {#each conversationLabels as label}
          <span
            class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
            style="background-color: {label.color}20; color: {label.color}"
          >
            <span class="h-1.5 w-1.5 rounded-full" style="background-color: {label.color}"></span>
            {label.title}
          </span>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Conversation Custom Attributes -->
  {#if conversationAttrDefs.length > 0}
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between mb-2">
        <h4 class="text-xs font-semibold uppercase tracking-wider text-gray-500">Conversation Info</h4>
        {#if !editingConvAttrs}
          <button onclick={startEditConv} class="text-xs text-blue-500 hover:text-blue-600">Edit</button>
        {/if}
      </div>
      {#if editingConvAttrs}
        <div class="space-y-2">
          {#each conversationAttrDefs as def}
            <div>
              <label for="conv-attr-{def.attributeKey}" class="text-xs text-gray-400">{def.attributeDisplayName}</label>
              <input
                id="conv-attr-{def.attributeKey}"
                type={def.attributeDisplayType === "number" ? "number" : "text"}
                value={convAttrValues[def.attributeKey] ?? ""}
                oninput={(e) => convAttrValues[def.attributeKey] = (e.currentTarget as HTMLInputElement).value}
                class="mt-0.5 w-full rounded border border-gray-200 px-2 py-1 text-xs focus:border-blue-400 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
          {/each}
          <div class="flex gap-2 pt-1">
            <button onclick={saveConvAttrs} disabled={savingAttrs} class="text-xs bg-blue-600 text-white rounded px-2 py-1 hover:bg-blue-700 disabled:opacity-50">Save</button>
            <button onclick={() => editingConvAttrs = false} class="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
          </div>
        </div>
      {:else}
        <div class="space-y-2">
          {#each conversationAttrDefs as def}
            {@const val = conversationCustomAttributes[def.attributeKey]}
            <div>
              <p class="text-xs text-gray-400">{def.attributeDisplayName}</p>
              <p class="text-sm text-gray-700 dark:text-gray-300">{val !== undefined && val !== "" ? String(val) : "—"}</p>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  <!-- Contact Custom Attributes -->
  {#if contactAttrDefs.length > 0 || staticContactAttrs.length > 0}
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between mb-2">
        <h4 class="text-xs font-semibold uppercase tracking-wider text-gray-500">Contact Info</h4>
        {#if contactAttrDefs.length > 0 && !editingContactAttrs}
          <button onclick={startEditContact} class="text-xs text-blue-500 hover:text-blue-600">Edit</button>
        {/if}
      </div>
      {#if editingContactAttrs}
        <div class="space-y-2">
          {#each contactAttrDefs as def}
            <div>
              <label for="contact-attr-{def.attributeKey}" class="text-xs text-gray-400">{def.attributeDisplayName}</label>
              <input
                id="contact-attr-{def.attributeKey}"
                type={def.attributeDisplayType === "number" ? "number" : "text"}
                value={contactAttrValues[def.attributeKey] ?? ""}
                oninput={(e) => contactAttrValues[def.attributeKey] = (e.currentTarget as HTMLInputElement).value}
                class="mt-0.5 w-full rounded border border-gray-200 px-2 py-1 text-xs focus:border-blue-400 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
          {/each}
          <div class="flex gap-2 pt-1">
            <button onclick={saveContactAttrs} disabled={savingAttrs} class="text-xs bg-blue-600 text-white rounded px-2 py-1 hover:bg-blue-700 disabled:opacity-50">Save</button>
            <button onclick={() => editingContactAttrs = false} class="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
          </div>
        </div>
      {:else}
        <div class="space-y-2">
          {#each contactAttrDefs as def}
            {@const existing = (contact.customAttributes as Record<string, unknown> | null) ?? {}}
            <div>
              <p class="text-xs text-gray-400">{def.attributeDisplayName}</p>
              <p class="text-sm text-gray-700 dark:text-gray-300">{existing[def.attributeKey] !== undefined ? String(existing[def.attributeKey]) : "—"}</p>
            </div>
          {/each}
          {#each staticContactAttrs as [key, value]}
            {#if !contactAttrDefs.some((d) => d.attributeKey === key)}
              <div>
                <p class="text-xs text-gray-400">{key}</p>
                <p class="text-sm text-gray-700 dark:text-gray-300">{String(value)}</p>
              </div>
            {/if}
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  <!-- Previous Conversations -->
  {#if previousConversations.length > 0}
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <h4 class="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
        Previous Conversations ({previousConversations.length})
      </h4>
      <div class="space-y-1.5">
        {#each previousConversations.slice(0, 5) as conv}
          <a
            href="/app/conversations/{conv.displayId}"
            class="flex items-center justify-between rounded-md px-2 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div class="flex items-center gap-2">
              <span class="text-gray-600 dark:text-gray-300">#{conv.displayId}</span>
              <span class="rounded-full px-1.5 py-0.5 text-[10px] font-medium {statusLabels[conv.status]?.color ?? 'bg-gray-100 text-gray-500'}">
                {statusLabels[conv.status]?.label ?? "Unknown"}
              </span>
            </div>
            <span class="text-gray-400">{new Date(conv.lastActivityAt).toLocaleDateString()}</span>
          </a>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Participants -->
  {#if conversationId}
    <div class="border-t border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between px-4 py-2">
        <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">Participants</h3>
        <button
          onclick={() => addingParticipant = !addingParticipant}
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          title="Add participant"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </div>

      {#if addingParticipant}
        <div class="px-4 pb-2">
          <input
            type="text"
            placeholder="Agent user ID..."
            bind:value={participantSearch}
            class="w-full rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            onkeydown={(e) => {
              if (e.key === "Enter") {
                const uid = parseInt(participantSearch);
                if (!isNaN(uid)) addParticipant(uid);
              }
              if (e.key === "Escape") { addingParticipant = false; participantSearch = ""; }
            }}
          />
          <p class="mt-1 text-[10px] text-gray-400">Enter user ID and press Enter</p>
        </div>
      {/if}

      <div class="space-y-1 px-4 pb-3">
        {#each participants as p}
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              {#if p.avatarUrl}
                <img src={p.avatarUrl} alt="" class="h-5 w-5 rounded-full object-cover" />
              {:else}
                <div class="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-[9px] font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                  {(p.name ?? p.email ?? "?").slice(0, 2).toUpperCase()}
                </div>
              {/if}
              <span class="text-xs text-gray-700 dark:text-gray-300">{p.name ?? p.email}</span>
            </div>
            <button
              onclick={() => removeParticipant(p.userId)}
              class="text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400"
              title="Remove"
            >
              <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        {:else}
          <p class="text-[11px] text-gray-400 italic">No participants yet</p>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Actions -->
  <div class="p-4">
    <a
      href="/app/contacts/{contact.id}"
      class="block w-full rounded-md bg-gray-100 px-3 py-2 text-center text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
    >
      View Contact Profile
    </a>
  </div>
</aside>
