<script lang="ts">
  import { enhance } from "$app/forms";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const actionTypes = [
    { value: "assign_agent", label: "Assign Agent", paramType: "agent" },
    { value: "assign_team", label: "Assign Team", paramType: "team" },
    { value: "add_label", label: "Add Label", paramType: "label" },
    { value: "resolve", label: "Resolve Conversation", paramType: "none" },
    { value: "reopen", label: "Reopen Conversation", paramType: "none" },
    { value: "snooze", label: "Snooze Conversation", paramType: "none" },
    { value: "mute", label: "Mute Conversation", paramType: "none" },
  ];

  interface MacroAction {
    type: string;
    params: Record<string, unknown>;
  }

  let name = $state(data.macro.name);
  let visibility = $state(data.macro.visibility ?? "personal");
  let actions = $state<MacroAction[]>(
    (data.macro.actions as MacroAction[]) ?? [],
  );
  let saved = $state(false);

  function addAction() {
    actions = [...actions, { type: "assign_agent", params: {} }];
  }

  function removeAction(index: number) {
    actions = actions.filter((_, i) => i !== index);
  }

  function moveAction(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= actions.length) return;
    const copy = [...actions];
    [copy[index], copy[newIndex]] = [copy[newIndex]!, copy[index]!];
    actions = copy;
  }

  function getParamType(actionType: string): string {
    return actionTypes.find((a) => a.value === actionType)?.paramType ?? "none";
  }
</script>

<div class="p-6">
  <div class="mb-6">
    <a
      href="/app/settings/macros"
      class="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
    >
      &larr; Back to Macros
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
    <input type="hidden" name="actions" value={JSON.stringify(actions)} />

    {#if saved}
      <div
        class="mb-4 rounded-md bg-green-50 px-4 py-2 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400"
      >
        Macro saved successfully
      </div>
    {/if}

    <!-- Basic Info -->
    <div class="mb-6 space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      <div class="flex gap-3">
        <div class="flex-1">
          <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >Name</label
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
          <label
            for="visibility"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300">Visibility</label
          >
          <select
            id="visibility"
            name="visibility"
            bind:value={visibility}
            class="mt-1 block rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="personal">Personal</option>
            <option value="global">Global</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="mb-6">
      <div class="mb-3 flex items-center justify-between">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
          Actions ({actions.length})
        </h3>
        <button
          type="button"
          onclick={addAction}
          class="rounded-md border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >+ Add Action</button
        >
      </div>

      {#if actions.length === 0}
        <p
          class="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-400 dark:border-gray-600"
        >
          No actions yet. Add actions that will execute in order when this macro runs.
        </p>
      {:else}
        <div class="space-y-2">
          {#each actions as action, i}
            <div
              class="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700"
            >
              <span class="w-6 text-center text-xs font-medium text-gray-400">{i + 1}</span>

              <select
                bind:value={action.type}
                onchange={() => (action.params = {})}
                class="rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                {#each actionTypes as at}
                  <option value={at.value}>{at.label}</option>
                {/each}
              </select>

              {#if getParamType(action.type) === "agent"}
                <select
                  value={String(action.params.agentId ?? "")}
                  onchange={(e) => (action.params = { agentId: parseInt(e.currentTarget.value) })}
                  class="flex-1 rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Select agent...</option>
                  {#each data.agents as agent}
                    <option value={agent.id}>{agent.name ?? agent.email}</option>
                  {/each}
                </select>
              {:else if getParamType(action.type) === "team"}
                <select
                  value={String(action.params.teamId ?? "")}
                  onchange={(e) => (action.params = { teamId: parseInt(e.currentTarget.value) })}
                  class="flex-1 rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Select team...</option>
                  {#each data.teams as team}
                    <option value={team.id}>{team.name}</option>
                  {/each}
                </select>
              {:else if getParamType(action.type) === "label"}
                <select
                  value={String(action.params.labelId ?? "")}
                  onchange={(e) => (action.params = { labelId: parseInt(e.currentTarget.value) })}
                  class="flex-1 rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Select label...</option>
                  {#each data.labels as label}
                    <option value={label.id}>{label.title}</option>
                  {/each}
                </select>
              {:else}
                <span class="flex-1 text-xs text-gray-400">No parameters</span>
              {/if}

              <div class="flex gap-1">
                <button
                  type="button"
                  onclick={() => moveAction(i, -1)}
                  disabled={i === 0}
                  class="rounded p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  title="Move up"
                >
                  <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onclick={() => moveAction(i, 1)}
                  disabled={i === actions.length - 1}
                  class="rounded p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  title="Move down"
                >
                  <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              <button
                type="button"
                onclick={() => removeAction(i)}
                class="text-red-500 hover:text-red-700"
                title="Remove"
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

    <div class="flex justify-end">
      <button
        type="submit"
        class="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >Save Macro</button
      >
    </div>
  </form>
</div>
