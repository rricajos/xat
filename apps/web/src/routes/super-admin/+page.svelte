<script lang="ts">
  import type { LayoutData } from "./$types";

  let { data }: { data: LayoutData } = $props();
</script>

<div class="p-8">
  <h2 class="text-2xl font-bold text-gray-900 mb-6">Platform Overview</h2>

  <div class="grid grid-cols-3 gap-6 mb-8">
    <div class="rounded-lg bg-white p-6 shadow-sm">
      <p class="text-sm font-medium text-gray-500">Accounts</p>
      <p class="mt-2 text-3xl font-bold text-gray-900">{data.stats.accounts}</p>
    </div>
    <div class="rounded-lg bg-white p-6 shadow-sm">
      <p class="text-sm font-medium text-gray-500">Users</p>
      <p class="mt-2 text-3xl font-bold text-gray-900">{data.stats.users}</p>
    </div>
    <div class="rounded-lg bg-white p-6 shadow-sm">
      <p class="text-sm font-medium text-gray-500">Account-User Links</p>
      <p class="mt-2 text-3xl font-bold text-gray-900">{data.stats.agents}</p>
    </div>
  </div>

  <div class="rounded-lg bg-white p-6 shadow-sm">
    <h3 class="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h3>
    <div class="flex gap-3">
      <a href="/super-admin/accounts" class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
        Manage Accounts
      </a>
      <a href="/super-admin/users" class="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700">
        Manage Users
      </a>
    </div>
  </div>
</div>
