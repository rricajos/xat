<script lang="ts">
  import { onMount } from "svelte";

  interface Workflow {
    id: number;
    name: string;
    description: string | null;
    enabled: boolean;
    triggerAction: string;
    requiredAttributes: Array<{ attributeKey: string; attributeType: string; required: boolean }>;
    validationMessage: string | null;
    inboxIds: number[];
  }

  let workflows = $state<Workflow[]>([]);
  let showForm = $state(false);
  let editingWorkflow = $state<Workflow | null>(null);
  let formName = $state("");
  let formDescription = $state("");
  let formTrigger = $state("resolve");
  let formValidationMsg = $state("");
  let formAttributes = $state<Array<{ attributeKey: string; attributeType: string; required: boolean }>>([]);
  let saving = $state(false);

  async function loadWorkflows() {
    const res = await fetch("/api/v1/workflows");
    const json = await res.json();
    workflows = json.data ?? [];
  }

  function startCreate() {
    editingWorkflow = null;
    formName = "";
    formDescription = "";
    formTrigger = "resolve";
    formValidationMsg = "";
    formAttributes = [{ attributeKey: "", attributeType: "conversation", required: true }];
    showForm = true;
  }

  function startEdit(wf: Workflow) {
    editingWorkflow = wf;
    formName = wf.name;
    formDescription = wf.description ?? "";
    formTrigger = wf.triggerAction;
    formValidationMsg = wf.validationMessage ?? "";
    formAttributes = wf.requiredAttributes.length > 0
      ? [...wf.requiredAttributes]
      : [{ attributeKey: "", attributeType: "conversation", required: true }];
    showForm = true;
  }

  function addAttribute() {
    formAttributes = [...formAttributes, { attributeKey: "", attributeType: "conversation", required: true }];
  }

  function removeAttribute(idx: number) {
    formAttributes = formAttributes.filter((_, i) => i !== idx);
  }

  async function saveWorkflow() {
    saving = true;
    const validAttrs = formAttributes.filter((a) => a.attributeKey.trim());
    const body = {
      name: formName,
      description: formDescription || undefined,
      triggerAction: formTrigger,
      requiredAttributes: validAttrs,
      validationMessage: formValidationMsg || undefined,
    };

    if (editingWorkflow) {
      await fetch(`/api/v1/workflows/${editingWorkflow.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      await fetch("/api/v1/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }
    showForm = false;
    saving = false;
    await loadWorkflows();
  }

  async function deleteWorkflow(id: number) {
    await fetch(`/api/v1/workflows/${id}`, { method: "DELETE" });
    await loadWorkflows();
  }

  async function toggleEnabled(wf: Workflow) {
    await fetch(`/api/v1/workflows/${wf.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !wf.enabled }),
    });
    await loadWorkflows();
  }

  const triggerLabels: Record<string, string> = {
    resolve: "On Resolve",
    pending: "On Pending",
    handoff: "On Handoff",
  };

  onMount(loadWorkflows);
</script>

<div class="p-6">
  <div class="flex items-center justify-between mb-6">
    <div>
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Conversation Workflows</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Define required attributes before conversation status changes.
      </p>
    </div>
    <button
      class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      onclick={startCreate}
    >
      New Workflow
    </button>
  </div>

  {#if showForm}
    <div class="mb-6 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3 dark:bg-gray-800/50">
      <h3 class="text-sm font-medium text-gray-900 dark:text-white">{editingWorkflow ? "Edit Workflow" : "New Workflow"}</h3>
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
        <input type="text" class="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white" bind:value={formName} />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
        <input type="text" class="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white" bind:value={formDescription} />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Trigger Action</label>
        <select class="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white" bind:value={formTrigger}>
          <option value="resolve">On Resolve</option>
          <option value="pending">On Pending</option>
          <option value="handoff">On Handoff</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Validation Message</label>
        <input type="text" class="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white" bind:value={formValidationMsg} placeholder="Please fill in all required fields before resolving." />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Required Attributes</label>
        {#each formAttributes as attr, idx}
          <div class="flex gap-2 mb-2">
            <input
              type="text"
              class="flex-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white"
              bind:value={attr.attributeKey}
              placeholder="Attribute key"
            />
            <select class="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white" bind:value={attr.attributeType}>
              <option value="conversation">Conversation</option>
              <option value="contact">Contact</option>
            </select>
            <button class="text-xs text-red-600 hover:text-red-700 dark:text-red-400 px-2" onclick={() => removeAttribute(idx)}>Remove</button>
          </div>
        {/each}
        <button class="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300" onclick={addAttribute}>
          + Add attribute
        </button>
      </div>
      <div class="flex gap-2">
        <button
          class="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          onclick={saveWorkflow}
          disabled={saving || !formName}
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button class="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800" onclick={() => { showForm = false; }}>
          Cancel
        </button>
      </div>
    </div>
  {/if}

  <div class="space-y-2">
    {#each workflows as wf}
      <div class="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50">
        <div>
          <div class="flex items-center gap-2">
            <p class="text-sm font-medium text-gray-900 dark:text-white">{wf.name}</p>
            <span
              class="text-xs px-2 py-0.5 rounded-full font-medium"
              class:bg-green-100={wf.enabled}
              class:text-green-700={wf.enabled}
              class:dark:bg-green-900/30={wf.enabled}
              class:dark:text-green-400={wf.enabled}
              class:bg-gray-100={!wf.enabled}
              class:text-gray-500={!wf.enabled}
              class:dark:bg-gray-700={!wf.enabled}
              class:dark:text-gray-400={!wf.enabled}
            >
              {wf.enabled ? "Active" : "Disabled"}
            </span>
            <span class="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">
              {triggerLabels[wf.triggerAction] ?? wf.triggerAction}
            </span>
          </div>
          {#if wf.description}
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{wf.description}</p>
          {/if}
          {#if wf.requiredAttributes.length > 0}
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Required: {wf.requiredAttributes.map((a) => a.attributeKey).join(", ")}
            </p>
          {/if}
        </div>
        <div class="flex gap-3">
          <button class="text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200" onclick={() => toggleEnabled(wf)}>
            {wf.enabled ? "Disable" : "Enable"}
          </button>
          <button class="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300" onclick={() => startEdit(wf)}>
            Edit
          </button>
          <button class="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300" onclick={() => deleteWorkflow(wf.id)}>
            Delete
          </button>
        </div>
      </div>
    {:else}
      <p class="text-center text-sm text-gray-400 dark:text-gray-500 py-8">No workflows configured.</p>
    {/each}
  </div>
</div>
