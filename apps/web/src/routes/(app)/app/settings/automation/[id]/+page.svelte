<script lang="ts">
  import { enhance } from "$app/forms";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const eventLabels: Record<string, string> = {
    conversation_created: "Conversation Created",
    conversation_updated: "Conversation Updated",
    message_created: "Message Created",
    conversation_opened: "Conversation Opened",
  };

  const conditionAttributes = [
    { value: "status", label: "Status" },
    { value: "inbox_id", label: "Inbox" },
    { value: "team_id", label: "Team" },
    { value: "assignee_id", label: "Assignee" },
    { value: "priority", label: "Priority" },
    { value: "content", label: "Message Content" },
    { value: "email", label: "Contact Email" },
    { value: "browser_language", label: "Browser Language" },
    { value: "country", label: "Country" },
  ];

  const operators = [
    { value: "equal_to", label: "Equal to" },
    { value: "not_equal_to", label: "Not equal to" },
    { value: "contains", label: "Contains" },
    { value: "does_not_contain", label: "Does not contain" },
  ];

  const actionTypes = [
    { value: "assign_agent", label: "Assign Agent" },
    { value: "assign_team", label: "Assign Team" },
    { value: "add_label", label: "Add Label" },
    { value: "resolve", label: "Resolve Conversation" },
    { value: "mute_conversation", label: "Mute Conversation" },
    { value: "send_message", label: "Send Message" },
    { value: "send_email_to_team", label: "Send Email Notification" },
  ];

  interface Condition {
    attribute: string;
    operator: string;
    values: string[];
  }

  interface Action {
    actionName: string;
    actionParams: string[];
  }

  let name = $state(data.rule.name);
  let description = $state(data.rule.description ?? "");
  let eventName = $state(data.rule.eventName);
  let conditions = $state<Condition[]>(
    (data.rule.conditions as Condition[]) ?? [],
  );
  let actions = $state<Action[]>((data.rule.actions as Action[]) ?? []);
  let saved = $state(false);

  function addCondition() {
    conditions = [
      ...conditions,
      { attribute: "status", operator: "equal_to", values: [""] },
    ];
  }

  function removeCondition(index: number) {
    conditions = conditions.filter((_, i) => i !== index);
  }

  function addAction() {
    actions = [...actions, { actionName: "assign_agent", actionParams: [""] }];
  }

  function removeAction(index: number) {
    actions = actions.filter((_, i) => i !== index);
  }

  function getParamOptions(actionName: string): { value: string; label: string }[] {
    switch (actionName) {
      case "assign_agent":
        return data.agents.map((a) => ({
          value: String(a.id),
          label: a.name ?? a.email,
        }));
      case "assign_team":
        return data.teams.map((t) => ({
          value: String(t.id),
          label: t.name,
        }));
      case "add_label":
        return data.labels.map((l) => ({
          value: String(l.id),
          label: l.title,
        }));
      default:
        return [];
    }
  }

  function needsParam(actionName: string): boolean {
    return ["assign_agent", "assign_team", "add_label", "send_message"].includes(actionName);
  }

  function needsTextParam(actionName: string): boolean {
    return actionName === "send_message";
  }
</script>

<div class="p-6">
  <div class="mb-6">
    <a
      href="/app/settings/automation"
      class="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
    >
      &larr; Back to Automation Rules
    </a>
  </div>

  <form
    method="POST"
    action="?/save"
    use:enhance={() => {
      return async ({ update }) => {
        await update();
        saved = true;
        setTimeout(() => (saved = false), 2000);
      };
    }}
  >
    <input type="hidden" name="conditions" value={JSON.stringify(conditions)} />
    <input type="hidden" name="actions" value={JSON.stringify(actions)} />

    {#if saved}
      <div
        class="mb-4 rounded-md bg-green-50 px-4 py-2 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400"
      >
        Rule saved successfully
      </div>
    {/if}

    <!-- Basic Info -->
    <div class="mb-6 space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      <div>
        <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >Rule Name</label
        >
        <input
          id="name"
          name="name"
          type="text"
          required
          bind:value={name}
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </div>
      <div>
        <label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >Description</label
        >
        <input
          id="description"
          name="description"
          type="text"
          bind:value={description}
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </div>
      <div>
        <label for="eventName" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >When this event happens</label
        >
        <select
          id="eventName"
          name="eventName"
          required
          bind:value={eventName}
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          {#each Object.entries(eventLabels) as [value, label]}
            <option {value}>{label}</option>
          {/each}
        </select>
      </div>
    </div>

    <!-- Conditions -->
    <div class="mb-6">
      <div class="mb-3 flex items-center justify-between">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
          Conditions (AND)
        </h3>
        <button
          type="button"
          onclick={addCondition}
          class="rounded-md border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >+ Add Condition</button
        >
      </div>

      {#if conditions.length === 0}
        <p class="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-400 dark:border-gray-600">
          No conditions — rule will match all events of this type
        </p>
      {:else}
        <div class="space-y-2">
          {#each conditions as condition, i}
            <div
              class="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700"
            >
              <select
                bind:value={condition.attribute}
                class="rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                {#each conditionAttributes as attr}
                  <option value={attr.value}>{attr.label}</option>
                {/each}
              </select>

              <select
                bind:value={condition.operator}
                class="rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                {#each operators as op}
                  <option value={op.value}>{op.label}</option>
                {/each}
              </select>

              <input
                type="text"
                bind:value={condition.values[0]}
                placeholder="Value..."
                class="flex-1 rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />

              <button
                type="button"
                onclick={() => removeCondition(i)}
                class="text-red-500 hover:text-red-700"
                title="Remove condition"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {#if i < conditions.length - 1}
              <div class="text-center text-xs font-medium text-gray-400">AND</div>
            {/if}
          {/each}
        </div>
      {/if}
    </div>

    <!-- Actions -->
    <div class="mb-6">
      <div class="mb-3 flex items-center justify-between">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Actions</h3>
        <button
          type="button"
          onclick={addAction}
          class="rounded-md border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >+ Add Action</button
        >
      </div>

      {#if actions.length === 0}
        <p class="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-400 dark:border-gray-600">
          No actions configured. Add at least one action.
        </p>
      {:else}
        <div class="space-y-2">
          {#each actions as action, i}
            <div
              class="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700"
            >
              <select
                bind:value={action.actionName}
                onchange={() => (action.actionParams = [""])}
                class="rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                {#each actionTypes as at}
                  <option value={at.value}>{at.label}</option>
                {/each}
              </select>

              {#if needsTextParam(action.actionName)}
                <input
                  type="text"
                  bind:value={action.actionParams[0]}
                  placeholder="Message text..."
                  class="flex-1 rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              {:else if needsParam(action.actionName)}
                {@const options = getParamOptions(action.actionName)}
                <select
                  bind:value={action.actionParams[0]}
                  class="flex-1 rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Select...</option>
                  {#each options as opt}
                    <option value={opt.value}>{opt.label}</option>
                  {/each}
                </select>
              {:else}
                <span class="flex-1 text-xs text-gray-400">No parameters needed</span>
              {/if}

              <button
                type="button"
                onclick={() => removeAction(i)}
                class="text-red-500 hover:text-red-700"
                title="Remove action"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Save -->
    <div class="flex justify-end">
      <button
        type="submit"
        class="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >Save Rule</button
      >
    </div>
  </form>
</div>
