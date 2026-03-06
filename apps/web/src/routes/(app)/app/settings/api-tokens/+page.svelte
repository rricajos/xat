<script lang="ts">
  import { enhance } from "$app/forms";
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();
  let newToken = $state<string | null>(null);
  let copied = $state(false);

  function copyToken() {
    if (newToken) {
      navigator.clipboard.writeText(newToken);
      copied = true;
      setTimeout(() => (copied = false), 2000);
    }
  }

  function formatDate(date: string | Date | null): string {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString();
  }
</script>

<div class="p-6">
  <div class="mb-6">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-white">API Tokens</h2>
    <p class="text-sm text-gray-500 dark:text-gray-400">
      Personal access tokens for API authentication
    </p>
  </div>

  <!-- New token warning banner -->
  {#if newToken}
    <div class="mb-6 rounded-lg border border-yellow-300 bg-yellow-50 p-4 dark:border-yellow-600 dark:bg-yellow-900/30">
      <div class="flex items-start gap-3">
        <svg class="mt-0.5 h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div class="flex-1">
          <p class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            This token will only be shown once. Copy it now.
          </p>
          <div class="mt-2 flex items-center gap-2">
            <code class="block flex-1 rounded bg-yellow-100 px-3 py-2 font-mono text-xs text-yellow-900 dark:bg-yellow-900/50 dark:text-yellow-100 break-all">
              {newToken}
            </code>
            <button
              onclick={copyToken}
              class="shrink-0 rounded-md bg-yellow-600 px-3 py-2 text-xs font-medium text-white hover:bg-yellow-700"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Create form -->
  <form
    method="POST"
    action="?/create"
    use:enhance={() => {
      return async ({ result, update }) => {
        if (result.type === "success" && result.data?.newToken) {
          newToken = result.data.newToken as string;
        }
        await update();
      };
    }}
    class="mb-6 flex items-end gap-3"
  >
    <div class="flex-1">
      <label for="token-label" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Token Label
      </label>
      <input
        id="token-label"
        name="label"
        type="text"
        required
        placeholder="e.g. CI/CD Pipeline, Mobile App"
        class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      />
    </div>
    <button
      type="submit"
      class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
    >
      Generate Token
    </button>
  </form>

  {#if form?.error}
    <p class="mb-4 text-sm text-red-600 dark:text-red-400">{form.error}</p>
  {/if}

  <!-- Tokens table -->
  <table class="w-full">
    <thead class="bg-gray-50 dark:bg-gray-800">
      <tr>
        <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Label</th>
        <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Token</th>
        <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Last Used</th>
        <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Created</th>
        <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Actions</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
      {#each data.tokens as token}
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-800">
          <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
            {token.label}
          </td>
          <td class="px-4 py-3">
            <code class="font-mono text-xs text-gray-500 dark:text-gray-400">{token.token}</code>
          </td>
          <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
            {formatDate(token.lastUsedAt)}
          </td>
          <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
            {formatDate(token.createdAt)}
          </td>
          <td class="px-4 py-3">
            <form method="POST" action="?/delete" use:enhance>
              <input type="hidden" name="tokenId" value={token.id} />
              <button type="submit" class="text-xs text-red-600 hover:text-red-700">
                Delete
              </button>
            </form>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>

  {#if data.tokens.length === 0}
    <p class="py-8 text-center text-sm text-gray-400">No API tokens yet</p>
  {/if}
</div>
