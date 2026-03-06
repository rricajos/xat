<script lang="ts">
  import { enhance } from "$app/forms";
  import type { PageData, ActionData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  }
</script>

<div class="p-8">
  <h2 class="text-2xl font-bold text-gray-900 mb-2">Platform Configuration</h2>
  <p class="text-sm text-gray-500 mb-8">System information and maintenance</p>

  {#if form?.success}
    <div class="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
      {form.message ?? "Action completed successfully"}
    </div>
  {/if}

  <div class="grid gap-6 lg:grid-cols-2">
    <div class="rounded-lg bg-white p-6 shadow-sm">
      <h3 class="text-sm font-semibold text-gray-900 mb-4">System Info</h3>
      <dl class="space-y-3">
        <div class="flex justify-between">
          <dt class="text-sm text-gray-500">Node.js</dt>
          <dd class="text-sm font-medium text-gray-900">{data.platform.nodeVersion}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-sm text-gray-500">Platform</dt>
          <dd class="text-sm font-medium text-gray-900">{data.platform.platform}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-sm text-gray-500">Uptime</dt>
          <dd class="text-sm font-medium text-gray-900">{formatUptime(data.platform.uptime)}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-sm text-gray-500">Heap Used</dt>
          <dd class="text-sm font-medium text-gray-900">{formatBytes(data.platform.memoryUsage.heapUsed)}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-sm text-gray-500">Heap Total</dt>
          <dd class="text-sm font-medium text-gray-900">{formatBytes(data.platform.memoryUsage.heapTotal)}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-sm text-gray-500">RSS</dt>
          <dd class="text-sm font-medium text-gray-900">{formatBytes(data.platform.memoryUsage.rss)}</dd>
        </div>
      </dl>
    </div>

    <div class="rounded-lg bg-white p-6 shadow-sm">
      <h3 class="text-sm font-semibold text-gray-900 mb-4">Sessions</h3>
      <dl class="space-y-3 mb-6">
        <div class="flex justify-between">
          <dt class="text-sm text-gray-500">Active Sessions</dt>
          <dd class="text-sm font-medium text-gray-900">{data.platform.activeSessions}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-sm text-gray-500">Expired Sessions</dt>
          <dd class="text-sm font-medium text-gray-900">{data.platform.expiredSessions}</dd>
        </div>
      </dl>

      <h4 class="text-xs font-semibold text-gray-500 uppercase mb-3">Maintenance</h4>
      <form method="POST" action="?/cleanupSessions" use:enhance>
        <button
          type="submit"
          class="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
        >
          Cleanup Expired Sessions
        </button>
      </form>
    </div>
  </div>
</div>
