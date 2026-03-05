<script lang="ts">
  import { enhance } from "$app/forms";
  let { form } = $props();

  let selectedChannel = $state("web_widget");

  const channels = [
    { type: "web_widget", label: "Website", icon: "🌐", description: "Live chat widget" },
    { type: "email", label: "Email", icon: "📧", description: "IMAP / SMTP" },
    { type: "whatsapp", label: "WhatsApp", icon: "💬", description: "Baileys QR pairing" },
    { type: "api", label: "API", icon: "🔌", description: "Custom webhooks" },
  ];
</script>

<div class="p-6">
  <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-6">Create Inbox</h2>

  <!-- Channel Selection -->
  <div class="mb-6">
    <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Select Channel Type</h3>
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {#each channels as ch}
        <button
          type="button"
          onclick={() => selectedChannel = ch.type}
          class="rounded-lg border-2 p-4 text-center transition-colors {selectedChannel === ch.type
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'}"
        >
          <div class="text-2xl mb-1">{ch.icon}</div>
          <p class="text-xs font-medium {selectedChannel === ch.type ? 'text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}">{ch.label}</p>
          <p class="text-[10px] text-gray-400 mt-0.5">{ch.description}</p>
        </button>
      {/each}
    </div>
  </div>

  {#if form?.error}
    <div class="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
      {form.error}
    </div>
  {/if}

  <!-- Web Widget Form -->
  {#if selectedChannel === "web_widget"}
    <form method="POST" action="?/createWebWidget" use:enhance class="space-y-4">
      <div>
        <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Inbox Name</label>
        <input id="name" name="name" type="text" required placeholder="My Website"
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
      </div>
      <div>
        <label for="websiteUrl" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Website URL</label>
        <input id="websiteUrl" name="websiteUrl" type="url" placeholder="https://example.com"
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="welcomeTitle" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Welcome Title</label>
          <input id="welcomeTitle" name="welcomeTitle" type="text" placeholder="Hi there!"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
        </div>
        <div>
          <label for="widgetColor" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Widget Color</label>
          <input id="widgetColor" name="widgetColor" type="color" value="#1f93ff" class="mt-1 h-10 w-20 rounded" />
        </div>
      </div>
      <div>
        <label for="welcomeTagline" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Tagline</label>
        <input id="welcomeTagline" name="welcomeTagline" type="text" placeholder="We make it simple to connect with us."
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
      </div>
      <div class="flex gap-3 pt-2">
        <button type="submit" class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Create Inbox</button>
        <a href="/app/settings/inboxes" class="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300">Cancel</a>
      </div>
    </form>
  {/if}

  <!-- Email Form -->
  {#if selectedChannel === "email"}
    <form method="POST" action="?/createEmail" use:enhance class="space-y-4">
      <div>
        <label for="email-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Inbox Name</label>
        <input id="email-name" name="name" type="text" required placeholder="Support Email"
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
      </div>
      <div>
        <label for="email-addr" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
        <input id="email-addr" name="email" type="email" required placeholder="support@example.com"
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
      </div>

      <details class="rounded-md border border-gray-200 dark:border-gray-700">
        <summary class="cursor-pointer px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">IMAP Settings (optional)</summary>
        <div class="space-y-3 p-4 pt-2">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="imap-addr" class="block text-xs text-gray-500">IMAP Server</label>
              <input id="imap-addr" name="imapAddress" placeholder="imap.gmail.com"
                class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
            </div>
            <div>
              <label for="imap-port" class="block text-xs text-gray-500">Port</label>
              <input id="imap-port" name="imapPort" type="number" placeholder="993"
                class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="imap-login" class="block text-xs text-gray-500">Login</label>
              <input id="imap-login" name="imapLogin" placeholder="user@gmail.com"
                class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
            </div>
            <div>
              <label for="imap-pass" class="block text-xs text-gray-500">Password</label>
              <input id="imap-pass" name="imapPassword" type="password"
                class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
            </div>
          </div>
        </div>
      </details>

      <details class="rounded-md border border-gray-200 dark:border-gray-700">
        <summary class="cursor-pointer px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">SMTP Settings (optional)</summary>
        <div class="space-y-3 p-4 pt-2">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="smtp-addr" class="block text-xs text-gray-500">SMTP Server</label>
              <input id="smtp-addr" name="smtpAddress" placeholder="smtp.gmail.com"
                class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
            </div>
            <div>
              <label for="smtp-port" class="block text-xs text-gray-500">Port</label>
              <input id="smtp-port" name="smtpPort" type="number" placeholder="587"
                class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="smtp-login" class="block text-xs text-gray-500">Login</label>
              <input id="smtp-login" name="smtpLogin" placeholder="user@gmail.com"
                class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
            </div>
            <div>
              <label for="smtp-pass" class="block text-xs text-gray-500">Password</label>
              <input id="smtp-pass" name="smtpPassword" type="password"
                class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
            </div>
          </div>
        </div>
      </details>

      <div class="flex gap-3 pt-2">
        <button type="submit" class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Create Inbox</button>
        <a href="/app/settings/inboxes" class="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300">Cancel</a>
      </div>
    </form>
  {/if}

  <!-- WhatsApp Form -->
  {#if selectedChannel === "whatsapp"}
    <form method="POST" action="?/createWhatsApp" use:enhance class="space-y-4">
      <div>
        <label for="wa-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Inbox Name</label>
        <input id="wa-name" name="name" type="text" required placeholder="WhatsApp Business"
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
      </div>
      <div class="rounded-md bg-green-50 p-4 dark:bg-green-900/20">
        <p class="text-sm text-green-800 dark:text-green-300">
          After creating the inbox, you'll be redirected to scan the QR code with your WhatsApp app to connect your phone number.
        </p>
      </div>
      <div class="flex gap-3 pt-2">
        <button type="submit" class="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">Create & Connect</button>
        <a href="/app/settings/inboxes" class="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300">Cancel</a>
      </div>
    </form>
  {/if}

  <!-- API Form -->
  {#if selectedChannel === "api"}
    <form method="POST" action="?/createApi" use:enhance class="space-y-4">
      <div>
        <label for="api-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Inbox Name</label>
        <input id="api-name" name="name" type="text" required placeholder="Custom Integration"
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
      </div>
      <div>
        <label for="api-webhook" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Webhook URL (optional)</label>
        <input id="api-webhook" name="webhookUrl" type="url" placeholder="https://your-app.com/webhook"
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
        <p class="mt-1 text-xs text-gray-400">We'll send events to this URL when messages are received.</p>
      </div>
      <div class="flex gap-3 pt-2">
        <button type="submit" class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Create Inbox</button>
        <a href="/app/settings/inboxes" class="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300">Cancel</a>
      </div>
    </form>
  {/if}
</div>
