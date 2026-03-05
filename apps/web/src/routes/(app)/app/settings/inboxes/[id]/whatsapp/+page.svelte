<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let qrCode = $state<string | null>(null);
  let status = $state<string>("disconnected");
  let error = $state<string | null>(null);
  let eventSource: EventSource | null = null;

  onMount(() => {
    // Connect to SSE endpoint for QR code streaming
    eventSource = new EventSource(`/api/v1/channels/whatsapp/qr?inboxId=${data.inbox.id}`);

    eventSource.addEventListener("qr", (e) => {
      qrCode = e.data;
      status = "waiting_qr";
      error = null;
    });

    eventSource.addEventListener("status", (e) => {
      status = e.data;
      if (status === "connected") {
        qrCode = null;
      }
    });

    eventSource.addEventListener("error", (e) => {
      if (e instanceof MessageEvent) {
        error = e.data;
      }
    });

    eventSource.onerror = () => {
      if (eventSource?.readyState === EventSource.CLOSED) {
        error = "Connection lost. Please refresh the page.";
      }
    };
  });

  onDestroy(() => {
    eventSource?.close();
  });

  const statusInfo: Record<string, { label: string; color: string }> = {
    disconnected: { label: "Disconnected", color: "text-gray-500" },
    waiting_qr: { label: "Waiting for QR scan...", color: "text-yellow-600" },
    connecting: { label: "Connecting...", color: "text-blue-600" },
    connected: { label: "Connected", color: "text-green-600" },
  };
</script>

<div class="p-6">
  <div class="mb-6">
    <a href="/app/settings/inboxes" class="text-sm text-blue-600 hover:text-blue-700">
      ← Back to Inboxes
    </a>
  </div>

  <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
    Connect WhatsApp
  </h2>
  <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
    Scan the QR code below with your WhatsApp app to connect <strong>{data.inbox.name}</strong>.
  </p>

  <!-- Status Badge -->
  <div class="mb-4 flex items-center gap-2">
    <span class="text-sm font-medium {statusInfo[status]?.color ?? 'text-gray-500'}">
      {statusInfo[status]?.label ?? status}
    </span>
    {#if status === "connected"}
      <span class="flex h-2.5 w-2.5 rounded-full bg-green-500"></span>
    {/if}
  </div>

  {#if error}
    <div class="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
      {error}
    </div>
  {/if}

  <!-- QR Code Display -->
  {#if status === "connected"}
    <div class="rounded-lg border border-green-200 bg-green-50 p-8 text-center dark:border-green-800 dark:bg-green-900/20">
      <div class="mb-3 text-4xl">✅</div>
      <h3 class="text-lg font-semibold text-green-800 dark:text-green-300">WhatsApp Connected!</h3>
      <p class="mt-2 text-sm text-green-600 dark:text-green-400">
        Your WhatsApp number is now linked. Incoming messages will appear in the inbox.
      </p>
      <a
        href="/app/settings/inboxes"
        class="mt-4 inline-block rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
      >
        Go to Inboxes
      </a>
    </div>
  {:else if qrCode}
    <div class="flex flex-col items-center rounded-lg border border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-800">
      <div class="mb-4 rounded-lg bg-white p-4">
        <img
          src="https://api.qrserver.com/v1/create-qr-code/?size=256x256&data={encodeURIComponent(qrCode)}"
          alt="WhatsApp QR Code"
          class="h-64 w-64"
        />
      </div>
      <p class="text-sm text-gray-500 dark:text-gray-400 text-center">
        Open WhatsApp on your phone → Settings → Linked Devices → Link a Device
      </p>
      <p class="mt-2 text-xs text-gray-400">
        The QR code refreshes automatically. Do not close this page.
      </p>
    </div>
  {:else}
    <div class="flex flex-col items-center rounded-lg border border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-800">
      <div class="mb-4 h-64 w-64 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-700"></div>
      <p class="text-sm text-gray-500">Generating QR code...</p>
    </div>
  {/if}

  <!-- Instructions -->
  <div class="mt-6 rounded-md bg-gray-50 p-4 dark:bg-gray-800">
    <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">How to connect:</h4>
    <ol class="space-y-1 text-sm text-gray-500 dark:text-gray-400 list-decimal list-inside">
      <li>Open WhatsApp on your phone</li>
      <li>Go to Settings → Linked Devices</li>
      <li>Tap "Link a Device"</li>
      <li>Scan the QR code above</li>
    </ol>
  </div>
</div>
