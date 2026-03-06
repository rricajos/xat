<script lang="ts">
  import { onMount } from "svelte";
  import type { Snippet } from "svelte";

  interface Props {
    defaultWidth: number;
    minWidth?: number;
    maxWidth?: number;
    storageKey?: string;
    children: Snippet;
  }

  let {
    defaultWidth,
    minWidth = 180,
    maxWidth = 400,
    storageKey,
    children,
  }: Props = $props();

  let width = $state(defaultWidth);
  let dragging = $state(false);
  let panel: HTMLDivElement | undefined = $state();

  onMount(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = Number(saved);
        if (!Number.isNaN(parsed) && parsed >= minWidth && parsed <= maxWidth) {
          width = parsed;
        }
      }
    }
  });

  function onPointerDown(e: PointerEvent) {
    e.preventDefault();
    dragging = true;

    const onPointerMove = (ev: PointerEvent) => {
      if (!panel) return;
      const rect = panel.getBoundingClientRect();
      let newWidth = ev.clientX - rect.left;
      newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      width = newWidth;
    };

    const onPointerUp = () => {
      dragging = false;
      if (storageKey) {
        localStorage.setItem(storageKey, String(Math.round(width)));
      }
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }

  function onDoubleClick() {
    width = defaultWidth;
    if (storageKey) {
      localStorage.setItem(storageKey, String(defaultWidth));
    }
  }
</script>

<div
  bind:this={panel}
  class="relative h-full flex-shrink-0"
  style="width: {width}px"
>
  {@render children()}

  <!-- Resize handle -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="absolute top-0 right-0 z-10 h-full w-1 cursor-col-resize transition-colors hover:bg-blue-500/30 {dragging ? 'bg-blue-500/40' : ''}"
    onpointerdown={onPointerDown}
    ondblclick={onDoubleClick}
  ></div>
</div>
