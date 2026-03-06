<script lang="ts">
  import { onMount } from "svelte";

  interface QueueInfo {
    name: string;
    counts: {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
      delayed: number;
    };
  }

  interface JobInfo {
    id: string;
    name: string;
    data: unknown;
    attemptsMade: number;
    timestamp: number;
    processedOn?: number;
    finishedOn?: number;
    failedReason?: string;
  }

  let queues = $state<QueueInfo[]>([]);
  let selectedQueue = $state<string | null>(null);
  let selectedStatus = $state("failed");
  let jobs = $state<JobInfo[]>([]);
  let loading = $state(false);

  async function loadQueues() {
    const res = await fetch("/super-admin/queues");
    const json = await res.json();
    queues = json.data;
  }

  async function loadJobs() {
    if (!selectedQueue) return;
    loading = true;
    const res = await fetch(
      `/super-admin/queues/${selectedQueue}/jobs?status=${selectedStatus}`,
    );
    const json = await res.json();
    jobs = json.data ?? [];
    loading = false;
  }

  async function cleanFailed(queueName: string) {
    await fetch(`/super-admin/queues/${queueName}/jobs`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clean_failed" }),
    });
    await loadQueues();
    if (selectedQueue === queueName) await loadJobs();
  }

  async function retryAll(queueName: string) {
    await fetch(`/super-admin/queues/${queueName}/jobs`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "retry_all" }),
    });
    await loadQueues();
    if (selectedQueue === queueName) await loadJobs();
  }

  async function removeJob(queueName: string, jobId: string) {
    await fetch(`/super-admin/queues/${queueName}/jobs`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId }),
    });
    await loadJobs();
  }

  function selectQueue(name: string) {
    selectedQueue = name;
    loadJobs();
  }

  onMount(() => {
    loadQueues();
    const interval = setInterval(loadQueues, 10000);
    return () => clearInterval(interval);
  });
</script>

<div class="p-6 space-y-6">
  <h1 class="text-2xl font-bold">Queue Monitor</h1>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {#each queues as q}
      <button
        class="rounded-lg border p-4 text-left transition-colors hover:bg-muted/50"
        class:border-primary={selectedQueue === q.name}
        onclick={() => selectQueue(q.name)}
      >
        <h3 class="font-semibold capitalize">{q.name}</h3>
        <div class="mt-2 grid grid-cols-2 gap-1 text-sm">
          <span class="text-muted-foreground">Waiting:</span>
          <span>{q.counts.waiting}</span>
          <span class="text-muted-foreground">Active:</span>
          <span class="text-blue-500">{q.counts.active}</span>
          <span class="text-muted-foreground">Completed:</span>
          <span class="text-green-500">{q.counts.completed}</span>
          <span class="text-muted-foreground">Failed:</span>
          <span class="text-red-500">{q.counts.failed}</span>
          <span class="text-muted-foreground">Delayed:</span>
          <span class="text-yellow-500">{q.counts.delayed}</span>
        </div>
        <div class="mt-3 flex gap-2">
          <button
            class="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
            onclick={(e) => { e.stopPropagation(); cleanFailed(q.name); }}
          >
            Clean Failed
          </button>
          <button
            class="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400"
            onclick={(e) => { e.stopPropagation(); retryAll(q.name); }}
          >
            Retry All
          </button>
        </div>
      </button>
    {/each}
  </div>

  {#if selectedQueue}
    <div class="space-y-4">
      <div class="flex items-center gap-4">
        <h2 class="text-lg font-semibold capitalize">{selectedQueue} Jobs</h2>
        <select
          bind:value={selectedStatus}
          onchange={loadJobs}
          class="rounded border px-2 py-1 text-sm"
        >
          <option value="waiting">Waiting</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="delayed">Delayed</option>
        </select>
      </div>

      {#if loading}
        <p class="text-muted-foreground">Loading...</p>
      {:else if jobs.length === 0}
        <p class="text-muted-foreground">No jobs in this status</p>
      {:else}
        <div class="space-y-2">
          {#each jobs as job}
            <div class="rounded-lg border p-3 text-sm">
              <div class="flex items-center justify-between">
                <span class="font-mono text-xs text-muted-foreground">
                  {job.id}
                </span>
                <button
                  class="text-xs text-red-500 hover:underline"
                  onclick={() => removeJob(selectedQueue!, job.id)}
                >
                  Remove
                </button>
              </div>
              <div class="mt-1">
                <span class="text-muted-foreground">Attempts:</span>
                {job.attemptsMade}
                {#if job.timestamp}
                  <span class="ml-4 text-muted-foreground">Created:</span>
                  {new Date(job.timestamp).toLocaleString()}
                {/if}
              </div>
              {#if job.failedReason}
                <div class="mt-1 text-red-500 text-xs font-mono bg-red-50 dark:bg-red-900/20 rounded p-2">
                  {job.failedReason}
                </div>
              {/if}
              <details class="mt-1">
                <summary class="cursor-pointer text-xs text-muted-foreground">
                  Job Data
                </summary>
                <pre class="mt-1 text-xs bg-muted/50 rounded p-2 overflow-auto max-h-40">{JSON.stringify(job.data, null, 2)}</pre>
              </details>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>
