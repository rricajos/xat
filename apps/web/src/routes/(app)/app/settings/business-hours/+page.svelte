<script lang="ts">
  import { enhance } from "$app/forms";
  import * as m from "$lib/paraglide/messages";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  interface DayConfig {
    day: string;
    enabled: boolean;
    openHour: number;
    openMinute: number;
    closeHour: number;
    closeMinute: number;
  }

  const bh = data.businessHours as { timezone: string; days: DayConfig[] };

  const dayLabels: Record<string, string> = {
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
  };

  function formatTime(hour: number, minute: number): string {
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  }
</script>

<div class="p-6">
  <div class="mb-6">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{m.settings_business_hours()}</h2>
    <p class="text-sm text-gray-500 dark:text-gray-400">{m.settings_business_hours_description()}</p>
  </div>

  <form method="POST" use:enhance class="max-w-xl">
    <div class="mb-6">
      <label for="bh-tz" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Timezone
      </label>
      <select
        id="bh-tz"
        name="timezone"
        value={bh.timezone}
        class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      >
        <option value="UTC">UTC</option>
        <option value="America/New_York">America/New_York (EST)</option>
        <option value="America/Chicago">America/Chicago (CST)</option>
        <option value="America/Denver">America/Denver (MST)</option>
        <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
        <option value="America/Mexico_City">America/Mexico_City</option>
        <option value="America/Bogota">America/Bogota</option>
        <option value="America/Buenos_Aires">America/Buenos_Aires</option>
        <option value="America/Sao_Paulo">America/Sao_Paulo</option>
        <option value="Europe/London">Europe/London (GMT)</option>
        <option value="Europe/Paris">Europe/Paris (CET)</option>
        <option value="Europe/Berlin">Europe/Berlin (CET)</option>
        <option value="Europe/Madrid">Europe/Madrid (CET)</option>
        <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
        <option value="Asia/Shanghai">Asia/Shanghai (CST)</option>
        <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
        <option value="Asia/Dubai">Asia/Dubai (GST)</option>
        <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
      </select>
    </div>

    <div class="space-y-3">
      {#each bh.days as day}
        <div class="flex items-center gap-4 rounded-md border border-gray-200 p-3 dark:border-gray-700">
          <label class="flex w-28 items-center gap-2">
            <input
              type="checkbox"
              name="{day.day}_enabled"
              checked={day.enabled}
              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
              {dayLabels[day.day]}
            </span>
          </label>

          <div class="flex items-center gap-2">
            <input
              type="number"
              name="{day.day}_open_hour"
              value={day.openHour}
              min="0"
              max="23"
              class="w-16 rounded border border-gray-300 px-2 py-1 text-sm text-center dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
            <span class="text-gray-400">:</span>
            <input
              type="number"
              name="{day.day}_open_minute"
              value={day.openMinute}
              min="0"
              max="59"
              step="15"
              class="w-16 rounded border border-gray-300 px-2 py-1 text-sm text-center dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
            <span class="text-sm text-gray-400">to</span>
            <input
              type="number"
              name="{day.day}_close_hour"
              value={day.closeHour}
              min="0"
              max="23"
              class="w-16 rounded border border-gray-300 px-2 py-1 text-sm text-center dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
            <span class="text-gray-400">:</span>
            <input
              type="number"
              name="{day.day}_close_minute"
              value={day.closeMinute}
              min="0"
              max="59"
              step="15"
              class="w-16 rounded border border-gray-300 px-2 py-1 text-sm text-center dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>
      {/each}
    </div>

    <div class="mt-6">
      <button
        type="submit"
        class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Save Business Hours
      </button>
    </div>
  </form>
</div>
