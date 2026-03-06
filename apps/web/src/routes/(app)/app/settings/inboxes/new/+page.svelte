<script lang="ts">
  import { enhance } from "$app/forms";
  let { form } = $props();

  let selectedChannel = $state("web_widget");

  const channels = [
    { type: "web_widget", label: "Website", icon: "🌐", description: "Live chat widget" },
    { type: "email", label: "Email", icon: "📧", description: "IMAP / SMTP" },
    { type: "whatsapp", label: "WhatsApp", icon: "💬", description: "Baileys QR pairing" },
    { type: "telegram", label: "Telegram", icon: "✈️", description: "Bot API" },
    { type: "instagram", label: "Instagram", icon: "📸", description: "DMs via Graph API" },
    { type: "twitter", label: "X (Twitter)", icon: "🐦", description: "DMs via API v2" },
    { type: "line", label: "LINE", icon: "💚", description: "Messaging API" },
    { type: "sms", label: "SMS", icon: "📱", description: "Twilio" },
    { type: "api", label: "API", icon: "🔌", description: "Custom webhooks" },
  ];

  const inputClass = "mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300";
</script>

<div class="p-6">
  <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-6">Create Inbox</h2>

  <!-- Channel Selection -->
  <div class="mb-6">
    <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Select Channel Type</h3>
    <div class="grid grid-cols-3 gap-3 sm:grid-cols-5">
      {#each channels as ch}
        <button
          type="button"
          onclick={() => selectedChannel = ch.type}
          class="rounded-lg border-2 p-3 text-center transition-colors {selectedChannel === ch.type
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'}"
        >
          <div class="text-xl mb-1">{ch.icon}</div>
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
        <label for="name" class={labelClass}>Inbox Name</label>
        <input id="name" name="name" type="text" required placeholder="My Website" class={inputClass} />
      </div>
      <div>
        <label for="websiteUrl" class={labelClass}>Website URL</label>
        <input id="websiteUrl" name="websiteUrl" type="url" placeholder="https://example.com" class={inputClass} />
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="welcomeTitle" class={labelClass}>Welcome Title</label>
          <input id="welcomeTitle" name="welcomeTitle" type="text" placeholder="Hi there!" class={inputClass} />
        </div>
        <div>
          <label for="widgetColor" class={labelClass}>Widget Color</label>
          <input id="widgetColor" name="widgetColor" type="color" value="#1f93ff" class="mt-1 h-10 w-20 rounded" />
        </div>
      </div>
      <div>
        <label for="welcomeTagline" class={labelClass}>Tagline</label>
        <input id="welcomeTagline" name="welcomeTagline" type="text" placeholder="We make it simple to connect with us." class={inputClass} />
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
        <label for="email-name" class={labelClass}>Inbox Name</label>
        <input id="email-name" name="name" type="text" required placeholder="Support Email" class={inputClass} />
      </div>
      <div>
        <label for="email-addr" class={labelClass}>Email Address</label>
        <input id="email-addr" name="email" type="email" required placeholder="support@example.com" class={inputClass} />
      </div>

      <details class="rounded-md border border-gray-200 dark:border-gray-700">
        <summary class="cursor-pointer px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">IMAP Settings (optional)</summary>
        <div class="space-y-3 p-4 pt-2">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="imap-addr" class="block text-xs text-gray-500">IMAP Server</label>
              <input id="imap-addr" name="imapAddress" placeholder="imap.gmail.com" class={inputClass} />
            </div>
            <div>
              <label for="imap-port" class="block text-xs text-gray-500">Port</label>
              <input id="imap-port" name="imapPort" type="number" placeholder="993" class={inputClass} />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="imap-login" class="block text-xs text-gray-500">Login</label>
              <input id="imap-login" name="imapLogin" placeholder="user@gmail.com" class={inputClass} />
            </div>
            <div>
              <label for="imap-pass" class="block text-xs text-gray-500">Password</label>
              <input id="imap-pass" name="imapPassword" type="password" class={inputClass} />
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
              <input id="smtp-addr" name="smtpAddress" placeholder="smtp.gmail.com" class={inputClass} />
            </div>
            <div>
              <label for="smtp-port" class="block text-xs text-gray-500">Port</label>
              <input id="smtp-port" name="smtpPort" type="number" placeholder="587" class={inputClass} />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="smtp-login" class="block text-xs text-gray-500">Login</label>
              <input id="smtp-login" name="smtpLogin" placeholder="user@gmail.com" class={inputClass} />
            </div>
            <div>
              <label for="smtp-pass" class="block text-xs text-gray-500">Password</label>
              <input id="smtp-pass" name="smtpPassword" type="password" class={inputClass} />
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
        <label for="wa-name" class={labelClass}>Inbox Name</label>
        <input id="wa-name" name="name" type="text" required placeholder="WhatsApp Business" class={inputClass} />
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

  <!-- Telegram Form -->
  {#if selectedChannel === "telegram"}
    <form method="POST" action="?/createTelegram" use:enhance class="space-y-4">
      <div>
        <label for="tg-name" class={labelClass}>Inbox Name</label>
        <input id="tg-name" name="name" type="text" required placeholder="Telegram Support" class={inputClass} />
      </div>
      <div>
        <label for="tg-token" class={labelClass}>Bot Token</label>
        <input id="tg-token" name="botToken" type="text" required placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11" class={inputClass} />
        <p class="mt-1 text-xs text-gray-400">Get this from @BotFather on Telegram.</p>
      </div>
      <div class="flex gap-3 pt-2">
        <button type="submit" class="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600">Create Inbox</button>
        <a href="/app/settings/inboxes" class="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300">Cancel</a>
      </div>
    </form>
  {/if}

  <!-- Instagram Form -->
  {#if selectedChannel === "instagram"}
    <form method="POST" action="?/createInstagram" use:enhance class="space-y-4">
      <div>
        <label for="ig-name" class={labelClass}>Inbox Name</label>
        <input id="ig-name" name="name" type="text" required placeholder="Instagram DMs" class={inputClass} />
      </div>
      <div>
        <label for="ig-page-id" class={labelClass}>Facebook Page ID</label>
        <input id="ig-page-id" name="pageId" type="text" required placeholder="123456789" class={inputClass} />
        <p class="mt-1 text-xs text-gray-400">The Facebook Page linked to your Instagram Business account.</p>
      </div>
      <div>
        <label for="ig-token" class={labelClass}>Page Access Token</label>
        <input id="ig-token" name="pageAccessToken" type="password" required placeholder="EAA..." class={inputClass} />
        <p class="mt-1 text-xs text-gray-400">Generate from Facebook Developer Console with instagram_manage_messages permission.</p>
      </div>
      <div>
        <label for="ig-id" class={labelClass}>Instagram Account ID (optional)</label>
        <input id="ig-id" name="instagramId" type="text" placeholder="17841400123456789" class={inputClass} />
      </div>
      <div class="flex gap-3 pt-2">
        <button type="submit" class="rounded-md bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-medium text-white hover:from-purple-600 hover:to-pink-600">Create Inbox</button>
        <a href="/app/settings/inboxes" class="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300">Cancel</a>
      </div>
    </form>
  {/if}

  <!-- Twitter Form -->
  {#if selectedChannel === "twitter"}
    <form method="POST" action="?/createTwitter" use:enhance class="space-y-4">
      <div>
        <label for="tw-name" class={labelClass}>Inbox Name</label>
        <input id="tw-name" name="name" type="text" required placeholder="X (Twitter) DMs" class={inputClass} />
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="tw-key" class={labelClass}>API Key</label>
          <input id="tw-key" name="apiKey" type="text" required class={inputClass} />
        </div>
        <div>
          <label for="tw-secret" class={labelClass}>API Secret</label>
          <input id="tw-secret" name="apiSecret" type="password" required class={inputClass} />
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="tw-token" class={labelClass}>Access Token</label>
          <input id="tw-token" name="accessToken" type="text" required class={inputClass} />
        </div>
        <div>
          <label for="tw-token-secret" class={labelClass}>Access Token Secret</label>
          <input id="tw-token-secret" name="accessTokenSecret" type="password" required class={inputClass} />
        </div>
      </div>
      <div>
        <label for="tw-id" class={labelClass}>Twitter Account ID (optional)</label>
        <input id="tw-id" name="twitterAccountId" type="text" class={inputClass} />
      </div>
      <div class="flex gap-3 pt-2">
        <button type="submit" class="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">Create Inbox</button>
        <a href="/app/settings/inboxes" class="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300">Cancel</a>
      </div>
    </form>
  {/if}

  <!-- LINE Form -->
  {#if selectedChannel === "line"}
    <form method="POST" action="?/createLine" use:enhance class="space-y-4">
      <div>
        <label for="line-name" class={labelClass}>Inbox Name</label>
        <input id="line-name" name="name" type="text" required placeholder="LINE Official" class={inputClass} />
      </div>
      <div>
        <label for="line-token" class={labelClass}>Channel Access Token</label>
        <input id="line-token" name="channelAccessToken" type="password" required class={inputClass} />
        <p class="mt-1 text-xs text-gray-400">Long-lived token from the LINE Developers Console.</p>
      </div>
      <div>
        <label for="line-secret" class={labelClass}>Channel Secret</label>
        <input id="line-secret" name="channelSecret" type="password" required class={inputClass} />
      </div>
      <div>
        <label for="line-id" class={labelClass}>LINE Channel ID (optional)</label>
        <input id="line-id" name="lineChannelId" type="text" class={inputClass} />
      </div>
      <div class="flex gap-3 pt-2">
        <button type="submit" class="rounded-md bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600">Create Inbox</button>
        <a href="/app/settings/inboxes" class="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300">Cancel</a>
      </div>
    </form>
  {/if}

  <!-- SMS Form -->
  {#if selectedChannel === "sms"}
    <form method="POST" action="?/createSms" use:enhance class="space-y-4">
      <div>
        <label for="sms-name" class={labelClass}>Inbox Name</label>
        <input id="sms-name" name="name" type="text" required placeholder="SMS Support" class={inputClass} />
      </div>
      <div>
        <label for="sms-phone" class={labelClass}>Phone Number</label>
        <input id="sms-phone" name="phoneNumber" type="tel" required placeholder="+1234567890" class={inputClass} />
        <p class="mt-1 text-xs text-gray-400">Your Twilio phone number in E.164 format.</p>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="sms-sid" class={labelClass}>Account SID</label>
          <input id="sms-sid" name="accountSid" type="text" required placeholder="AC..." class={inputClass} />
        </div>
        <div>
          <label for="sms-auth" class={labelClass}>Auth Token</label>
          <input id="sms-auth" name="authToken" type="password" required class={inputClass} />
        </div>
      </div>
      <div class="flex gap-3 pt-2">
        <button type="submit" class="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Create Inbox</button>
        <a href="/app/settings/inboxes" class="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300">Cancel</a>
      </div>
    </form>
  {/if}

  <!-- API Form -->
  {#if selectedChannel === "api"}
    <form method="POST" action="?/createApi" use:enhance class="space-y-4">
      <div>
        <label for="api-name" class={labelClass}>Inbox Name</label>
        <input id="api-name" name="name" type="text" required placeholder="Custom Integration" class={inputClass} />
      </div>
      <div>
        <label for="api-webhook" class={labelClass}>Webhook URL (optional)</label>
        <input id="api-webhook" name="webhookUrl" type="url" placeholder="https://your-app.com/webhook" class={inputClass} />
        <p class="mt-1 text-xs text-gray-400">We'll send events to this URL when messages are received.</p>
      </div>
      <div class="flex gap-3 pt-2">
        <button type="submit" class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Create Inbox</button>
        <a href="/app/settings/inboxes" class="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300">Cancel</a>
      </div>
    </form>
  {/if}
</div>
