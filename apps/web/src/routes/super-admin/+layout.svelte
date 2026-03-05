<script lang="ts">
  import type { LayoutData } from "./$types";
  import type { Snippet } from "svelte";

  let { data, children }: { data: LayoutData; children: Snippet } = $props();
</script>

<div class="flex h-screen bg-gray-100">
  <!-- Sidebar -->
  <aside class="w-56 bg-gray-900 text-white">
    <div class="px-4 py-5 border-b border-gray-700">
      <h1 class="text-lg font-bold">Xat Super Admin</h1>
      <p class="text-xs text-gray-400 mt-1">Platform console</p>
    </div>
    <nav class="mt-4 space-y-1 px-2">
      <a href="/super-admin" class="flex items-center gap-2 rounded px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white">
        Dashboard
      </a>
      <a href="/super-admin/accounts" class="flex items-center gap-2 rounded px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white">
        Accounts
      </a>
      <a href="/super-admin/users" class="flex items-center gap-2 rounded px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white">
        Users
      </a>
    </nav>
    <div class="absolute bottom-4 left-0 w-56 px-4">
      <a href="/app/conversations" class="block rounded bg-gray-800 px-3 py-2 text-center text-xs text-gray-400 hover:text-white">
        Back to Dashboard
      </a>
    </div>
  </aside>

  <!-- Content -->
  <main class="flex-1 overflow-y-auto">
    {@render children()}
  </main>
</div>
