<script lang="ts">
  import { enhance } from "$app/forms";
  import type { PageData } from "./$types";
  import LanguageSwitcher from "$lib/components/layout/LanguageSwitcher.svelte";
  import * as m from "$lib/paraglide/messages";

  let { data }: { data: PageData } = $props();

  const availabilityOptions = [
    { value: 0, label: "Online", color: "bg-green-500" },
    { value: 1, label: "Busy", color: "bg-yellow-500" },
    { value: 2, label: "Offline", color: "bg-gray-400" },
  ];

  const profile = $derived(data.profile!);
  const uiSettings = $derived((profile.uiSettings ?? {}) as Record<string, unknown>);
  const notifSettings = $derived((uiSettings.notifications ?? {}) as Record<string, boolean>);
</script>

<div class="mx-auto max-w-2xl p-6">
  <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">{m.profile_title()}</h2>

  <!-- Profile Info -->
  <section class="mb-8">
    <h3 class="text-sm font-semibold uppercase text-gray-400 mb-4">Personal Information</h3>
    <form method="POST" action="?/update" use:enhance class="space-y-4">
      <div class="flex items-center gap-4 mb-4">
        <div class="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
          {(profile.displayName ?? profile.name).slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p class="font-medium text-gray-900 dark:text-white">{profile.name}</p>
          <p class="text-sm text-gray-500">{profile.email}</p>
        </div>
      </div>

      <div>
        <label for="profile-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Full Name
        </label>
        <input
          id="profile-name"
          name="name"
          type="text"
          required
          value={profile.name}
          class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </div>

      <div>
        <label for="profile-display" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Display Name
        </label>
        <input
          id="profile-display"
          name="displayName"
          type="text"
          value={profile.displayName ?? ""}
          placeholder="How you appear in conversations"
          class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </div>

      <div>
        <label for="profile-avail" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Availability
        </label>
        <div class="flex gap-3">
          {#each availabilityOptions as opt}
            <label class="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">
              <input
                type="radio"
                name="availability"
                value={opt.value}
                checked={profile.availability === opt.value}
                class="text-blue-600"
              />
              <span class="h-2.5 w-2.5 rounded-full {opt.color}"></span>
              <span class="text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
            </label>
          {/each}
        </div>
      </div>

      <button
        type="submit"
        class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Save Profile
      </button>
    </form>
  </section>

  <!-- Language -->
  <section class="mb-8">
    <h3 class="text-sm font-semibold uppercase text-gray-400 mb-4">{m.settings_locale()}</h3>
    <LanguageSwitcher />
  </section>

  <!-- Notification Preferences -->
  <section>
    <h3 class="text-sm font-semibold uppercase text-gray-400 mb-4">{m.profile_notification_prefs()}</h3>
    <form method="POST" action="?/updateNotifications" use:enhance class="space-y-3">
      {#each [
        { key: "emailOnNewConversation", label: "Email on new conversation" },
        { key: "emailOnAssignment", label: "Email on assignment" },
        { key: "emailOnMention", label: "Email on mention" },
        { key: "pushNotifications", label: "Push notifications" },
        { key: "audioAlerts", label: "Audio alerts for new messages" },
      ] as pref}
        <label class="flex items-center gap-3 rounded-md border border-gray-200 px-4 py-3 dark:border-gray-700">
          <input
            type="checkbox"
            name={pref.key}
            checked={notifSettings[pref.key] ?? false}
            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span class="text-sm text-gray-700 dark:text-gray-300">{pref.label}</span>
        </label>
      {/each}

      <button
        type="submit"
        class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Save Preferences
      </button>
    </form>
  </section>
</div>
