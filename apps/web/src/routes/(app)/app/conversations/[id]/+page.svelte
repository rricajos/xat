<script lang="ts">
  import { enhance } from "$app/forms";
  import { page } from "$app/stores";
  import { onMount, onDestroy, tick } from "svelte";
  import MessageBubble from "$lib/components/conversations/MessageBubble.svelte";
  import ContactPanel from "$lib/components/conversations/ContactPanel.svelte";
  import CannedResponsePicker from "$lib/components/conversations/CannedResponsePicker.svelte";
  import EmojiPicker from "$lib/components/conversations/EmojiPicker.svelte";
  import type { PageData } from "./$types";
  import { CONVERSATION_STATUS } from "@xat/shared";
  import {
    connectSocket,
    getSocket,
    joinConversation,
    leaveConversation,
    emitTypingStart,
    emitTypingStop,
  } from "$lib/stores/realtime";

  let { data }: { data: PageData } = $props();
  let messageInput = $state("");
  let isPrivateNote = $state(false);
  let showContactPanel = $state(true);
  let showStatusMenu = $state(false);
  let liveMessages = $state<typeof data.messages>([]);
  let messagesContainer: HTMLDivElement | undefined = $state();
  let typingUsers = $state<Set<number>>(new Set());
  let captainLoading = $state(false);
  let showCaptainMenu = $state(false);
  let typingTimeout: ReturnType<typeof setTimeout> | null = null;
  let showCannedResponses = $state(false);
  let cannedQuery = $state("");
  let cannedPicker: CannedResponsePicker | undefined = $state();
  let selectedFiles = $state<File[]>([]);
  let fileInput: HTMLInputElement | undefined = $state();
  let showEmojiPicker = $state(false);

  // Get canned responses from parent layout data
  const cannedResponses = $derived(($page.data as { cannedResponses?: { id: number; shortCode: string; content: string }[] }).cannedResponses ?? []);

  function handleCannedSelect(content: string) {
    if (content) {
      // Replace the /query with the canned response content
      const slashIndex = messageInput.lastIndexOf("/");
      messageInput = (slashIndex > 0 ? messageInput.slice(0, slashIndex) : "") + content;
    }
    showCannedResponses = false;
    cannedQuery = "";
  }

  const statusActions: { label: string; action: string; status: number }[] = [
    { label: "Resolve", action: "resolve", status: 1 },
    { label: "Pending", action: "pending", status: 2 },
    { label: "Snooze", action: "snooze", status: 3 },
    { label: "Reopen", action: "reopen", status: 0 },
  ];

  const contactLabel = $derived(
    data.contact?.name ?? data.contact?.phoneNumber ?? data.contact?.email ?? "Unknown"
  );

  const allMessages = $derived([...data.messages, ...liveMessages]);

  async function scrollToBottom() {
    await tick();
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  // Reset live messages when navigating to a different conversation
  $effect(() => {
    // Access data.conversation.id to track changes
    const _id = data.conversation.id;
    liveMessages = [];
  });

  onMount(() => {
    const socket = connectSocket(data.conversation.accountId, data.conversation.assigneeId ?? 0);
    joinConversation(data.conversation.id);

    socket.on("message:created", (message: unknown) => {
      const msg = message as typeof data.messages[0];
      if (msg.conversationId === data.conversation.id) {
        // Avoid duplicates (our own message already in data.messages via form enhance)
        const exists = data.messages.some((m) => m.id === msg.id) ||
          liveMessages.some((m) => m.id === msg.id);
        if (!exists) {
          liveMessages = [...liveMessages, msg];
          scrollToBottom();
        }
      }
    });

    socket.on("typing:start", (evt: { conversationId: number; userId: number }) => {
      if (evt.conversationId === data.conversation.id) {
        typingUsers = new Set([...typingUsers, evt.userId]);
      }
    });

    socket.on("typing:stop", (evt: { conversationId: number; userId: number }) => {
      if (evt.conversationId === data.conversation.id) {
        const next = new Set(typingUsers);
        next.delete(evt.userId);
        typingUsers = next;
      }
    });

    scrollToBottom();
  });

  onDestroy(() => {
    leaveConversation(data.conversation.id);
    if (typingTimeout) clearTimeout(typingTimeout);
  });

  async function callCaptain(action: string, extra: Record<string, unknown> = {}) {
    captainLoading = true;
    showCaptainMenu = false;
    try {
      const conversationContext = {
        contactName: contactLabel,
        messages: allMessages
          .filter((m) => !m.private)
          .slice(-20)
          .map((m) => ({
            role: (m.messageType === 0 ? "customer" : "agent") as "customer" | "agent",
            content: m.content ?? "",
          })),
      };
      const res = await fetch("/api/v1/captain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, conversationContext, text: messageInput || undefined, ...extra }),
      });
      const json = await res.json();
      if (res.ok && json.data?.result) {
        if (action === "suggest_reply" || action === "adjust_tone" || action === "fix_grammar") {
          messageInput = json.data.result;
        }
      }
    } finally {
      captainLoading = false;
    }
  }

  function handleTyping() {
    const socket = getSocket();
    if (!socket) return;

    emitTypingStart(data.conversation.id, data.conversation.assigneeId ?? 0, isPrivateNote);

    if (typingTimeout) clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      emitTypingStop(data.conversation.id, data.conversation.assigneeId ?? 0);
    }, 2000);
  }
</script>

<div class="flex h-full">
  <!-- Main Chat Area -->
  <div class="flex flex-1 flex-col">
    <!-- Conversation Header -->
    <div class="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2.5 dark:border-gray-700 dark:bg-gray-900">
      <div class="flex items-center gap-3 min-w-0">
        {#if data.contact?.avatarUrl}
          <img src={data.contact.avatarUrl} alt="" class="h-8 w-8 rounded-full object-cover flex-shrink-0" />
        {:else}
          <div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700 flex-shrink-0 dark:bg-blue-900 dark:text-blue-300">
            {contactLabel.slice(0, 2).toUpperCase()}
          </div>
        {/if}
        <div class="min-w-0">
          <h3 class="text-sm font-semibold text-gray-900 truncate dark:text-white">
            {contactLabel}
          </h3>
          <span class="text-[11px] text-gray-400">
            #{data.conversation.displayId}
          </span>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <!-- Toggle contact panel -->
        <button
          onclick={() => showContactPanel = !showContactPanel}
          class="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
          title="Toggle contact panel"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </button>

        <!-- Status action button with dropdown -->
        <div class="relative">
          {#if data.conversation.status === CONVERSATION_STATUS.OPEN}
            <div class="flex">
              <form method="POST" action="?/resolve" use:enhance>
                <button
                  type="submit"
                  class="rounded-l-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                >
                  Resolve
                </button>
              </form>
              <button
                type="button"
                onclick={() => showStatusMenu = !showStatusMenu}
                class="rounded-r-md border-l border-green-700 bg-green-600 px-1.5 py-1.5 text-white hover:bg-green-700"
              >
                <svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          {:else}
            <div class="flex">
              <form method="POST" action="?/reopen" use:enhance>
                <button
                  type="submit"
                  class="rounded-l-md bg-yellow-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-yellow-700"
                >
                  Reopen
                </button>
              </form>
              <button
                type="button"
                onclick={() => showStatusMenu = !showStatusMenu}
                class="rounded-r-md border-l border-yellow-700 bg-yellow-600 px-1.5 py-1.5 text-white hover:bg-yellow-700"
              >
                <svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          {/if}

          {#if showStatusMenu}
            <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
            <div class="absolute right-0 top-full z-10 mt-1 w-32 rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800" onclick={() => showStatusMenu = false}>
              {#each statusActions.filter(a => a.status !== data.conversation.status) as action}
                <form method="POST" action="?/{action.action}" use:enhance>
                  <button type="submit" class="block w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700">
                    {action.label}
                  </button>
                </form>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Priority selector -->
        <form method="POST" action="?/setPriority" use:enhance>
          <select
            name="priority"
            onchange={(e) => e.currentTarget.form?.requestSubmit()}
            value={String(data.conversation.priority ?? "")}
            class="rounded-md border border-gray-200 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            title="Priority"
          >
            <option value="">No priority</option>
            <option value="1">Urgent</option>
            <option value="2">High</option>
            <option value="3">Medium</option>
            <option value="4">Low</option>
          </select>
        </form>
      </div>
    </div>

    <!-- Messages -->
    <div bind:this={messagesContainer} class="flex-1 overflow-y-auto bg-gray-50 p-4 dark:bg-gray-950">
      <div class="mx-auto max-w-3xl space-y-3">
        {#each allMessages as message (message.id)}
          <MessageBubble {message} />
        {/each}

        <!-- Typing indicator -->
        {#if typingUsers.size > 0}
          <div class="flex items-center gap-2 px-2 py-1">
            <div class="flex gap-1">
              <span class="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style="animation-delay: 0ms"></span>
              <span class="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style="animation-delay: 150ms"></span>
              <span class="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style="animation-delay: 300ms"></span>
            </div>
            <span class="text-xs text-gray-400">typing...</span>
          </div>
        {/if}
      </div>
    </div>

    <!-- Reply Box -->
    <div class="border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <!-- Reply / Private Note tabs -->
      <div class="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onclick={() => isPrivateNote = false}
          class="px-4 py-2 text-xs font-medium border-b-2 -mb-px transition-colors {!isPrivateNote
            ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}"
        >
          Reply
        </button>
        <button
          onclick={() => isPrivateNote = true}
          class="px-4 py-2 text-xs font-medium border-b-2 -mb-px transition-colors {isPrivateNote
            ? 'border-yellow-500 text-yellow-600 dark:border-yellow-400 dark:text-yellow-500'
            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}"
        >
          Private Note
        </button>
      </div>

      <form
        method="POST"
        action="?/send"
        enctype="multipart/form-data"
        use:enhance={() => {
          return async ({ update }) => {
            messageInput = "";
            selectedFiles = [];
            if (fileInput) fileInput.value = "";
            await update();
            scrollToBottom();
          };
        }}
        class="p-3"
      >
        <input type="hidden" name="private" value={isPrivateNote ? "true" : "false"} />
        <input
          bind:this={fileInput}
          type="file"
          name="files"
          multiple
          class="hidden"
          onchange={(e) => {
            const input = e.currentTarget as HTMLInputElement;
            if (input.files) {
              selectedFiles = [...selectedFiles, ...Array.from(input.files)];
            }
          }}
        />

        <!-- File previews -->
        {#if selectedFiles.length > 0}
          <div class="flex flex-wrap gap-2 mb-2">
            {#each selectedFiles as file, i}
              <div class="flex items-center gap-1.5 rounded-md bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800">
                {#if file.type.startsWith("image/")}
                  <svg class="h-3.5 w-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v13.5A1.5 1.5 0 003.75 21z" />
                  </svg>
                {:else}
                  <svg class="h-3.5 w-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                {/if}
                <span class="max-w-[120px] truncate text-gray-700 dark:text-gray-300">{file.name}</span>
                <button
                  type="button"
                  onclick={() => { selectedFiles = selectedFiles.filter((_, idx) => idx !== i); }}
                  class="ml-0.5 text-gray-400 hover:text-red-500"
                >
                  <svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
            {/each}
          </div>
        {/if}

        <div class="relative">
          {#if showCannedResponses}
            <CannedResponsePicker
              bind:this={cannedPicker}
              responses={cannedResponses}
              query={cannedQuery}
              onSelect={handleCannedSelect}
            />
          {/if}
          <textarea
            name="content"
            bind:value={messageInput}
            placeholder={isPrivateNote
              ? "Write a private note. Use @mentions to notify agents."
              : "Shift + enter for new line. Start with '/' to select a canned response."}
            rows="3"
            class="w-full resize-none rounded-md border-0 bg-transparent px-0 py-1 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 dark:text-white {isPrivateNote ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : ''}"
            oninput={(e) => {
              handleTyping();
              const val = (e.currentTarget as HTMLTextAreaElement).value;
              const slashIndex = val.lastIndexOf("/");
              if (slashIndex !== -1 && (slashIndex === 0 || val[slashIndex - 1] === " " || val[slashIndex - 1] === "\n")) {
                showCannedResponses = true;
                cannedQuery = val.slice(slashIndex + 1);
              } else {
                showCannedResponses = false;
              }
            }}
            onkeydown={(e) => {
              if (showCannedResponses && cannedPicker?.handleKeydown(e)) return;
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.currentTarget.form?.requestSubmit();
              }
            }}
          ></textarea>
        </div>

        <!-- Bottom toolbar -->
        <div class="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
          <div class="flex items-center gap-1">
            <div class="relative">
              <button
                type="button"
                onclick={() => showEmojiPicker = !showEmojiPicker}
                class="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 {showEmojiPicker ? 'bg-gray-100 text-gray-600 dark:bg-gray-700' : ''}"
                title="Emoji"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                </svg>
              </button>
              {#if showEmojiPicker}
                <EmojiPicker onSelect={(emoji) => { messageInput += emoji; showEmojiPicker = false; }} />
              {/if}
            </div>
            <button type="button" onclick={() => fileInput?.click()} class="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800" title="Attach file">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
              </svg>
            </button>
            <button type="button" class="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800" title="Voice note">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
            </button>
            <button type="button" class="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800" title="Signature">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
              </svg>
            </button>
            <!-- Captain AI -->
            <div class="relative">
              <button
                type="button"
                onclick={() => showCaptainMenu = !showCaptainMenu}
                disabled={captainLoading}
                class="rounded p-1.5 transition-colors {showCaptainMenu ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800'}"
                title="Captain AI"
              >
                {#if captainLoading}
                  <svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                {:else}
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                {/if}
              </button>
              {#if showCaptainMenu}
                <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
                <div class="absolute bottom-full left-0 mb-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800" onclick={() => showCaptainMenu = false}>
                  <button type="button" onclick={() => callCaptain("suggest_reply")} class="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700">
                    <svg class="h-3.5 w-3.5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" /></svg>
                    Suggest Reply
                  </button>
                  <button type="button" onclick={() => callCaptain("fix_grammar")} disabled={!messageInput.trim()} class="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-40 dark:text-gray-300 dark:hover:bg-gray-700">
                    <svg class="h-3.5 w-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Fix Grammar
                  </button>
                  <button type="button" onclick={() => callCaptain("adjust_tone", { tone: "professional" })} disabled={!messageInput.trim()} class="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-40 dark:text-gray-300 dark:hover:bg-gray-700">
                    <svg class="h-3.5 w-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" /></svg>
                    Make Professional
                  </button>
                  <button type="button" onclick={() => callCaptain("adjust_tone", { tone: "friendly" })} disabled={!messageInput.trim()} class="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-40 dark:text-gray-300 dark:hover:bg-gray-700">
                    <svg class="h-3.5 w-3.5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" /></svg>
                    Make Friendly
                  </button>
                </div>
              {/if}
            </div>
          </div>

          <button
            type="submit"
            disabled={!messageInput.trim()}
            class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40 {isPrivateNote
              ? 'bg-yellow-600 hover:bg-yellow-700'
              : 'bg-blue-600 hover:bg-blue-700'}"
          >
            {isPrivateNote ? "Add Note" : "Send"}
            <span class="text-[10px] opacity-70">{navigator?.platform?.includes("Mac") ? "Cmd" : "Ctrl"}+Enter</span>
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- Contact Info Panel -->
  {#if showContactPanel && data.contact}
    <ContactPanel
      contact={data.contact}
      conversationId={data.conversation.id}
      conversationCustomAttributes={(data.conversation.customAttributes ?? {}) as Record<string, unknown>}
      conversationAttrDefs={data.conversationAttrDefs}
      contactAttrDefs={data.contactAttrDefs}
      conversationLabels={data.conversationLabels}
      previousConversations={data.previousConversations}
    />
  {/if}
</div>
