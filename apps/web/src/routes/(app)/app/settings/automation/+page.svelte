<script lang="ts">
  import { enhance } from "$app/forms";
  import * as m from "$lib/paraglide/messages";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  let showForm = $state(false);

  const eventLabels: Record<string, string> = {
    conversation_created: "Conversation Created",
    conversation_updated: "Conversation Updated",
    message_created: "Message Created",
    conversation_opened: "Conversation Opened",
  };
</script>

<div class="p-6">
  <div class="flex items-center justify-between mb-6">
    <div>
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{m.settings_automation()}</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400">{m.settings_automation_description()}</p>
    </div>
    <button
      onclick={() => (showForm = !showForm)}
      class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
    >
      {showForm ? "Cancel" : "Add Rule"}
    </button>
  </div>

  {#if showForm}
    <form
      method="POST"
      action="?/create"
      use:enhance={() => {
        return async ({ update }) => {
          await update();
          showForm = false;
        };
      }}
      class="mb-6 rounded-lg border border-gray-200 p-4 space-y-4 dark:border-gray-700"
    >
      <div>
        <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >Rule Name</label
        >
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="Auto-assign to support team"
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </div>
      <div>
        <label for="eventName" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >When</label
        >
        <select
          id="eventName"
          name="eventName"
          required
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          <option value="">Select an event...</option>
          {#each Object.entries(eventLabels) as [value, label]}
            <option {value}>{label}</option>
          {/each}
        </select>
      </div>
      <p class="text-xs text-gray-400">
        Configure conditions and actions after creating the rule.
      </p>
      <button
        type="submit"
        class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Create Rule
      </button>
    </form>
  {/if}

  <div class="space-y-2">
    {#each data.automationRules as rule}
      <div
        class="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-700"
      >
        <a
          href="/app/settings/automation/{rule.id}"
          class="flex-1 hover:underline"
        >
          <p class="text-sm font-medium text-gray-900 dark:text-white">{rule.name}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {eventLabels[rule.eventName] ?? rule.eventName}
            {#if Array.isArray(rule.conditions) && rule.conditions.length > 0}
              &middot; {rule.conditions.length} condition{rule.conditions.length !== 1 ? "s" : ""}
            {/if}
            {#if Array.isArray(rule.actions) && rule.actions.length > 0}
              &middot; {rule.actions.length} action{rule.actions.length !== 1 ? "s" : ""}
            {/if}
          </p>
        </a>
        <div class="flex items-center gap-3">
          <form method="POST" action="?/toggle" use:enhance>
            <input type="hidden" name="ruleId" value={rule.id} />
            <input type="hidden" name="active" value={String(rule.active)} />
            <button
              type="submit"
              class="rounded-full px-3 py-1 text-xs font-medium {rule.active
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}"
            >
              {rule.active ? "Active" : "Inactive"}
            </button>
          </form>
          <form method="POST" action="?/delete" use:enhance>
            <input type="hidden" name="ruleId" value={rule.id} />
            <button
              type="submit"
              class="text-xs text-red-600 hover:text-red-700 dark:text-red-400"
            >
              Delete
            </button>
          </form>
        </div>
      </div>
    {/each}

    {#if data.automationRules.length === 0}
      <p class="text-center text-sm text-gray-400 py-8">No automation rules yet</p>
    {/if}
  </div>
</div>
