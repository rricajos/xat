<script lang="ts">
  import { enhance } from "$app/forms";
  import * as m from "$lib/paraglide/messages";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  let showForm = $state(false);
  let activeTab = $state<"conversation" | "contact">("conversation");

  const filtered = $derived(
    data.attributes.filter((a) => a.attributeModel === activeTab),
  );

  const typeLabels: Record<string, string> = {
    text: "Text",
    number: "Number",
    date: "Date",
    list: "List",
    checkbox: "Checkbox",
    link: "Link",
  };
</script>

<div class="p-6">
  <div class="flex items-center justify-between mb-6">
    <div>
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{m.settings_custom_attributes()}</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400">{m.settings_custom_attributes_description()}</p>
    </div>
    <button
      onclick={() => showForm = !showForm}
      class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
    >
      {showForm ? "Cancel" : "Add Attribute"}
    </button>
  </div>

  <!-- Tabs -->
  <div class="flex border-b border-gray-200 dark:border-gray-700 mb-6">
    <button
      onclick={() => activeTab = "conversation"}
      class="border-b-2 -mb-px px-4 py-2 text-sm font-medium transition-colors {activeTab === 'conversation'
        ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}"
    >
      Conversation
    </button>
    <button
      onclick={() => activeTab = "contact"}
      class="border-b-2 -mb-px px-4 py-2 text-sm font-medium transition-colors {activeTab === 'contact'
        ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}"
    >
      Contact
    </button>
  </div>

  {#if showForm}
    <form method="POST" action="?/create" use:enhance class="mb-6 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4 dark:bg-gray-800/50">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="displayName" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Display Name</label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            required
            placeholder="Priority Level"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div>
          <label for="key" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Key</label>
          <input
            id="key"
            name="key"
            type="text"
            required
            placeholder="priority_level"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="displayType" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
          <select
            id="displayType"
            name="displayType"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            {#each Object.entries(typeLabels) as [value, label]}
              <option {value}>{label}</option>
            {/each}
          </select>
        </div>
        <div>
          <label for="model" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Applies to</label>
          <select
            id="model"
            name="model"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="conversation">Conversation</option>
            <option value="contact">Contact</option>
          </select>
        </div>
      </div>
      <button type="submit" class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
        Create Attribute
      </button>
    </form>
  {/if}

  <div class="space-y-2">
    {#each filtered as attr}
      <div class="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50">
        <div>
          <p class="text-sm font-medium text-gray-900 dark:text-white">{attr.attributeDisplayName}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Key: {attr.attributeKey} &middot; Type: {typeLabels[attr.attributeDisplayType] ?? attr.attributeDisplayType}
          </p>
        </div>
        <form method="POST" action="?/delete" use:enhance>
          <input type="hidden" name="attrId" value={attr.id} />
          <button type="submit" class="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
            Delete
          </button>
        </form>
      </div>
    {/each}

    {#if filtered.length === 0}
      <p class="text-center text-sm text-gray-400 dark:text-gray-500 py-8">
        No custom attributes for {activeTab === "conversation" ? "conversations" : "contacts"}
      </p>
    {/if}
  </div>
</div>
