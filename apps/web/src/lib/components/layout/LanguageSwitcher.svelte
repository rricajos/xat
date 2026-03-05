<script lang="ts">
  import { availableLanguageTags, languageTag } from "$lib/paraglide/runtime";
  import { i18n } from "$lib/i18n";
  import { page } from "$app/stores";
  import * as m from "$lib/paraglide/messages";

  const languageNames: Record<string, string> = {
    en: "English",
    es: "Español",
    pt: "Português",
    fr: "Français",
    de: "Deutsch",
  };
</script>

<div class="flex items-center gap-2">
  <label for="language-select" class="text-sm font-medium text-gray-700 dark:text-gray-300">
    {m.settings_locale()}
  </label>
  <div class="flex gap-1">
    {#each availableLanguageTags as lang}
      {@const href = i18n.route($page.url.pathname)}
      <a
        href={lang === "en" ? href : `/${lang}${href}`}
        hreflang={lang}
        class="rounded-md px-2.5 py-1 text-xs font-medium transition-colors {lang === languageTag()
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
          : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}"
      >
        {languageNames[lang] ?? lang}
      </a>
    {/each}
  </div>
</div>
