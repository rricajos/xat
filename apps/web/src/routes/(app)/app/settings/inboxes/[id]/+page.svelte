<script lang="ts">
  import { enhance } from "$app/forms";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  let saved = $state(false);

  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const dayLabels: Record<string, string> = {
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
  };

  interface DaySchedule {
    enabled: boolean;
    openHour: number;
    openMinute: number;
    closeHour: number;
    closeMinute: number;
  }

  const existingHours =
    (data.inbox.settings as Record<string, unknown>)?.businessHours as
      | Record<string, DaySchedule>
      | undefined;

  let businessHours = $state<Record<string, DaySchedule>>(
    Object.fromEntries(
      days.map((day) => [
        day,
        existingHours?.[day] ?? {
          enabled: day !== "saturday" && day !== "sunday",
          openHour: 9,
          openMinute: 0,
          closeHour: 17,
          closeMinute: 0,
        },
      ]),
    ),
  );

  function formatTime(hour: number, minute: number): string {
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }

  function parseTime(value: string): { hour: number; minute: number } {
    const parts = value.split(":");
    return { hour: parseInt(parts[0] ?? "0"), minute: parseInt(parts[1] ?? "0") };
  }
</script>

<div class="p-6">
  <div class="mb-6">
    <a
      href="/app/settings/inboxes"
      class="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
    >
      &larr; Back to Inboxes
    </a>
  </div>

  <h2 class="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
    {data.inbox.name}
  </h2>
  <p class="mb-6 text-sm text-gray-500 dark:text-gray-400">
    {data.inbox.channelType} inbox
  </p>

  {#if saved}
    <div
      class="mb-4 rounded-md bg-green-50 px-4 py-2 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400"
    >
      Settings saved
    </div>
  {/if}

  <form
    method="POST"
    action="?/update"
    use:enhance={() => {
      return async ({ update }) => {
        await update();
        saved = true;
        setTimeout(() => (saved = false), 2000);
      };
    }}
  >
    <input type="hidden" name="businessHours" value={JSON.stringify(businessHours)} />

    <div class="space-y-6">
      <!-- General -->
      <div class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">General</h3>
        <div class="space-y-3">
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >Name</label
            >
            <input
              id="name"
              name="name"
              type="text"
              required
              value={data.inbox.name}
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <label class="flex items-center gap-2">
            <input
              type="checkbox"
              name="enableAutoAssignment"
              checked={data.inbox.enableAutoAssignment}
              class="h-4 w-4 rounded border-gray-300"
            />
            <span class="text-sm text-gray-700 dark:text-gray-300">Enable auto-assignment</span>
          </label>
          <label class="flex items-center gap-2">
            <input
              type="checkbox"
              name="csatSurveyEnabled"
              checked={data.inbox.csatSurveyEnabled}
              class="h-4 w-4 rounded border-gray-300"
            />
            <span class="text-sm text-gray-700 dark:text-gray-300"
              >Send CSAT survey after resolve</span
            >
          </label>
        </div>
      </div>

      <!-- Greeting -->
      <div class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Greeting</h3>
        <label class="mb-3 flex items-center gap-2">
          <input
            type="checkbox"
            name="greetingEnabled"
            checked={data.inbox.greetingEnabled}
            class="h-4 w-4 rounded border-gray-300"
          />
          <span class="text-sm text-gray-700 dark:text-gray-300">Enable greeting message</span>
        </label>
        <textarea
          name="greetingMessage"
          rows="2"
          placeholder="Hi! How can we help you today?"
          class="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >{data.inbox.greetingMessage ?? ""}</textarea
        >
      </div>

      <!-- Business Hours -->
      <div class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Business Hours</h3>
        <label class="mb-3 flex items-center gap-2">
          <input
            type="checkbox"
            name="businessHoursEnabled"
            checked={data.inbox.businessHoursEnabled}
            class="h-4 w-4 rounded border-gray-300"
          />
          <span class="text-sm text-gray-700 dark:text-gray-300"
            >Enable business hours (show out-of-office message outside hours)</span
          >
        </label>

        <div class="mb-3">
          <textarea
            name="outOfOfficeMessage"
            rows="2"
            placeholder="We're currently outside business hours. We'll respond soon!"
            class="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >{data.inbox.outOfOfficeMessage ?? ""}</textarea
          >
        </div>

        <div class="space-y-2">
          {#each days as day}
            {@const schedule = businessHours[day]!}
            <div class="flex items-center gap-3">
              <label class="flex w-28 items-center gap-2">
                <input
                  type="checkbox"
                  bind:checked={schedule.enabled}
                  class="h-3.5 w-3.5 rounded border-gray-300"
                />
                <span class="text-xs text-gray-700 dark:text-gray-300">{dayLabels[day]}</span>
              </label>
              {#if schedule.enabled}
                <input
                  type="time"
                  value={formatTime(schedule.openHour, schedule.openMinute)}
                  onchange={(e) => {
                    const t = parseTime(e.currentTarget.value);
                    schedule.openHour = t.hour;
                    schedule.openMinute = t.minute;
                  }}
                  class="rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
                <span class="text-xs text-gray-400">to</span>
                <input
                  type="time"
                  value={formatTime(schedule.closeHour, schedule.closeMinute)}
                  onchange={(e) => {
                    const t = parseTime(e.currentTarget.value);
                    schedule.closeHour = t.hour;
                    schedule.closeMinute = t.minute;
                  }}
                  class="rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              {:else}
                <span class="text-xs text-gray-400">Closed</span>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    </div>

    <div class="mt-6 flex justify-end">
      <button
        type="submit"
        class="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >Save Settings</button
      >
    </div>
  </form>

  <!-- Email Signature (email inboxes only) -->
  {#if data.inbox.channelType === "Channel::Email" && data.emailChannel !== null}
    <div class="mt-8 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      <h3 class="mb-1 text-sm font-semibold text-gray-900 dark:text-white">Email Signature</h3>
      <p class="mb-3 text-xs text-gray-500 dark:text-gray-400">This signature will be appended to outgoing emails from this inbox.</p>
      <form method="POST" action="?/updateSignature" use:enhance class="space-y-3">
        <textarea
          name="emailSignature"
          rows="4"
          placeholder="Best regards,&#10;The Support Team"
          class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >{data.emailChannel.emailSignature ?? ""}</textarea>
        <div class="flex justify-end">
          <button type="submit" class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Save Signature
          </button>
        </div>
      </form>
    </div>
  {/if}
</div>
