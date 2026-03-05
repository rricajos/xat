<script lang="ts">
  import { enhance } from "$app/forms";
  import * as m from "$lib/paraglide/messages";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  let showForm = $state(false);
  let editingId = $state<number | null>(null);
  let editName = $state("");
  let editPermissions = $state<Set<string>>(new Set());

  function startEdit(role: { id: number; name: string; permissions: unknown }) {
    editingId = role.id;
    editName = role.name;
    editPermissions = new Set((role.permissions as string[]) ?? []);
  }

  function cancelEdit() {
    editingId = null;
  }

  function togglePermission(perm: string) {
    const next = new Set(editPermissions);
    if (next.has(perm)) {
      next.delete(perm);
    } else {
      next.add(perm);
    }
    editPermissions = next;
  }

  function formatPermission(perm: string): string {
    return perm.replace(/_/g, " ").replace(/\./g, " > ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
</script>

<div class="p-6">
  <div class="mb-6 flex items-center justify-between">
    <div>
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{m.settings_custom_roles()}</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400">{m.settings_custom_roles_description()}</p>
    </div>
    <button
      onclick={() => (showForm = !showForm)}
      class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
    >
      {showForm ? "Cancel" : "New Role"}
    </button>
  </div>

  <!-- Built-in roles info -->
  <div class="mb-4 rounded-md bg-gray-50 p-3 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
    Built-in roles: <strong>Administrator</strong> (full access),
    <strong>Agent</strong> (conversations, contacts, canned responses).
    Custom roles extend beyond these defaults.
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
          >Role Name</label
        >
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="e.g. Supervisor"
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </div>
      <div>
        <p class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Permissions</p>
        <div class="grid grid-cols-2 gap-1">
          {#each data.permissions as perm}
            <label class="flex items-center gap-2 rounded px-2 py-1 text-xs hover:bg-gray-50 dark:hover:bg-gray-700">
              <input type="checkbox" name="permissions" value={perm} class="h-3.5 w-3.5 rounded border-gray-300" />
              <span class="text-gray-700 dark:text-gray-300">{formatPermission(perm)}</span>
            </label>
          {/each}
        </div>
      </div>
      <button
        type="submit"
        class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Create Role
      </button>
    </form>
  {/if}

  <div class="space-y-3">
    {#each data.roles as role}
      {#if editingId === role.id}
        <form
          method="POST"
          action="?/update"
          use:enhance={() => {
            return async ({ update }) => {
              await update();
              editingId = null;
            };
          }}
          class="rounded-lg border border-blue-200 p-4 space-y-3 dark:border-blue-700"
        >
          <input type="hidden" name="roleId" value={role.id} />
          <input
            name="name"
            type="text"
            required
            bind:value={editName}
            class="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
          <div class="grid grid-cols-2 gap-1">
            {#each data.permissions as perm}
              <label class="flex items-center gap-2 rounded px-2 py-1 text-xs hover:bg-gray-50 dark:hover:bg-gray-700">
                <input
                  type="checkbox"
                  name="permissions"
                  value={perm}
                  checked={editPermissions.has(perm)}
                  onchange={() => togglePermission(perm)}
                  class="h-3.5 w-3.5 rounded border-gray-300"
                />
                <span class="text-gray-700 dark:text-gray-300">{formatPermission(perm)}</span>
              </label>
            {/each}
          </div>
          <div class="flex gap-2">
            <button
              type="submit"
              class="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
              >Save</button
            >
            <button
              type="button"
              onclick={cancelEdit}
              class="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
              >Cancel</button
            >
          </div>
        </form>
      {:else}
        <div
          class="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-700"
        >
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">{role.name}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {(role.permissions as string[]).length} permissions
            </p>
          </div>
          <div class="flex items-center gap-2">
            <button
              onclick={() => startEdit(role)}
              class="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Edit
            </button>
            <form method="POST" action="?/delete" use:enhance>
              <input type="hidden" name="roleId" value={role.id} />
              <button
                type="submit"
                class="text-xs text-red-600 hover:text-red-700 dark:text-red-400"
              >
                Delete
              </button>
            </form>
          </div>
        </div>
      {/if}
    {/each}

    {#if data.roles.length === 0}
      <p class="py-8 text-center text-sm text-gray-400">
        No custom roles yet. The built-in Administrator and Agent roles are always available.
      </p>
    {/if}
  </div>
</div>
