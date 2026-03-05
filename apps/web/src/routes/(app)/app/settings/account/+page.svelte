<script lang="ts">
  import { enhance } from "$app/forms";
  import type { PageData, ActionData } from "./$types";
  import * as m from "$lib/paraglide/messages";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let autoResolveEnabled = $state(data.accountDetails?.settings?.autoResolve?.enabled ?? false);
  let autoResolveDays = $state(data.accountDetails?.settings?.autoResolve?.days ?? 30);
  let deleteConfirmText = $state("");
  let copied = $state(false);

  function copyAccountId() {
    navigator.clipboard.writeText(String(data.accountDetails?.id ?? ""));
    copied = true;
    setTimeout(() => (copied = false), 2000);
  }
</script>

<div class="p-6">
  <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">{m.settings_account()}</h2>
  <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
    {m.settings_account_id_description()}
  </p>

  {#if form?.success}
    <div class="mb-4 rounded-md bg-green-50 p-4 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
      {m.settings_saved()}
    </div>
  {/if}

  {#if form?.error}
    <div class="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
      {form.error}
    </div>
  {/if}

  <!-- General Settings -->
  <form method="POST" action="?/updateAccount" use:enhance class="space-y-6">
    <div>
      <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {m.settings_account_name()}
      </label>
      <input
        id="name"
        name="name"
        type="text"
        value={data.accountDetails?.name ?? ""}
        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      />
    </div>

    <div>
      <label for="locale" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {m.settings_locale()}
      </label>
      <select
        id="locale"
        name="locale"
        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      >
        <option value="en" selected={data.accountDetails?.locale === "en"}>English (en)</option>
        <option value="es" selected={data.accountDetails?.locale === "es"}>Espa&#241;ol (es)</option>
        <option value="fr" selected={data.accountDetails?.locale === "fr"}>Fran&#231;ais (fr)</option>
        <option value="de" selected={data.accountDetails?.locale === "de"}>Deutsch (de)</option>
        <option value="pt" selected={data.accountDetails?.locale === "pt"}>Portugu&#234;s (pt)</option>
      </select>
    </div>

    <div>
      <label for="domain" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {m.settings_domain()}
      </label>
      <input
        id="domain"
        name="domain"
        type="text"
        value={data.accountDetails?.domain ?? ""}
        placeholder="support.example.com"
        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      />
    </div>

    <!-- Auto-resolve section -->
    <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-sm font-medium text-gray-900 dark:text-white">{m.settings_auto_resolve()}</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {m.settings_auto_resolve_description()}
          </p>
        </div>
        <button
          type="button"
          onclick={() => (autoResolveEnabled = !autoResolveEnabled)}
          class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 {autoResolveEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'}"
          role="switch"
          aria-checked={autoResolveEnabled}
        >
          <span
            class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {autoResolveEnabled ? 'translate-x-5' : 'translate-x-0'}"
          ></span>
        </button>
        <input type="hidden" name="autoResolveEnabled" value={autoResolveEnabled ? "true" : "false"} />
      </div>

      {#if autoResolveEnabled}
        <div class="mt-4">
          <label for="autoResolveDays" class="block text-sm text-gray-600 dark:text-gray-400">
            {m.settings_auto_resolve_days()}
          </label>
          <input
            id="autoResolveDays"
            name="autoResolveDays"
            type="number"
            min="1"
            max="999"
            bind:value={autoResolveDays}
            class="mt-1 block w-24 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
      {/if}
    </div>

    <button
      type="submit"
      class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      {m.settings_save_settings()}
    </button>
  </form>

  <!-- Account ID section -->
  <div class="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
    <h3 class="text-sm font-medium text-gray-900 dark:text-white">{m.settings_account_id()}</h3>
    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{m.settings_account_id_description()}</p>
    <div class="mt-3 flex items-center gap-3">
      <code class="rounded-md bg-gray-100 px-3 py-2 text-sm font-mono text-gray-800 dark:bg-gray-800 dark:text-gray-200">
        {data.accountDetails?.id}
      </code>
      <button
        type="button"
        onclick={copyAccountId}
        class="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        {#if copied}
          <svg class="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {m.settings_copied()}
        {:else}
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
          </svg>
          {m.btn_copy()}
        {/if}
      </button>
    </div>
  </div>

  <!-- Danger Zone: Delete Account -->
  <div class="mt-8 rounded-lg border border-red-200 dark:border-red-800 p-6">
    <h3 class="text-sm font-medium text-red-600 dark:text-red-400">{m.settings_delete_account()}</h3>
    <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
      {m.settings_delete_account_description()}
    </p>
    <form method="POST" action="?/deleteAccount" use:enhance class="mt-4">
      <div class="flex items-end gap-3">
        <div class="flex-1">
          <label for="deleteConfirm" class="block text-sm text-gray-600 dark:text-gray-400 mb-1">
            {m.settings_delete_account_confirm()}
          </label>
          <input
            id="deleteConfirm"
            name="confirmText"
            type="text"
            bind:value={deleteConfirmText}
            placeholder="DELETE"
            class="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <button
          type="submit"
          disabled={deleteConfirmText !== "DELETE"}
          class="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {m.settings_delete_account()}
        </button>
      </div>
    </form>
  </div>

  <!-- Version footer -->
  <div class="mt-8 border-t border-gray-200 dark:border-gray-700 pt-4 text-center">
    <p class="text-xs text-gray-400 dark:text-gray-500">{m.settings_version()}</p>
  </div>
</div>
