<script lang="ts">
  import { io, type Socket } from "socket.io-client";

  interface Props {
    websiteToken: string;
    baseUrl: string;
    locale: string;
    position: "left" | "right";
    launcherTitle: string;
  }

  let {
    websiteToken,
    baseUrl,
    locale,
    position,
    launcherTitle,
  }: Props = $props();

  let isOpen = $state(false);
  let messages = $state<Array<{
    id: string;
    content: string;
    sender: "contact" | "agent";
    timestamp: Date;
    attachments?: Array<{ url: string; name: string; type: string }>;
  }>>([]);
  let inputValue = $state("");
  let socket: Socket | null = $state(null);
  let contactName = $state("");
  let contactEmail = $state("");
  let isConnected = $state(false);
  let showPreChat = $state(true);
  let agentTyping = $state(false);
  let typingTimeout: ReturnType<typeof setTimeout> | null = null;
  let agentTypingTimeout: ReturnType<typeof setTimeout> | null = null;
  let messagesEl: HTMLDivElement | undefined = $state();
  let showEmojiPicker = $state(false);
  let showCsat = $state(false);
  let csatRating = $state(0);
  let csatFeedback = $state("");
  let csatSubmitted = $state(false);
  let conversationId = $state<number | null>(null);
  let fileInput: HTMLInputElement | undefined = $state();
  let unreadCount = $state(0);

  const commonEmojis = [
    "😀", "😁", "😂", "🤣", "😊", "😇", "🙂", "😉",
    "😍", "🥰", "😘", "😋", "😎", "🤗", "🤔", "😐",
    "😑", "😶", "😏", "😒", "😞", "😔", "😟", "😢",
    "😭", "😤", "😠", "😡", "🤯", "😳", "🥺", "😱",
    "👍", "👎", "👋", "🤝", "🙏", "❤️", "🔥", "✅",
  ];

  function connectSocket() {
    socket = io(baseUrl, {
      path: "/ws",
      query: { websiteToken },
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      isConnected = true;
    });

    socket.on("disconnect", () => {
      isConnected = false;
    });

    socket.on("message:created", (message: unknown) => {
      const msg = message as {
        id: string;
        content: string;
        message_type: number;
        created_at: string;
        conversation_id?: number;
        attachments?: Array<{ url: string; name: string; type: string }>;
      };
      if (msg.conversation_id) conversationId = msg.conversation_id;
      messages = [
        ...messages,
        {
          id: msg.id,
          content: msg.content,
          sender: msg.message_type === 1 ? "agent" : "contact",
          timestamp: new Date(msg.created_at),
          attachments: msg.attachments,
        },
      ];
      scrollToBottom();
      if (!isOpen && msg.message_type === 1) {
        unreadCount++;
      }
    });

    socket.on("typing:start", () => {
      agentTyping = true;
      if (agentTypingTimeout) clearTimeout(agentTypingTimeout);
      agentTypingTimeout = setTimeout(() => {
        agentTyping = false;
      }, 3000);
    });

    socket.on("typing:stop", () => {
      agentTyping = false;
    });

    socket.on("conversation:resolved", () => {
      showCsat = true;
    });
  }

  function scrollToBottom() {
    requestAnimationFrame(() => {
      if (messagesEl) {
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }
    });
  }

  export function toggle() {
    isOpen = !isOpen;
    if (isOpen) {
      unreadCount = 0;
      if (!socket) connectSocket();
      scrollToBottom();
    }
  }

  export function open() {
    isOpen = true;
    unreadCount = 0;
    if (!socket) connectSocket();
    scrollToBottom();
  }

  export function close() {
    isOpen = false;
  }

  export function setUser(user: Record<string, unknown>) {
    if (user.name) contactName = String(user.name);
    if (user.email) contactEmail = String(user.email);
  }

  export function setLabel(label: string) {
    socket?.emit("widget:setLabel", { websiteToken, label });
  }

  export function removeLabel(label: string) {
    socket?.emit("widget:removeLabel", { websiteToken, label });
  }

  function sendMessage() {
    if (!inputValue.trim() || !socket) return;

    const content = inputValue.trim();
    inputValue = "";
    showEmojiPicker = false;

    messages = [
      ...messages,
      {
        id: `local-${Date.now()}`,
        content,
        sender: "contact",
        timestamp: new Date(),
      },
    ];

    socket.emit("widget:message", {
      content,
      websiteToken,
      contact: { name: contactName, email: contactEmail },
    });

    scrollToBottom();
  }

  function emitTyping() {
    if (!socket) return;
    socket.emit("widget:typing", { websiteToken, typing: true });

    if (typingTimeout) clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      socket?.emit("widget:typing", { websiteToken, typing: false });
    }, 2000);
  }

  function handleFileSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !socket) return;

    const reader = new FileReader();
    reader.onload = () => {
      socket!.emit("widget:attachment", {
        websiteToken,
        contact: { name: contactName, email: contactEmail },
        file: {
          name: file.name,
          type: file.type,
          size: file.size,
          data: reader.result,
        },
      });

      messages = [
        ...messages,
        {
          id: `local-${Date.now()}`,
          content: `[Attachment: ${file.name}]`,
          sender: "contact",
          timestamp: new Date(),
        },
      ];
      scrollToBottom();
    };
    reader.readAsDataURL(file);
    input.value = "";
  }

  function insertEmoji(emoji: string) {
    inputValue += emoji;
    showEmojiPicker = false;
  }

  async function submitCsat() {
    if (csatRating === 0) return;

    try {
      await fetch(`${baseUrl}/api/v1/csat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          rating: csatRating,
          feedbackText: csatFeedback || null,
        }),
      });
      csatSubmitted = true;
    } catch {
      // Silent fail for CSAT
    }
  }

  function startChat() {
    if (!contactName.trim() && !contactEmail.trim()) return;
    showPreChat = false;
    connectSocket();
  }

  function formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
</script>

<div
  class="fixed bottom-5 z-[2147483647] font-sans"
  style="{position === 'right' ? 'right: 20px' : 'left: 20px'}"
>
  <!-- Chat Window -->
  {#if isOpen}
    <div class="mb-4 flex flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      style="width: 375px; height: 580px;"
    >
      <!-- Header -->
      <div class="bg-blue-600 px-5 py-4 text-white">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-semibold text-base">{launcherTitle}</h3>
            <p class="text-xs text-blue-200">
              {#if agentTyping}
                Agent is typing...
              {:else if isConnected}
                We typically reply in a few minutes
              {:else}
                Connecting...
              {/if}
            </p>
          </div>
          <button
            onclick={() => close()}
            class="rounded-full p-1 hover:bg-blue-500 transition-colors"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {#if showPreChat}
        <!-- Pre-chat Form -->
        <div class="flex flex-1 flex-col items-center justify-center p-6">
          <h4 class="text-lg font-semibold text-gray-800 mb-1">Hi there!</h4>
          <p class="text-sm text-gray-500 mb-6 text-center">Please share your details to start the conversation.</p>
          <div class="w-full space-y-3">
            <input
              type="text"
              bind:value={contactName}
              placeholder="Your name"
              class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <input
              type="email"
              bind:value={contactEmail}
              placeholder="Your email"
              class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onclick={() => startChat()}
              class="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Start Conversation
            </button>
          </div>
        </div>

      {:else if showCsat}
        <!-- CSAT Survey -->
        <div class="flex flex-1 flex-col items-center justify-center p-6">
          {#if csatSubmitted}
            <svg class="h-12 w-12 text-green-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h4 class="text-lg font-semibold text-gray-800 mb-1">Thank you!</h4>
            <p class="text-sm text-gray-500 text-center">Your feedback helps us improve.</p>
            <button
              onclick={() => { showCsat = false; csatSubmitted = false; csatRating = 0; csatFeedback = ""; }}
              class="mt-4 rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Back to Chat
            </button>
          {:else}
            <h4 class="text-lg font-semibold text-gray-800 mb-1">Rate your conversation</h4>
            <p class="text-sm text-gray-500 mb-6 text-center">How would you rate your experience?</p>

            <div class="flex gap-3 mb-6">
              {#each [1, 2, 3, 4, 5] as star}
                <button
                  onclick={() => csatRating = star}
                  class="text-3xl transition-transform hover:scale-110 {csatRating >= star ? 'opacity-100' : 'opacity-30'}"
                >
                  ⭐
                </button>
              {/each}
            </div>

            <textarea
              bind:value={csatFeedback}
              placeholder="Any additional feedback? (optional)"
              rows="3"
              class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 mb-4"
            ></textarea>

            <div class="flex gap-2 w-full">
              <button
                onclick={() => showCsat = false}
                class="flex-1 rounded-lg border border-gray-300 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Skip
              </button>
              <button
                onclick={submitCsat}
                disabled={csatRating === 0}
                class="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Submit
              </button>
            </div>
          {/if}
        </div>

      {:else}
        <!-- Messages -->
        <div bind:this={messagesEl} class="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {#if messages.length === 0}
            <div class="flex h-full items-center justify-center">
              <p class="text-sm text-gray-400">Send a message to get started</p>
            </div>
          {/if}

          {#each messages as message}
            <div class="flex {message.sender === 'contact' ? 'justify-end' : 'justify-start'}">
              <div
                class="max-w-[80%] rounded-2xl px-4 py-2 {message.sender === 'contact'
                  ? 'bg-blue-600 text-white rounded-br-md'
                  : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'}"
              >
                <p class="text-sm whitespace-pre-wrap">{message.content}</p>
                {#if message.attachments}
                  {#each message.attachments as attachment}
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener"
                      class="mt-1 flex items-center gap-1 text-xs underline {message.sender === 'contact' ? 'text-blue-200' : 'text-blue-600'}"
                    >
                      <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                      </svg>
                      {attachment.name}
                    </a>
                  {/each}
                {/if}
                <span
                  class="block text-right text-[10px] mt-1 {message.sender === 'contact'
                    ? 'text-blue-200'
                    : 'text-gray-400'}"
                >
                  {formatTime(message.timestamp)}
                </span>
              </div>
            </div>
          {/each}

          <!-- Agent typing indicator -->
          {#if agentTyping}
            <div class="flex justify-start">
              <div class="flex items-center gap-1 rounded-2xl bg-white border border-gray-200 px-4 py-3 rounded-bl-md">
                <span class="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style="animation-delay: 0ms"></span>
                <span class="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style="animation-delay: 150ms"></span>
                <span class="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style="animation-delay: 300ms"></span>
              </div>
            </div>
          {/if}
        </div>

        <!-- Input -->
        <div class="border-t border-gray-200 p-3">
          <!-- Emoji Picker -->
          {#if showEmojiPicker}
            <div class="mb-2 grid grid-cols-8 gap-1 rounded-lg border border-gray-200 bg-white p-2 shadow-lg max-h-32 overflow-y-auto">
              {#each commonEmojis as emoji}
                <button
                  onclick={() => insertEmoji(emoji)}
                  class="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-100 text-lg"
                >
                  {emoji}
                </button>
              {/each}
            </div>
          {/if}

          <div class="flex items-end gap-2">
            <div class="flex items-center gap-0.5">
              <button
                onclick={() => showEmojiPicker = !showEmojiPicker}
                class="rounded-full p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                title="Emoji"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                </svg>
              </button>
              <button
                onclick={() => fileInput?.click()}
                class="rounded-full p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                title="Attach file"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                </svg>
              </button>
              <input
                bind:this={fileInput}
                type="file"
                class="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt"
                onchange={handleFileSelect}
              />
            </div>
            <textarea
              bind:value={inputValue}
              placeholder="Type a message..."
              rows="1"
              class="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              oninput={() => emitTyping()}
              onkeydown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            ></textarea>
            <button
              onclick={() => sendMessage()}
              disabled={!inputValue.trim()}
              class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors flex-shrink-0"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <p class="text-center text-[10px] text-gray-300 mt-2">
            Powered by Xat
          </p>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Launcher Button -->
  <button
    onclick={() => toggle()}
    class="relative flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-all hover:scale-105"
    title={launcherTitle}
  >
    {#if isOpen}
      <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    {:else}
      <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      {#if unreadCount > 0}
        <span class="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      {/if}
    {/if}
  </button>
</div>
