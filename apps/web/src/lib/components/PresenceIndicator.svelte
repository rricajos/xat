<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { getAgentAvailability, onPresenceChange } from "$lib/stores/realtime";

  interface Props {
    userId: number;
    size?: "sm" | "md";
  }

  let { userId, size = "sm" }: Props = $props();

  let availability = $state(getAgentAvailability(userId));

  let cleanup: (() => void) | undefined;

  onMount(() => {
    cleanup = onPresenceChange(() => {
      availability = getAgentAvailability(userId);
    });
  });

  onDestroy(() => cleanup?.());

  const colorClass = $derived(
    availability === 0
      ? "bg-green-500" // online
      : availability === 1
        ? "bg-yellow-500" // busy
        : "bg-gray-400", // offline
  );

  const sizeClass = $derived(
    size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5",
  );
</script>

<span
  class="inline-block rounded-full ring-2 ring-white dark:ring-gray-900 {colorClass} {sizeClass}"
  title={availability === 0 ? "Online" : availability === 1 ? "Busy" : "Offline"}
></span>
