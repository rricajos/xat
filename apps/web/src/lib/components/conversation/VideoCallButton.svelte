<script lang="ts">
  interface VideoCall {
    id: number;
    roomName: string;
    roomId: string | null;
    provider: string;
    status: string;
  }

  let { conversationId }: { conversationId: number } = $props();

  let activeCall = $state<VideoCall | null>(null);
  let loading = $state(false);
  let callToken = $state<string | null>(null);
  let showCallPanel = $state(false);

  async function checkActiveCall() {
    const res = await fetch(
      `/api/v1/video-calls?conversationId=${conversationId}`,
    );
    if (res.ok) {
      const data = await res.json();
      activeCall = data.data?.active ?? null;
    }
  }

  async function startCall() {
    loading = true;
    try {
      const res = await fetch("/api/v1/video-calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId }),
      });

      if (res.ok) {
        const data = await res.json();
        activeCall = data.data;
        await joinCall();
      }
    } finally {
      loading = false;
    }
  }

  async function joinCall() {
    if (!activeCall) return;

    const res = await fetch(`/api/v1/video-calls/${activeCall.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "join" }),
    });

    if (res.ok) {
      const data = await res.json();
      callToken = data.data?.token ?? null;
      showCallPanel = true;
    }
  }

  async function endCall() {
    if (!activeCall) return;

    await fetch(`/api/v1/video-calls/${activeCall.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "end" }),
    });

    activeCall = null;
    callToken = null;
    showCallPanel = false;
  }

  $effect(() => {
    checkActiveCall();
  });
</script>

<div class="flex items-center gap-2">
  {#if showCallPanel && activeCall}
    <div class="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-1.5 dark:bg-green-900/20">
      <span class="relative flex h-2.5 w-2.5">
        <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
        <span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500"></span>
      </span>
      <span class="text-sm font-medium text-green-700 dark:text-green-400">
        Call Active
      </span>
      {#if callToken}
        <span class="text-xs text-green-600 dark:text-green-500">
          Connected via {activeCall.provider}
        </span>
      {/if}
      <button
        onclick={endCall}
        class="ml-2 rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
      >
        End Call
      </button>
    </div>
  {:else if activeCall}
    <button
      onclick={joinCall}
      class="flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
    >
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
      Join Call
    </button>
  {:else}
    <button
      onclick={startCall}
      disabled={loading}
      class="flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 disabled:opacity-50"
      title="Start video call"
    >
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
      {#if loading}
        Starting...
      {:else}
        Video Call
      {/if}
    </button>
  {/if}
</div>
