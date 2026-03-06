<script lang="ts">
  import { enhance } from "$app/forms";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let revoking = $state<string | null>(null);
  let revokingAll = $state(false);

  // 2FA state
  let twoFaEnabled = $state(data.twoFaEnabled ?? false);
  let twoFaStep = $state<"idle" | "setup" | "verify" | "disable">("idle");
  let twoFaSecret = $state("");
  let twoFaUri = $state("");
  let twoFaCode = $state("");
  let twoFaLoading = $state(false);
  let twoFaError = $state("");

  async function startSetup() {
    twoFaLoading = true;
    twoFaError = "";
    const res = await fetch("/api/v1/two-factor", { method: "POST" });
    const body = await res.json();
    if (!res.ok) { twoFaError = body.error ?? "Error"; twoFaLoading = false; return; }
    twoFaSecret = body.data.secret;
    twoFaUri = body.data.uri;
    twoFaStep = "setup";
    twoFaLoading = false;
  }

  async function confirmSetup() {
    twoFaLoading = true;
    twoFaError = "";
    const res = await fetch("/api/v1/two-factor", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: twoFaSecret, code: twoFaCode }),
    });
    const body = await res.json();
    if (!res.ok) { twoFaError = body.error ?? "Invalid code"; twoFaLoading = false; return; }
    twoFaEnabled = true;
    twoFaStep = "idle";
    twoFaCode = "";
    twoFaLoading = false;
  }

  async function disableTwoFa() {
    twoFaLoading = true;
    twoFaError = "";
    const res = await fetch("/api/v1/two-factor", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: twoFaCode }),
    });
    const body = await res.json();
    if (!res.ok) { twoFaError = body.error ?? "Invalid code"; twoFaLoading = false; return; }
    twoFaEnabled = false;
    twoFaStep = "idle";
    twoFaCode = "";
    twoFaLoading = false;
  }

  function parseUserAgent(ua: string | null): string {
    if (!ua) return "Unknown device";

    let browser = "Unknown browser";
    let os = "Unknown OS";

    if (ua.includes("Firefox/")) {
      browser = "Firefox";
    } else if (ua.includes("Edg/")) {
      browser = "Edge";
    } else if (ua.includes("Chrome/")) {
      browser = "Chrome";
    } else if (ua.includes("Safari/") && !ua.includes("Chrome")) {
      browser = "Safari";
    } else if (ua.includes("Opera") || ua.includes("OPR/")) {
      browser = "Opera";
    }

    if (ua.includes("Windows")) {
      os = "Windows";
    } else if (ua.includes("Mac OS X") || ua.includes("Macintosh")) {
      os = "macOS";
    } else if (ua.includes("Linux") && !ua.includes("Android")) {
      os = "Linux";
    } else if (ua.includes("Android")) {
      os = "Android";
    } else if (ua.includes("iPhone") || ua.includes("iPad")) {
      os = "iOS";
    }

    return `${browser} on ${os}`;
  }

  function formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString();
  }
</script>

<div class="p-6">
  <div class="mb-6">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Security</h2>
    <p class="text-sm text-gray-500 dark:text-gray-400">
      Manage your active sessions and security settings
    </p>
  </div>

  <!-- Two-Factor Authentication -->
  <div class="mb-6 rounded-lg border border-gray-200 dark:border-gray-700">
    <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
      <div>
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Two-Factor Authentication</h3>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Use an authenticator app (Google Authenticator, Authy) for extra security.</p>
      </div>
      <span class="rounded-full px-2.5 py-1 text-xs font-medium {twoFaEnabled ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}">
        {twoFaEnabled ? "Enabled" : "Disabled"}
      </span>
    </div>
    <div class="p-4">
      {#if twoFaStep === "idle"}
        {#if twoFaEnabled}
          <button onclick={() => twoFaStep = "disable"} class="rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20">
            Disable 2FA
          </button>
        {:else}
          <button onclick={startSetup} disabled={twoFaLoading} class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            {twoFaLoading ? "Loading…" : "Enable 2FA"}
          </button>
        {/if}

      {:else if twoFaStep === "setup"}
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Scan this QR code with your authenticator app, then enter the 6-digit code to confirm.</p>
        <div class="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
          <img
            src="https://api.qrserver.com/v1/create-qr-code/?data={encodeURIComponent(twoFaUri)}&size=180x180"
            alt="2FA QR Code"
            class="mx-auto rounded"
            width="180"
            height="180"
          />
          <p class="mt-2 text-xs text-gray-400 font-mono break-all">{twoFaSecret}</p>
        </div>
        <div class="flex gap-3 items-end">
          <div class="flex-1">
            <label for="totp-code" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Verification code</label>
            <input
              id="totp-code"
              type="text"
              inputmode="numeric"
              maxlength="6"
              bind:value={twoFaCode}
              placeholder="123456"
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white tracking-widest"
            />
          </div>
          <button onclick={confirmSetup} disabled={twoFaCode.length !== 6 || twoFaLoading} class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            {twoFaLoading ? "Verifying…" : "Confirm"}
          </button>
          <button onclick={() => twoFaStep = "idle"} class="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
        </div>
        {#if twoFaError}<p class="mt-2 text-sm text-red-600">{twoFaError}</p>{/if}

      {:else if twoFaStep === "disable"}
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Enter your authenticator code to disable 2FA.</p>
        <div class="flex gap-3 items-end">
          <div class="flex-1">
            <label for="disable-totp-code" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Verification code</label>
            <input
              id="disable-totp-code"
              type="text"
              inputmode="numeric"
              maxlength="6"
              bind:value={twoFaCode}
              placeholder="123456"
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white tracking-widest"
            />
          </div>
          <button onclick={disableTwoFa} disabled={twoFaCode.length !== 6 || twoFaLoading} class="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
            {twoFaLoading ? "Disabling…" : "Disable 2FA"}
          </button>
          <button onclick={() => twoFaStep = "idle"} class="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
        </div>
        {#if twoFaError}<p class="mt-2 text-sm text-red-600">{twoFaError}</p>{/if}
      {/if}
    </div>
  </div>

  <div class="rounded-lg border border-gray-200 dark:border-gray-700">
    <div class="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
      <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Active Sessions</h3>
      <form
        method="POST"
        action="?/revokeAll"
        use:enhance={() => {
          revokingAll = true;
          return async ({ update }) => {
            revokingAll = false;
            await update();
          };
        }}
      >
        <button
          type="submit"
          disabled={revokingAll}
          class="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {revokingAll ? "Revoking..." : "Revoke All Other Sessions"}
        </button>
      </form>
    </div>

    <div class="divide-y divide-gray-100 dark:divide-gray-700">
      {#each data.sessions as session}
        <div class="flex items-center justify-between px-4 py-3">
          <div class="flex items-center gap-4">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <svg
                class="h-5 w-5 text-gray-500 dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <p class="text-sm font-medium text-gray-900 dark:text-white">
                  {parseUserAgent(session.userAgent)}
                </p>
                {#if session.isCurrent}
                  <span class="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    Current
                  </span>
                {/if}
              </div>
              <div class="mt-0.5 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                <span>ID: {session.id}</span>
                <span>IP: {session.ipAddress ?? "Unknown"}</span>
                <span>Created: {formatDate(session.createdAt)}</span>
              </div>
            </div>
          </div>

          <div>
            {#if session.isCurrent}
              <span class="text-xs text-gray-400 dark:text-gray-500">Active</span>
            {:else}
              <form
                method="POST"
                action="?/revoke"
                use:enhance={() => {
                  revoking = session.fullId;
                  return async ({ update }) => {
                    revoking = null;
                    await update();
                  };
                }}
              >
                <input type="hidden" name="sessionId" value={session.fullId} />
                <button
                  type="submit"
                  disabled={revoking === session.fullId}
                  class="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  {revoking === session.fullId ? "Revoking..." : "Revoke"}
                </button>
              </form>
            {/if}
          </div>
        </div>
      {/each}

      {#if data.sessions.length === 0}
        <div class="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
          No active sessions found.
        </div>
      {/if}
    </div>
  </div>
</div>
