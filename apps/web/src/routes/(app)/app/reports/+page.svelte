<script lang="ts">
  import { goto } from "$app/navigation";
  import type { PageData } from "./$types";
  import * as m from "$lib/paraglide/messages";

  let { data }: { data: PageData } = $props();

  function formatDuration(seconds: number | null): string {
    if (!seconds) return "-";
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  }

  const metrics = [
    { label: "Conversations", value: data.metrics.conversationsCount },
    { label: "Incoming Messages", value: data.metrics.incomingMessagesCount },
    { label: "Outgoing Messages", value: data.metrics.outgoingMessagesCount },
    { label: "Resolutions", value: data.metrics.resolutionCount },
    { label: "First Response Time", value: formatDuration(data.metrics.firstResponseTime) },
  ];

  const tabs = [
    { label: m.reports_overview(), href: "/app/reports" },
    { label: m.reports_agents(), href: "/app/reports/agents" },
    { label: m.reports_inboxes(), href: "/app/reports/inboxes" },
    { label: m.reports_teams(), href: "/app/reports/teams" },
    { label: m.reports_labels(), href: "/app/reports/labels" },
    { label: m.reports_csat(), href: "/app/reports/csat" },
    { label: m.reports_sla(), href: "/app/reports/sla" },
  ];
</script>

<div class="h-full overflow-y-auto bg-white dark:bg-gray-950">
  <div class="mx-auto max-w-5xl p-6">
    <!-- Tab Navigation -->
    <nav class="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-6">
      {#each tabs as tab}
        <a
          href={tab.href}
          class="px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors {tab.href === '/app/reports'
            ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'}"
        >
          {tab.label}
        </a>
      {/each}
    </nav>

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{m.reports_title()}</h2>
      <div class="flex gap-2">
        {#each [7, 30, 90] as days}
          <button
            onclick={() => goto(`/app/reports?days=${days}`)}
            class="rounded-md px-3 py-1.5 text-sm font-medium {data.days === days
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
              : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}"
          >
            {days}d
          </button>
        {/each}
      </div>
    </div>

    <!-- Metrics Grid -->
    <div class="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-3 lg:grid-cols-5">
      {#each metrics as metric}
        <div class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <p class="text-xs font-medium text-gray-500 dark:text-gray-400">{metric.label}</p>
          <p class="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{metric.value}</p>
        </div>
      {/each}
    </div>

    <!-- Chart -->
    <div class="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
      <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Conversations Over Time</h3>
      {#if data.chartData.length > 0}
        <div class="flex items-end gap-1 h-40">
          {#each data.chartData as point}
            {@const maxCount = Math.max(...data.chartData.map((p: { count: number }) => p.count), 1)}
            <div class="flex flex-1 flex-col items-center gap-1">
              <div
                class="w-full rounded-t bg-blue-500"
                style="height: {Math.max(4, (point.count / maxCount) * 100)}%"
                title="{point.date}: {point.count}"
              ></div>
              <span class="text-[9px] text-gray-400">
                {new Date(point.date).getDate()}
              </span>
            </div>
          {/each}
        </div>
      {:else}
        <p class="text-center text-sm text-gray-400 py-8">{m.no_results()}</p>
      {/if}
    </div>

    <!-- Report Sections -->
    <div class="mt-6 grid grid-cols-2 gap-4">
      {#each [{ label: "Agent", path: "agents" }, { label: "Label", path: "labels" }, { label: "Inbox", path: "inboxes" }, { label: "Team", path: "teams" }, { label: "CSAT", path: "csat" }, { label: "SLA", path: "sla" }] as section}
        <a
          href="/app/reports/{section.path}"
          class="rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors dark:border-gray-700 dark:hover:bg-gray-800"
        >
          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">{section.label} Reports</h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">View performance by {section.label.toLowerCase()}</p>
        </a>
      {/each}
    </div>
  </div>
</div>
