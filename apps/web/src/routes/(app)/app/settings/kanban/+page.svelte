<script lang="ts">
  import { enhance } from "$app/forms";
  import { goto } from "$app/navigation";
  import * as m from "$lib/paraglide/messages";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let editingStageId = $state<number | null>(null);
  let showAddStage = $state(false);
  let showBoardSettings = $state(false);
  let showCreateBoard = $state(false);

  // Editing state for stage
  let editMacroIds = $state<number[]>([]);
  let editConditions = $state<Array<{ attribute: string; operator: string; value: string }>>([]);
  let showMacroDropdown = $state(false);

  function startEditStage(stage: typeof data.stages[0]) {
    editingStageId = stage.id;
    // macroActions now stores macro IDs (array of { macroId: number })
    const actions = (stage.macroActions ?? []) as Array<{ macroId?: number; type?: string }>;
    editMacroIds = actions.filter((a) => a.macroId).map((a) => a.macroId!);
    editConditions = [...((stage.macroConditions ?? []) as typeof editConditions)];
    showMacroDropdown = false;
  }

  function cancelEdit() {
    editingStageId = null;
    editMacroIds = [];
    editConditions = [];
    showMacroDropdown = false;
  }

  function toggleMacro(macroId: number) {
    if (editMacroIds.includes(macroId)) {
      editMacroIds = editMacroIds.filter((id) => id !== macroId);
    } else {
      editMacroIds = [...editMacroIds, macroId];
    }
  }

  function removeMacro(macroId: number) {
    editMacroIds = editMacroIds.filter((id) => id !== macroId);
  }

  function addCondition() {
    editConditions = [...editConditions, { attribute: "status", operator: "equal", value: "" }];
  }

  function removeCondition(index: number) {
    editConditions = editConditions.filter((_, i) => i !== index);
  }

  function getMacroName(macroId: number): string {
    return data.macros.find((m) => m.id === macroId)?.name ?? `Macro #${macroId}`;
  }

  // Convert macro IDs to the macroActions format the server expects
  function macroIdsToActions(): string {
    return JSON.stringify(editMacroIds.map((id) => ({ macroId: id })));
  }

  function selectBoard(boardId: number) {
    goto(`/app/settings/kanban?board=${boardId}`);
  }

  const operators = [
    { value: "equal", label: () => m.condition_equal() },
    { value: "not_equal", label: () => m.condition_not_equal() },
    { value: "contains", label: () => m.condition_contains() },
    { value: "is_present", label: () => m.condition_is_present() },
    { value: "is_not_present", label: () => m.condition_is_not_present() },
  ];

  const baseConditionAttributes = [
    { value: "status", label: () => m.condition_status() },
    { value: "priority", label: () => m.condition_priority() },
    { value: "assigneeId", label: () => m.condition_assignee() },
  ];

  // Merge custom attributes into condition attributes
  let conditionAttributes = $derived([
    ...baseConditionAttributes,
    ...data.customAttributes.map((ca) => ({
      value: `custom_attribute.${ca.key}`,
      label: () => `${ca.displayName}`,
    })),
  ]);

  const stageColors = [
    "#6b7280", "#ef4444", "#f59e0b", "#10b981", "#3b82f6",
    "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16", "#f97316",
  ];
</script>

<div class="p-6">
  <div class="mb-6 flex items-center justify-between">
    <div>
      <h2 class="text-xl font-bold text-gray-900 dark:text-white">{m.kanban_title()}</h2>
      {#if data.activeBoard}
        <p class="mt-1 text-sm text-gray-500">{data.activeBoard.name}</p>
      {/if}
    </div>
    <div class="flex items-center gap-2">
      {#if data.activeBoard}
        <button
          onclick={() => (showBoardSettings = !showBoardSettings)}
          class="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          {m.kanban_settings()}
        </button>
      {/if}
      <a href="/app/tickets" class="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
        {m.btn_back()} {m.tickets_title()}
      </a>
    </div>
  </div>

  <!-- Board selector tabs -->
  <div class="mb-6 flex border-b border-gray-200 dark:border-gray-700">
    {#each data.boards as board}
      <button
        onclick={() => selectBoard(board.id)}
        class="border-b-2 -mb-px px-4 py-2 text-sm font-medium transition-colors {data.activeBoard?.id === board.id
          ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}"
      >
        {board.name}
      </button>
    {/each}
    <button
      onclick={() => (showCreateBoard = !showCreateBoard)}
      class="ml-1 flex items-center gap-1 px-3 py-2 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
    >
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      {m.kanban_new_board()}
    </button>
  </div>

  <!-- Create new board inline -->
  {#if showCreateBoard}
    <div class="mb-6 rounded-lg border border-dashed border-gray-300 bg-white p-4 dark:border-gray-600 dark:bg-gray-800">
      <form
        method="POST"
        action="?/createBoard"
        use:enhance={() => {
          return async ({ update }) => {
            await update();
            showCreateBoard = false;
          };
        }}
        class="flex items-end gap-3"
      >
        <div class="flex-1">
          <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">{m.kanban_new_board()}</label>
          <input
            name="name"
            type="text"
            required
            placeholder={m.kanban_new_board()}
            class="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <button type="submit" class="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
          {m.btn_create()}
        </button>
        <button type="button" onclick={() => (showCreateBoard = false)} class="text-xs text-gray-500">
          {m.btn_cancel()}
        </button>
      </form>
    </div>
  {/if}

  <!-- Board settings -->
  {#if showBoardSettings && data.activeBoard}
    <div class="mb-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">{m.kanban_settings()}</h3>
      <form
        method="POST"
        action="?/updateBoard"
        use:enhance
        class="mb-4 flex gap-3"
      >
        <input type="hidden" name="boardId" value={data.activeBoard.id} />
        <input
          name="name"
          type="text"
          required
          value={data.activeBoard.name}
          class="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
        <button type="submit" class="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
          {m.btn_save()}
        </button>
      </form>
      <form
        method="POST"
        action="?/deleteBoard"
        use:enhance={() => {
          return async ({ result }) => {
            if (result.type === "success") goto("/app/settings/kanban");
          };
        }}
      >
        <input type="hidden" name="boardId" value={data.activeBoard.id} />
        <button
          type="submit"
          class="text-xs text-red-500 hover:text-red-700"
          onclick={(e) => {
            if (!confirm(m.confirm_delete())) e.preventDefault();
          }}
        >
          {m.kanban_delete_board()}
        </button>
      </form>
    </div>
  {/if}

  <!-- Stages list -->
  {#if data.activeBoard}
    <div class="space-y-3">
      {#each data.stages as stage, index}
        <div class="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          {#if editingStageId === stage.id}
            <!-- Edit mode -->
            <form
              method="POST"
              action="?/updateStage"
              use:enhance={() => {
                return async ({ update }) => {
                  await update();
                  cancelEdit();
                };
              }}
              class="p-5"
            >
              <input type="hidden" name="stageId" value={stage.id} />
              <input type="hidden" name="macroActions" value={macroIdsToActions()} />
              <input type="hidden" name="macroConditions" value={JSON.stringify(editConditions)} />

              <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">{m.kanban_stage_name()}</label>
                  <input
                    name="name"
                    type="text"
                    required
                    value={stage.name}
                    class="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">{m.kanban_stage_color()}</label>
                  <div class="flex gap-1.5">
                    {#each stageColors as c}
                      <label class="cursor-pointer">
                        <input type="radio" name="color" value={c} checked={stage.color === c} class="sr-only" />
                        <span
                          class="block h-6 w-6 rounded-full border-2 transition-all {stage.color === c ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent hover:scale-110'}"
                          style="background-color: {c}"
                        ></span>
                      </label>
                    {/each}
                  </div>
                </div>
              </div>

              <div class="mb-4">
                <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">{m.kanban_stage_description()}</label>
                <input
                  name="description"
                  type="text"
                  value={stage.description ?? ""}
                  class="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <!-- Macro picker -->
              <div class="mb-4">
                <div class="mb-2">
                  <label class="text-xs font-medium text-gray-600 dark:text-gray-400">{m.kanban_stage_macros()}</label>
                  <p class="text-[11px] text-gray-400">{m.kanban_stage_macros_description()}</p>
                </div>

                {#if data.macros.length === 0}
                  <p class="text-xs text-gray-400 italic">{m.kanban_no_macros()}</p>
                {:else}
                  <!-- Selected macros as chips -->
                  {#if editMacroIds.length > 0}
                    <div class="mb-2 flex flex-wrap gap-1.5">
                      {#each editMacroIds as macroId}
                        <span class="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          {getMacroName(macroId)}
                          <button type="button" onclick={() => removeMacro(macroId)} class="ml-0.5 text-blue-500 hover:text-blue-700">
                            <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      {/each}
                    </div>
                  {/if}

                  <!-- Macro dropdown toggle -->
                  <div class="relative">
                    <button
                      type="button"
                      onclick={() => (showMacroDropdown = !showMacroDropdown)}
                      class="flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-1.5 text-left text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    >
                      <span>
                        {#if editMacroIds.length > 0}
                          {editMacroIds.length} {m.kanban_selected_macros()}
                        {:else}
                          {m.kanban_select_macros()}
                        {/if}
                      </span>
                      <svg class="h-4 w-4 transition-transform {showMacroDropdown ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {#if showMacroDropdown}
                      <div class="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-700">
                        {#each data.macros as macro}
                          <label class="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-600">
                            <input
                              type="checkbox"
                              checked={editMacroIds.includes(macro.id)}
                              onchange={() => toggleMacro(macro.id)}
                              class="rounded border-gray-300 text-blue-600"
                            />
                            <div class="flex-1">
                              <span class="font-medium text-gray-900 dark:text-white">{macro.name}</span>
                              {#if macro.visibility === "personal"}
                                <span class="ml-1 text-[10px] text-gray-400">(personal)</span>
                              {/if}
                            </div>
                          </label>
                        {/each}
                      </div>
                    {/if}
                  </div>
                {/if}
              </div>

              <!-- Conditions -->
              <div class="mb-4">
                <div class="mb-2 flex items-center justify-between">
                  <div>
                    <label class="text-xs font-medium text-gray-600 dark:text-gray-400">{m.kanban_stage_conditions()}</label>
                    <p class="text-[11px] text-gray-400">{m.kanban_stage_conditions_description()}</p>
                  </div>
                  <button type="button" onclick={addCondition} class="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300">
                    {m.macro_add_condition()}
                  </button>
                </div>
                {#each editConditions as condition, i}
                  <div class="mb-2 flex items-center gap-2 rounded border border-gray-200 bg-gray-50 p-2 dark:border-gray-600 dark:bg-gray-700">
                    <select
                      bind:value={condition.attribute}
                      class="rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    >
                      <optgroup label="Standard">
                        {#each baseConditionAttributes as attr}
                          <option value={attr.value}>{attr.label()}</option>
                        {/each}
                      </optgroup>
                      {#if data.customAttributes.length > 0}
                        <optgroup label={m.kanban_custom_attribute()}>
                          {#each data.customAttributes as ca}
                            <option value="custom_attribute.{ca.key}">{ca.displayName}</option>
                          {/each}
                        </optgroup>
                      {/if}
                    </select>
                    <select
                      bind:value={condition.operator}
                      class="rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    >
                      {#each operators as op}
                        <option value={op.value}>{op.label()}</option>
                      {/each}
                    </select>
                    {#if condition.operator !== "is_present" && condition.operator !== "is_not_present"}
                      <input
                        bind:value={condition.value}
                        placeholder={m.condition_value()}
                        class="flex-1 rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      />
                    {/if}
                    <button type="button" onclick={() => removeCondition(i)} class="text-red-400 hover:text-red-600">
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                {/each}
              </div>

              <div class="flex gap-2">
                <button type="submit" class="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
                  {m.btn_save()}
                </button>
                <button type="button" onclick={cancelEdit} class="text-xs text-gray-500 hover:text-gray-700">
                  {m.btn_cancel()}
                </button>
              </div>
            </form>
          {:else}
            <!-- View mode -->
            <div class="flex items-center justify-between p-4">
              <div class="flex items-center gap-3">
                <span class="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white" style="background-color: {stage.color}">
                  {index + 1}
                </span>
                <div>
                  <h4 class="text-sm font-semibold text-gray-900 dark:text-white">{stage.name}</h4>
                  {#if stage.description}
                    <p class="text-xs text-gray-500">{stage.description}</p>
                  {/if}
                  {#if (stage.macroActions as Array<{ macroId?: number }>)?.length > 0}
                    <div class="mt-0.5 flex flex-wrap gap-1">
                      {#each (stage.macroActions as Array<{ macroId?: number }>) as action}
                        {#if action.macroId}
                          <span class="inline-block rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                            {getMacroName(action.macroId)}
                          </span>
                        {/if}
                      {/each}
                      {#if (stage.macroConditions as unknown[])?.length > 0}
                        <span class="text-[10px] text-gray-400">
                          &middot; {(stage.macroConditions as unknown[]).length} condition(s)
                        </span>
                      {/if}
                    </div>
                  {/if}
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button
                  onclick={() => startEditStage(stage)}
                  class="rounded-md border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400"
                >
                  {m.btn_edit()}
                </button>
                <form method="POST" action="?/deleteStage" use:enhance>
                  <input type="hidden" name="stageId" value={stage.id} />
                  <button
                    type="submit"
                    class="rounded-md border border-red-200 px-2.5 py-1 text-xs text-red-500 hover:bg-red-50 dark:border-red-800"
                    onclick={(e) => {
                      if (!confirm(m.confirm_delete())) e.preventDefault();
                    }}
                  >
                    {m.btn_delete()}
                  </button>
                </form>
              </div>
            </div>
          {/if}
        </div>
      {/each}

      <!-- Add stage -->
      {#if showAddStage}
        <div class="rounded-lg border border-dashed border-gray-300 bg-white p-4 dark:border-gray-600 dark:bg-gray-800">
          <form
            method="POST"
            action="?/createStage"
            use:enhance={() => {
              return async ({ update }) => {
                await update();
                showAddStage = false;
              };
            }}
            class="flex items-end gap-3"
          >
            <input type="hidden" name="boardId" value={data.activeBoard?.id} />
            <input type="hidden" name="position" value={data.stages.length} />
            <div class="flex-1">
              <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">{m.kanban_stage_name()}</label>
              <input
                name="name"
                type="text"
                required
                class="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">{m.kanban_stage_color()}</label>
              <input
                name="color"
                type="color"
                value="#3b82f6"
                class="h-8 w-10 cursor-pointer rounded border border-gray-300"
              />
            </div>
            <button type="submit" class="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
              {m.btn_create()}
            </button>
            <button type="button" onclick={() => (showAddStage = false)} class="text-xs text-gray-500">
              {m.btn_cancel()}
            </button>
          </form>
        </div>
      {:else}
        <button
          onclick={() => (showAddStage = true)}
          class="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 py-3 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600 dark:border-gray-600 dark:text-gray-400"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {m.kanban_new_stage()}
        </button>
      {/if}
    </div>
  {:else if data.boards.length === 0}
    <p class="text-sm text-gray-500">{m.kanban_no_boards()}</p>
  {/if}
</div>
