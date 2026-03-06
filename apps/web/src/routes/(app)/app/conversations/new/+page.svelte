<script lang="ts">
  import { goto, invalidateAll } from "$app/navigation";
  import { page } from "$app/stores";
  import { tick } from "svelte";

  // ── Data from layout ─────────────────────────────────────────────────────────
  const inboxes = $derived(
    ($page.data.inboxes ?? []) as { id: number; name: string; channelType: string }[],
  );
  const cannedResponses = $derived(
    ($page.data.cannedResponses ?? []) as { id: number; shortCode: string; content: string }[],
  );

  // ── Channel icons ────────────────────────────────────────────────────────────
  const CHANNEL_ICON: Record<string, string> = {
    email: `<path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/>`,
    web_widget: `<path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"/>`,
    whatsapp: `<path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/>`,
    telegram: `<path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/>`,
  };

  function channelIcon(type: string): string {
    return (
      CHANNEL_ICON[type.toLowerCase()] ??
      `<path stroke-linecap="round" stroke-linejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"/>`
    );
  }

  // ── Form state ───────────────────────────────────────────────────────────────
  type Recipient = { id?: number; name: string; email?: string; phone?: string };

  let recipients = $state<Recipient[]>([]);
  let recipientQuery = $state("");
  let recipientResults = $state<
    { id: number; name: string; email: string | null; phone: string | null }[]
  >([]);
  let recipientTimer: ReturnType<typeof setTimeout> | null = null;
  let showRecipientDrop = $state(false);
  let recipientInputEl: HTMLInputElement | undefined;
  let activeResult = $state(-1);

  let selectedInboxId = $state<number | "">(inboxes[0]?.id ?? "");
  $effect(() => {
    if (!selectedInboxId && inboxes.length) selectedInboxId = inboxes[0]!.id;
  });

  const selectedInbox = $derived(inboxes.find((i) => i.id === selectedInboxId) ?? null);
  const isEmail = $derived(selectedInbox?.channelType?.toLowerCase() === "email");

  let subject = $state("");
  let message = $state("");
  let messageEl: HTMLTextAreaElement | undefined;
  let sending = $state(false);
  let sendError = $state("");

  // Canned responses
  let showTemplates = $state(false);
  let templateQuery = $state("");
  const filteredTemplates = $derived(
    templateQuery.trim()
      ? cannedResponses.filter(
          (t) =>
            t.shortCode.toLowerCase().includes(templateQuery.toLowerCase()) ||
            t.content.toLowerCase().includes(templateQuery.toLowerCase()),
        )
      : cannedResponses,
  );

  // ── Recipient search ─────────────────────────────────────────────────────────
  function onRecipientInput() {
    activeResult = -1;
    if (recipientTimer) clearTimeout(recipientTimer);
    const q = recipientQuery.trim();
    if (!q) {
      recipientResults = [];
      showRecipientDrop = false;
      return;
    }
    showRecipientDrop = true;
    recipientTimer = setTimeout(async () => {
      const res = await fetch(`/api/v1/contacts?q=${encodeURIComponent(q)}&limit=8`);
      const json = await res.json();
      recipientResults = json.data ?? [];
    }, 250);
  }

  function addRecipient(r: { id: number; name: string; email: string | null; phone: string | null }) {
    if (recipients.some((x) => x.id === r.id)) return;
    recipients = [...recipients, { id: r.id, name: r.name, email: r.email ?? undefined, phone: r.phone ?? undefined }];
    recipientQuery = "";
    recipientResults = [];
    showRecipientDrop = false;
    activeResult = -1;
    recipientInputEl?.focus();
  }

  function addRawRecipient() {
    const q = recipientQuery.trim();
    if (!q) return;
    // Raw email or phone
    const isEmailAddr = q.includes("@");
    if (recipients.some((x) => x.email === q || x.phone === q || x.name === q)) return;
    recipients = [
      ...recipients,
      isEmailAddr ? { name: q, email: q } : { name: q, phone: q },
    ];
    recipientQuery = "";
    recipientResults = [];
    showRecipientDrop = false;
    recipientInputEl?.focus();
  }

  function removeRecipient(idx: number) {
    recipients = recipients.filter((_, i) => i !== idx);
  }

  function onRecipientKeydown(e: KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      activeResult = Math.min(activeResult + 1, recipientResults.length - 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      activeResult = Math.max(activeResult - 1, -1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeResult >= 0 && recipientResults[activeResult]) {
        addRecipient(recipientResults[activeResult]!);
      } else if (recipientQuery.trim()) {
        addRawRecipient();
      }
    } else if (e.key === "Escape") {
      showRecipientDrop = false;
      activeResult = -1;
    } else if ((e.key === "," || e.key === "Tab") && recipientQuery.trim()) {
      e.preventDefault();
      addRawRecipient();
    } else if (e.key === "Backspace" && !recipientQuery && recipients.length > 0) {
      recipients = recipients.slice(0, -1);
    }
  }

  // ── Canned response in message ───────────────────────────────────────────────
  function applyTemplate(content: string) {
    message = content;
    showTemplates = false;
    templateQuery = "";
    tick().then(() => messageEl?.focus());
  }

  // Also trigger on typing # at start of message
  let messageHashSearch = $state("");
  let showInlineTemplates = $state(false);

  function onMessageInput(e: Event) {
    const v = (e.target as HTMLTextAreaElement).value;
    message = v;
    if (v.startsWith("#")) {
      messageHashSearch = v.slice(1);
      showInlineTemplates = true;
    } else {
      showInlineTemplates = false;
    }
  }

  // ── Send ─────────────────────────────────────────────────────────────────────
  async function send() {
    if (!recipients.length || !selectedInboxId || !message.trim()) return;
    sending = true;
    sendError = "";

    const firstConvId: number | null = null;
    let navigateTo = "/app/conversations";

    for (const r of recipients) {
      if (!r.id) {
        // TODO: create contact first — for now skip raw recipients without a contact ID
        continue;
      }
      try {
        // 1. Create conversation
        const convRes = await fetch("/api/v1/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inbox_id: selectedInboxId,
            contact_id: r.id,
            ...(isEmail && subject.trim() ? { subject: subject.trim() } : {}),
          }),
        });
        const convJson = await convRes.json();
        const displayId = convJson.data?.displayId ?? convJson.data?.display_id;
        if (!displayId) continue;

        if (navigateTo === "/app/conversations") navigateTo = `/app/conversations/${displayId}`;

        // 2. Send initial message
        if (message.trim()) {
          await fetch(`/api/v1/conversations/${displayId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: message.trim() }),
          });
        }
      } catch {
        // continue with next recipient
      }
    }

    sending = false;
    await invalidateAll();
    goto(navigateTo);
  }

  const canSend = $derived(
    recipients.length > 0 &&
      !!selectedInboxId &&
      message.trim().length > 0 &&
      !sending,
  );
</script>

<div class="flex h-full flex-col bg-white dark:bg-gray-900">

  <!-- Header -->
  <div class="flex flex-shrink-0 items-center justify-between border-b border-gray-200 px-5 py-3 dark:border-gray-700">
    <div class="flex items-center gap-2">
      <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
      </svg>
      <h2 class="text-sm font-semibold text-gray-900 dark:text-white">New conversation</h2>
    </div>
    <a
      href="/app/conversations"
      class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
      title="Discard (Esc)"
    >
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </a>
  </div>

  <!-- Form body -->
  <div class="flex flex-1 flex-col overflow-hidden">

    <!-- To: recipients -->
    <div class="flex-shrink-0 border-b border-gray-100 dark:border-gray-800">
      <div class="flex min-h-[44px] flex-wrap items-center gap-1.5 px-5 py-2">
        <span class="flex-shrink-0 text-xs font-medium text-gray-400 dark:text-gray-500">To</span>

        <!-- Chips -->
        {#each recipients as r, i}
          <span class="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            {r.name}
            <button
              type="button"
              onclick={() => removeRecipient(i)}
              class="ml-0.5 rounded-full text-blue-400 hover:text-blue-700 dark:hover:text-blue-200"
            >
              <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        {/each}

        <!-- Input -->
        <div class="relative min-w-[160px] flex-1">
          <input
            bind:this={recipientInputEl}
            type="text"
            bind:value={recipientQuery}
            oninput={onRecipientInput}
            onkeydown={onRecipientKeydown}
            onblur={() => setTimeout(() => (showRecipientDrop = false), 150)}
            placeholder={recipients.length === 0 ? "Search contacts, email or phone…" : "Add more…"}
            class="w-full bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none dark:text-gray-200 dark:placeholder:text-gray-500"
          />

          <!-- Dropdown -->
          {#if showRecipientDrop && (recipientResults.length > 0 || recipientQuery.trim())}
            <div class="absolute left-0 top-full z-20 mt-1 w-72 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
              {#each recipientResults as r, idx}
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div
                  onclick={() => addRecipient(r)}
                  class="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700
                    {activeResult === idx ? 'bg-blue-50 dark:bg-blue-900/20' : ''}"
                >
                  <div class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-600 dark:bg-gray-600 dark:text-gray-300">
                    {r.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div class="min-w-0">
                    <p class="truncate text-sm font-medium text-gray-800 dark:text-gray-200">{r.name}</p>
                    {#if r.email}<p class="truncate text-xs text-gray-400">{r.email}</p>{/if}
                    {#if r.phone}<p class="truncate text-xs text-gray-400">{r.phone}</p>{/if}
                  </div>
                </div>
              {/each}
              {#if recipientQuery.includes("@") || (!recipientResults.length && recipientQuery.trim())}
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div
                  onclick={addRawRecipient}
                  class="flex cursor-pointer items-center gap-2 border-t border-gray-100 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                >
                  <svg class="h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add "<span class="font-medium text-gray-700 dark:text-gray-300">{recipientQuery}</span>"
                </div>
              {/if}
            </div>
          {/if}
        </div>
      </div>
    </div>

    <!-- Channel selector -->
    <div class="flex flex-shrink-0 items-center gap-3 border-b border-gray-100 px-5 py-2.5 dark:border-gray-800">
      <span class="flex-shrink-0 text-xs font-medium text-gray-400 dark:text-gray-500">Channel</span>
      <div class="flex flex-1 flex-wrap gap-1.5">
        {#each inboxes as inbox}
          <button
            type="button"
            onclick={() => (selectedInboxId = inbox.id)}
            class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors
              {selectedInboxId === inbox.id
                ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'}"
          >
            <svg class="h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              {@html channelIcon(inbox.channelType)}
            </svg>
            {inbox.name}
          </button>
        {/each}
      </div>
    </div>

    <!-- Subject (email only) -->
    {#if isEmail}
      <div class="flex flex-shrink-0 items-center gap-3 border-b border-gray-100 px-5 py-2 dark:border-gray-800">
        <span class="flex-shrink-0 text-xs font-medium text-gray-400 dark:text-gray-500">Subject</span>
        <input
          type="text"
          bind:value={subject}
          placeholder="Enter subject…"
          class="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none dark:text-gray-200 dark:placeholder:text-gray-500"
        />
      </div>
    {/if}

    <!-- Message area -->
    <div class="relative flex flex-1 flex-col overflow-hidden">

      <!-- Inline template picker (triggered by #) -->
      {#if showInlineTemplates && filteredTemplates.length > 0}
        <div class="absolute left-4 top-2 z-10 max-h-48 w-72 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {#each filteredTemplates as t}
            <button
              type="button"
              onclick={() => applyTemplate(t.content)}
              class="flex w-full flex-col px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <span class="text-xs font-semibold text-blue-600 dark:text-blue-400">#{t.shortCode}</span>
              <span class="truncate text-xs text-gray-500 dark:text-gray-400">{t.content.slice(0, 80)}</span>
            </button>
          {/each}
        </div>
      {/if}

      <textarea
        bind:this={messageEl}
        oninput={onMessageInput}
        value={message}
        placeholder="Write your message… (type # for templates)"
        class="flex-1 resize-none bg-transparent px-5 py-4 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none dark:text-gray-200 dark:placeholder:text-gray-500"
      ></textarea>
    </div>

    <!-- Toolbar + Send -->
    <div class="flex flex-shrink-0 items-center justify-between border-t border-gray-200 px-5 py-3 dark:border-gray-700">
      <!-- Templates button -->
      <div class="relative">
        <button
          type="button"
          onclick={() => {
            showTemplates = !showTemplates;
            templateQuery = "";
          }}
          class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
          title="Canned responses"
        >
          <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
          </svg>
          Templates
          {#if cannedResponses.length > 0}
            <span class="rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] font-semibold dark:bg-gray-700">
              {cannedResponses.length}
            </span>
          {/if}
        </button>

        {#if showTemplates}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div
            class="fixed inset-0 z-10"
            onclick={() => (showTemplates = false)}
          ></div>
          <div class="absolute bottom-10 left-0 z-20 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
            <div class="border-b border-gray-100 p-2 dark:border-gray-700">
              <input
                type="text"
                bind:value={templateQuery}
                placeholder="Search templates…"
                class="w-full rounded-md bg-gray-50 px-3 py-1.5 text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none dark:bg-gray-700 dark:text-gray-200 dark:placeholder:text-gray-500"
                autofocus
              />
            </div>
            <div class="max-h-56 overflow-y-auto">
              {#if filteredTemplates.length === 0}
                <p class="px-4 py-6 text-center text-xs text-gray-400">No templates found</p>
              {:else}
                {#each filteredTemplates as t}
                  <button
                    type="button"
                    onclick={() => applyTemplate(t.content)}
                    class="flex w-full flex-col gap-0.5 px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <div class="flex items-center gap-1.5">
                      <span class="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                        #{t.shortCode}
                      </span>
                    </div>
                    <p class="line-clamp-2 text-xs text-gray-500 dark:text-gray-400">{t.content}</p>
                  </button>
                {/each}
              {/if}
            </div>
          </div>
        {/if}
      </div>

      <!-- Right actions -->
      <div class="flex items-center gap-2">
        {#if sendError}
          <span class="text-xs text-red-500">{sendError}</span>
        {/if}
        {#if !canSend && !sending}
          <span class="text-[11px] text-gray-400">
            {#if !recipients.length}Add a recipient
            {:else if !selectedInboxId}Select a channel
            {:else if !message.trim()}Write a message
            {:else}&nbsp;{/if}
          </span>
        {/if}
        <button
          type="button"
          onclick={send}
          disabled={!canSend}
          class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-blue-500"
        >
          {#if sending}
            <svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 5.373 0 0 5.373A8 8 0 014 12z"></path>
            </svg>
            Sending…
          {:else}
            Send
            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          {/if}
        </button>
      </div>
    </div>
  </div>
</div>
