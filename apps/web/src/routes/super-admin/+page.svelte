<script lang="ts">
  import type { LayoutData } from "./$types";

  let { data }: { data: LayoutData } = $props();

  const stats = [
    { label: "Accounts", value: data.stats.accounts, color: "bg-blue-500", href: "/super-admin/accounts" },
    { label: "Users", value: data.stats.users, color: "bg-green-500", href: "/super-admin/users" },
    { label: "Conversations", value: data.stats.conversations, color: "bg-purple-500" },
    { label: "Contacts", value: data.stats.contacts, color: "bg-yellow-500" },
    { label: "Messages", value: data.stats.messages, color: "bg-pink-500" },
    { label: "Inboxes", value: data.stats.inboxes, color: "bg-indigo-500" },
  ];
</script>

<div class="p-8">
  <h2 class="text-2xl font-bold text-gray-900 mb-2">Platform Overview</h2>
  <p class="text-sm text-gray-500 mb-8">System-wide statistics and management console</p>

  <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 mb-8">
    {#each stats as stat}
      <div class="rounded-lg bg-white p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-2">
          <div class="h-2 w-2 rounded-full {stat.color}"></div>
          <p class="text-xs font-medium text-gray-500">{stat.label}</p>
        </div>
        {#if stat.href}
          <a href={stat.href} class="text-2xl font-bold text-gray-900 hover:text-blue-600">
            {stat.value.toLocaleString()}
          </a>
        {:else}
          <p class="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
        {/if}
      </div>
    {/each}
  </div>

  <div class="grid gap-6 lg:grid-cols-2">
    <div class="rounded-lg bg-white p-6 shadow-sm">
      <h3 class="text-sm font-semibold text-gray-900 mb-1">Recent Activity</h3>
      <p class="text-xs text-gray-500 mb-4">Last 30 days</p>
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-600">New accounts</span>
          <span class="text-sm font-semibold text-gray-900">{data.stats.recentAccounts}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-600">Conversations (7d)</span>
          <span class="text-sm font-semibold text-gray-900">{data.stats.recentConversations}</span>
        </div>
      </div>
    </div>

    <div class="rounded-lg bg-white p-6 shadow-sm">
      <h3 class="text-sm font-semibold text-gray-900 mb-1">Quick Actions</h3>
      <p class="text-xs text-gray-500 mb-4">Platform management</p>
      <div class="flex flex-wrap gap-2">
        <a href="/super-admin/accounts" class="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
          Manage Accounts
        </a>
        <a href="/super-admin/users" class="rounded-md bg-gray-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700">
          Manage Users
        </a>
        <a href="/super-admin/platform" class="rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700">
          Platform Config
        </a>
      </div>
    </div>
  </div>
</div>
