<script lang="ts">
  import { page } from "$app/stores";
  import { enhance } from "$app/forms";
  import type { PageData } from "./$types";
  import LanguageSwitcher from "$lib/components/layout/LanguageSwitcher.svelte";
  import * as m from "$lib/paraglide/messages";

  let { data }: { data: PageData } = $props();

  const initProfile = data.profile!;
  const initUiSettings = (initProfile.uiSettings ?? {}) as Record<string, unknown>;
  const initPublicProfile = (initUiSettings.publicProfile ?? {}) as Record<string, string>;
  const initNotif = (initUiSettings.notifications ?? {}) as Record<string, boolean>;

  const activeTab = $derived($page.url.hash.slice(1) || "online");

  // Personal info state (auto-save)
  let name = $state(initProfile.name);
  let displayName = $state(initProfile.displayName ?? "");
  let availability = $state(initProfile.availability ?? 0);
  let jobTitle = $state(initPublicProfile.jobTitle ?? "");
  let bio = $state(initPublicProfile.bio ?? "");
  let ctaType = $state(initPublicProfile.ctaType ?? "event");
  let ctaValue = $state(initPublicProfile.ctaValue ?? "");
  let ctaLabel = $state(initPublicProfile.ctaLabel ?? "");

  let profileStatus = $state<"idle" | "saving" | "saved">("idle");
  let profileTimer: ReturnType<typeof setTimeout> | null = null;

  function scheduleProfileSave() {
    if (profileTimer) clearTimeout(profileTimer);
    profileTimer = setTimeout(saveProfile, 700);
  }

  async function saveProfile() {
    profileStatus = "saving";
    const fd = new FormData();
    fd.set("name", name);
    fd.set("displayName", displayName);
    fd.set("availability", String(availability));
    fd.set("jobTitle", jobTitle);
    fd.set("bio", bio);
    fd.set("ctaType", ctaType);
    fd.set("ctaValue", ctaValue);
    fd.set("ctaLabel", ctaLabel);
    await fetch("?/update", { method: "POST", body: fd });
    profileStatus = "saved";
    setTimeout(() => { profileStatus = "idle"; }, 2000);
  }

  // Username change confirmation modal
  let pendingUsername = $state("");
  let showUsernameConfirm = $state(false);
  let keepRedirect = $state(true);
  let usernameError = $state<string | null>(null);
  let usernameSaving = $state(false);

  function requestUsernameChange(e: SubmitEvent) {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const next = (fd.get("calendarUsername") as string ?? "").trim().toLowerCase();
    if (!next || next === initProfile.calendarUsername) return;
    pendingUsername = next;
    showUsernameConfirm = true;
  }

  async function confirmUsernameChange() {
    usernameSaving = true;
    usernameError = null;
    const fd = new FormData();
    fd.set("calendarUsername", pendingUsername);
    if (keepRedirect) fd.set("keepRedirect", "on");
    const res = await fetch("?/updateCalendar", { method: "POST", body: fd });
    const json = await res.json().catch(() => ({}));
    usernameSaving = false;
    if (json?.data?.calendarError) {
      usernameError = json.data.calendarError;
    } else {
      showUsernameConfirm = false;
      // Reload to reflect new username everywhere
      window.location.reload();
    }
  }

  // Notifications (auto-save on toggle)
  let notif = $state({ ...initNotif });
  let notifSaving = $state(false);

  async function saveNotif() {
    notifSaving = true;
    const fd = new FormData();
    for (const [k, v] of Object.entries(notif)) {
      if (v) fd.set(k, "on");
    }
    await fetch("?/updateNotifications", { method: "POST", body: fd });
    notifSaving = false;
  }

  const notifPrefs = [
    { key: "emailOnNewConversation", label: "Email on new conversation" },
    { key: "emailOnAssignment", label: "Email on assignment" },
    { key: "emailOnMention", label: "Email on mention" },
    { key: "pushNotifications", label: "Push notifications" },
    { key: "audioAlerts", label: "Audio alerts for new messages" },
  ];

  const availabilityOptions = [
    { value: 0, label: "Online", color: "bg-green-500" },
    { value: 1, label: "Busy", color: "bg-yellow-500" },
    { value: 2, label: "Offline", color: "bg-gray-400" },
  ];

  const ctaTypes = [
    { value: "event", label: "Calendar event" },
    { value: "whatsapp", label: "WhatsApp" },
    { value: "email", label: "Email" },
    { value: "url", label: "Custom URL" },
  ];

  const locationIcons: Record<string, string> = {
    VIDEO_DYTE: "📹", VIDEO_GOOGLE_MEET: "📹", VIDEO_ZOOM: "📹",
    PHONE: "📞", IN_PERSON: "📍", CUSTOM: "🔗",
  };

  const publicUrl = $derived(
    initProfile.calendarUsername ? `${$page.url.origin}/${initProfile.calendarUsername}` : null
  );

  let copied = $state(false);
  function copyUrl() {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    copied = true;
    setTimeout(() => { copied = false; }, 2000);
  }
</script>

<!-- ONLINE: full-height iframe of the public profile -->
{#if activeTab === "online"}
  <div class="flex h-full flex-col">
    {#if publicUrl}
      <!-- Top bar -->
      <div class="flex items-center gap-3 border-b border-gray-200 bg-gray-50 px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
        <div class="flex flex-1 items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-mono text-gray-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-400">
          <svg class="h-3.5 w-3.5 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
          </svg>
          <span class="truncate">{publicUrl}</span>
        </div>
        <button type="button" onclick={copyUrl}
          class="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-white dark:border-gray-600 dark:text-gray-400">
          {copied ? "Copied!" : "Copy"}
        </button>
        <a href={publicUrl} target="_blank" rel="noopener"
          class="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-white dark:border-gray-600 dark:text-gray-400">
          Open ↗
        </a>
      </div>
      <iframe
        src={publicUrl}
        title="Public profile preview"
        class="flex-1 w-full border-0"
      ></iframe>
    {:else}
      <div class="flex h-full flex-col items-center justify-center gap-3 text-center p-8">
        <div class="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
          <svg class="h-7 w-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
          </svg>
        </div>
        <p class="text-sm font-medium text-gray-700 dark:text-gray-300">No public profile yet</p>
        <p class="text-xs text-gray-400">Set a username to get your public URL and see how visitors see you.</p>
        <a href="/app/profile#username"
          class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Set username
        </a>
      </div>
    {/if}
  </div>

<!-- PERSONAL INFORMATION -->
{:else if activeTab === "personal"}
  <div class="max-w-xl p-6">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Personal Information</h2>
      {#if profileStatus === "saving"}
        <span class="text-xs text-gray-400">Saving…</span>
      {:else if profileStatus === "saved"}
        <span class="text-xs text-green-600 dark:text-green-400">Saved</span>
      {/if}
    </div>

    <div class="space-y-5">
      <div>
        <label for="profile-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
        <input id="profile-name" type="text" bind:value={name} oninput={scheduleProfileSave}
          class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
      </div>

      <div>
        <label for="profile-display" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Display Name</label>
        <p class="text-xs text-gray-400 mb-1">How you appear in conversations</p>
        <input id="profile-display" type="text" bind:value={displayName} oninput={scheduleProfileSave}
          placeholder="e.g. Carlos"
          class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
      </div>

      <div>
        <label for="profile-title" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Job Title</label>
        <p class="text-xs text-gray-400 mb-1">Shown on your public profile</p>
        <input id="profile-title" type="text" bind:value={jobTitle} oninput={scheduleProfileSave}
          placeholder="e.g. Senior Support Agent"
          class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
      </div>

      <div>
        <label for="profile-bio" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Bio</label>
        <p class="text-xs text-gray-400 mb-1">Shown on your public profile</p>
        <textarea id="profile-bio" bind:value={bio} oninput={scheduleProfileSave} rows="3"
          placeholder="Tell visitors a bit about yourself…"
          class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white resize-none"
        ></textarea>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Availability</label>
        <div class="flex gap-3">
          {#each availabilityOptions as opt}
            <label class="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">
              <input type="radio" value={opt.value} checked={availability === opt.value}
                onchange={() => { availability = opt.value; saveProfile(); }} class="text-blue-600" />
              <span class="h-2.5 w-2.5 rounded-full {opt.color}"></span>
              <span class="text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
            </label>
          {/each}
        </div>
      </div>

      <!-- CTA -->
      <div class="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
        <div>
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Profile CTA button</p>
          <p class="text-xs text-gray-400 mt-0.5">What visitors see when they click your call-to-action.</p>
        </div>

        <div class="flex gap-2 flex-wrap">
          {#each ctaTypes as t}
            <button type="button"
              onclick={() => { ctaType = t.value; ctaValue = ""; scheduleProfileSave(); }}
              class="rounded-full border px-3 py-1 text-xs font-medium transition-colors {ctaType === t.value
                ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : 'border-gray-300 text-gray-500 hover:border-gray-400 dark:border-gray-600 dark:text-gray-400'}">
              {#if t.value === "event"}📅{:else if t.value === "whatsapp"}💬{:else if t.value === "email"}✉️{:else}🔗{/if}
              {t.label}
            </button>
          {/each}
        </div>

        {#if ctaType === "event"}
          {#if data.eventTypes.length > 0}
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Select event</label>
              <select bind:value={ctaValue} onchange={scheduleProfileSave}
                class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                <option value="">— choose an event type —</option>
                {#each data.eventTypes as et}
                  <option value={et.slug}>{locationIcons[et.locationType] ?? "📅"} {et.name} · {et.duration} min</option>
                {/each}
              </select>
            </div>
          {:else}
            <p class="text-xs text-amber-600 dark:text-amber-400">
              You have no active event types yet.
              <a href="/app/calendar/event-types" class="underline">Create one in Calendar →</a>
            </p>
          {/if}
        {:else if ctaType === "whatsapp"}
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">WhatsApp number (with country code)</label>
            <div class="flex rounded-md shadow-sm">
              <span class="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 px-3 text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-700">+</span>
              <input type="tel" bind:value={ctaValue} oninput={scheduleProfileSave} placeholder="34 612 345 678"
                class="block w-full rounded-r-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
            </div>
          </div>
        {:else if ctaType === "email"}
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Email address</label>
            <input type="email" bind:value={ctaValue} oninput={scheduleProfileSave} placeholder={initProfile.email}
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
          </div>
        {:else if ctaType === "url"}
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">URL</label>
            <input type="url" bind:value={ctaValue} oninput={scheduleProfileSave} placeholder="https://…"
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
          </div>
        {/if}

        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Button label <span class="text-gray-400 font-normal">(optional)</span>
          </label>
          <input type="text" bind:value={ctaLabel} oninput={scheduleProfileSave}
            placeholder="e.g. Book a free call, Chat on WhatsApp…"
            class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
        </div>
      </div>
    </div>
  </div>

<!-- LANGUAGE -->
{:else if activeTab === "language"}
  <div class="max-w-xl p-6">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-6">{m.settings_locale()}</h2>
    <LanguageSwitcher />
  </div>

<!-- USERNAME -->
{:else if activeTab === "username"}
  <div class="max-w-xl p-6">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">Username</h2>
    <p class="text-sm text-gray-500 dark:text-gray-400 mb-5">
      Your unique handle on the platform. It determines your public profile URL and is visible to anyone you share it with.
    </p>

    <!-- Info cards -->
    <div class="mb-6 space-y-3">
      <div class="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/50">
        <p class="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">Your public profile</p>
        {#if initProfile.calendarUsername}
          <div class="flex items-center gap-2">
            <span class="font-mono text-sm text-blue-600 dark:text-blue-400">
              {$page.url.origin}/<strong>{initProfile.calendarUsername}</strong>
            </span>
            <a href="/{initProfile.calendarUsername}" target="_blank" rel="noopener"
              class="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">↗ open</a>
          </div>
          <p class="mt-1 text-xs text-gray-400">This is your public page — anyone with this link can see your profile and contact you.</p>
        {:else}
          <p class="text-sm text-gray-500 dark:text-gray-400 italic">Not set yet — choose a username below to activate your public page.</p>
        {/if}
      </div>

      <div class="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/50">
        <p class="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">Booking links</p>
        {#if initProfile.calendarUsername}
          <ul class="space-y-1 text-xs font-mono text-gray-500 dark:text-gray-400">
            <li><span class="text-gray-400">/{initProfile.calendarUsername}</span> — your profile page</li>
            <li><span class="text-gray-400">/{initProfile.calendarUsername}/<em>event-slug</em></span> — a specific booking page</li>
          </ul>
          <p class="mt-2 text-xs text-gray-400">You can create event types in <a href="/app/calendar/event-types" class="text-blue-500 hover:underline">Calendar → Event types</a> and each one gets its own bookable URL.</p>
        {:else}
          <p class="text-xs text-gray-400 italic">Booking links will appear here once you set a username.</p>
        {/if}
      </div>

      <div class="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 dark:border-amber-900/30 dark:bg-amber-900/10">
        <p class="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-500 mb-1">Changing your username</p>
        <p class="text-xs text-amber-700 dark:text-amber-400">If you change your username, any existing links shared with clients will break. Make sure to update them.</p>
      </div>
    </div>

    <form onsubmit={requestUsernameChange} class="space-y-4">
      <div>
        <label for="cal-username" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
        <div class="mt-1 flex rounded-md shadow-sm">
          <span class="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 px-3 text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400">@</span>
          <input id="cal-username" name="calendarUsername" type="text"
            value={initProfile.calendarUsername ?? ""} placeholder="your-username" pattern="[a-z0-9-]{3,50}"
            class="block w-full rounded-r-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
        </div>
        <p class="mt-1 text-xs text-gray-400">Lowercase letters, numbers and hyphens, 3–50 characters.</p>
      </div>
      <button type="submit" class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
        Save username
      </button>
    </form>
  </div>

  <!-- Confirmation modal -->
  {#if showUsernameConfirm}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div class="w-full max-w-md rounded-xl bg-white shadow-xl dark:bg-gray-900 p-6 mx-4">
        <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-1">Change username?</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-5">
          You are changing your username from
          <span class="font-mono font-semibold text-gray-700 dark:text-gray-300">@{initProfile.calendarUsername}</span>
          to
          <span class="font-mono font-semibold text-blue-600 dark:text-blue-400">@{pendingUsername}</span>.
        </p>

        <div class="rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-5 space-y-3">
          <label class="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" bind:checked={keepRedirect} class="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <div>
              <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Keep redirect for 99 days</p>
              <p class="text-xs text-gray-400 mt-0.5">
                Visitors going to
                <span class="font-mono">/{initProfile.calendarUsername}</span>
                will be automatically sent to
                <span class="font-mono">/{pendingUsername}</span>
                during that period. After 99 days the old username is released.
              </p>
            </div>
          </label>
          {#if !keepRedirect}
            <p class="text-xs text-amber-600 dark:text-amber-400 pl-7">
              Without a redirect, anyone using your old link will get a 404 immediately.
            </p>
          {/if}
        </div>

        {#if usernameError}
          <p class="mb-4 text-sm text-red-600 dark:text-red-400">{usernameError}</p>
        {/if}

        <div class="flex justify-end gap-3">
          <button type="button" onclick={() => { showUsernameConfirm = false; usernameError = null; }}
            class="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
            Cancel
          </button>
          <button type="button" onclick={confirmUsernameChange} disabled={usernameSaving}
            class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
            {usernameSaving ? "Saving…" : "Confirm change"}
          </button>
        </div>
      </div>
    </div>
  {/if}

<!-- NOTIFICATIONS -->
{:else if activeTab === "notifications"}
  <div class="max-w-xl p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{m.profile_notification_prefs()}</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Changes save automatically.</p>
      </div>
      {#if notifSaving}<span class="text-xs text-gray-400">Saving…</span>{/if}
    </div>
    <div class="space-y-3">
      {#each notifPrefs as pref}
        <label class="flex items-center gap-3 rounded-md border border-gray-200 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50">
          <input type="checkbox" bind:checked={notif[pref.key]} onchange={saveNotif}
            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          <span class="text-sm text-gray-700 dark:text-gray-300">{pref.label}</span>
        </label>
      {/each}
    </div>
  </div>
{/if}
