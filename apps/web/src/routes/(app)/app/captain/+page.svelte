<script lang="ts">
  import * as m from "$lib/paraglide/messages";

  let inputText = $state("");
  let result = $state("");
  let loading = $state(false);
  let activeAction = $state<string | null>(null);
  let selectedTone = $state<"professional" | "friendly" | "direct" | "casual">("professional");
  let targetLanguage = $state("Spanish");

  async function callCaptain(action: string, payload: Record<string, unknown>) {
    loading = true;
    activeAction = action;
    result = "";
    try {
      const res = await fetch("/api/v1/captain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) {
        result = data.error ?? m.error_generic();
      } else {
        result = data.data.result;
      }
    } catch {
      result = m.captain_failed();
    } finally {
      loading = false;
    }
  }

  function adjustTone() {
    if (!inputText.trim()) return;
    callCaptain("adjust_tone", { text: inputText, tone: selectedTone });
  }

  function fixGrammar() {
    if (!inputText.trim()) return;
    callCaptain("fix_grammar", { text: inputText });
  }

  function translate() {
    if (!inputText.trim()) return;
    callCaptain("translate", { text: inputText, targetLanguage });
  }

  const languages = [
    "Spanish", "French", "German", "Portuguese", "Italian",
    "Chinese", "Japanese", "Korean", "Arabic", "Hindi",
    "Russian", "Dutch", "Swedish", "Turkish", "Polish",
  ];
</script>

<div class="h-full overflow-y-auto bg-white dark:bg-gray-950">
  <div class="mx-auto max-w-3xl p-6">
    <div class="mb-6">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{m.captain_title()}</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        {m.captain_description()}
      </p>
    </div>

    <!-- Input Area -->
    <div class="mb-6">
      <label for="captain-input" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {m.captain_your_text()}
      </label>
      <textarea
        id="captain-input"
        bind:value={inputText}
        rows="5"
        placeholder={m.captain_input_placeholder()}
        class="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      ></textarea>
    </div>

    <!-- Action Cards -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 mb-6">
      <!-- Fix Grammar -->
      <div class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <h3 class="text-sm font-semibold text-gray-800 dark:text-white mb-1">{m.captain_fix_grammar()}</h3>
        <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
          {m.captain_fix_grammar_description()}
        </p>
        <button
          onclick={fixGrammar}
          disabled={loading || !inputText.trim()}
          class="rounded-md bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading && activeAction === "fix_grammar" ? m.captain_processing() : m.captain_fix_grammar_btn()}
        </button>
      </div>

      <!-- Adjust Tone -->
      <div class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <h3 class="text-sm font-semibold text-gray-800 dark:text-white mb-1">{m.captain_adjust_tone()}</h3>
        <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
          {m.captain_adjust_tone_description()}
        </p>
        <div class="flex items-center gap-2">
          <select
            bind:value={selectedTone}
            class="rounded-md border border-gray-300 px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="professional">{m.captain_tone_professional()}</option>
            <option value="friendly">{m.captain_tone_friendly()}</option>
            <option value="direct">{m.captain_tone_direct()}</option>
            <option value="casual">{m.captain_tone_casual()}</option>
          </select>
          <button
            onclick={adjustTone}
            disabled={loading || !inputText.trim()}
            class="rounded-md bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading && activeAction === "adjust_tone" ? m.captain_processing() : m.captain_adjust_tone()}
          </button>
        </div>
      </div>

      <!-- Translate -->
      <div class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <h3 class="text-sm font-semibold text-gray-800 dark:text-white mb-1">{m.captain_translate()}</h3>
        <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
          {m.captain_translate_description()}
        </p>
        <div class="flex items-center gap-2">
          <select
            bind:value={targetLanguage}
            class="rounded-md border border-gray-300 px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            {#each languages as lang}
              <option value={lang}>{lang}</option>
            {/each}
          </select>
          <button
            onclick={translate}
            disabled={loading || !inputText.trim()}
            class="rounded-md bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading && activeAction === "translate" ? m.captain_translating() : m.captain_translate_btn()}
          </button>
        </div>
      </div>

      <!-- Info Card -->
      <div class="rounded-lg border border-gray-200 p-4 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <h3 class="text-sm font-semibold text-gray-800 dark:text-white mb-1">{m.captain_copilot()}</h3>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          {m.captain_copilot_description()}
        </p>
      </div>
    </div>

    <!-- Result -->
    {#if result}
      <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">{m.captain_result()}</h3>
          <button
            onclick={() => { inputText = result; result = ""; }}
            class="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            {m.btn_use_as_input()}
          </button>
        </div>
        <p class="text-sm text-gray-800 whitespace-pre-wrap dark:text-gray-200">{result}</p>
        <button
          onclick={() => navigator.clipboard.writeText(result)}
          class="mt-3 rounded-md border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          {m.btn_copy()}
        </button>
      </div>
    {/if}
  </div>
</div>
