<script lang="ts">
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<div class="flex flex-1 items-center justify-center">
  <div class="text-center">
    <h2 class="text-xl font-semibold text-gray-700">
      Welcome back, {data.user.name}
    </h2>
    <p class="mt-2 text-gray-500">
      Select a conversation from the sidebar to get started.
    </p>
  </div>
</div>
