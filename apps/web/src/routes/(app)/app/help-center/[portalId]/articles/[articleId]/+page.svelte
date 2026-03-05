<script lang="ts">
  import { enhance } from "$app/forms";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<div class="h-full overflow-y-auto bg-white dark:bg-gray-900">
  <div class="mx-auto max-w-3xl p-6">
    <a
      href="/app/help-center/{data.portalId}"
      class="text-sm text-blue-600 hover:text-blue-700"
    >
      &larr; Back to Portal
    </a>

    <form method="POST" action="?/save" use:enhance class="mt-4 space-y-4">
      <div>
        <label for="edit-title" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Title
        </label>
        <input
          id="edit-title"
          name="title"
          type="text"
          required
          value={data.article.title}
          class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </div>

      <div>
        <label for="edit-desc" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Description (SEO)
        </label>
        <input
          id="edit-desc"
          name="description"
          type="text"
          value={data.article.description ?? ""}
          placeholder="Brief description for search engines"
          class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="edit-cat" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Category
          </label>
          <select
            id="edit-cat"
            name="categoryId"
            class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="">None</option>
            {#each data.categories as cat}
              <option value={cat.id} selected={data.article.categoryId === cat.id}>
                {cat.name}
              </option>
            {/each}
          </select>
        </div>

        <div>
          <label for="edit-status" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Status
          </label>
          <select
            id="edit-status"
            name="status"
            class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="draft" selected={data.article.status === "draft"}>Draft</option>
            <option value="published" selected={data.article.status === "published"}>Published</option>
            <option value="archived" selected={data.article.status === "archived"}>Archived</option>
          </select>
        </div>
      </div>

      <div>
        <label for="edit-content" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Content
        </label>
        <textarea
          id="edit-content"
          name="content"
          rows="20"
          class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >{data.article.content ?? ""}</textarea>
        <p class="mt-1 text-xs text-gray-400">Supports HTML content</p>
      </div>

      <div class="flex items-center gap-3">
        <button
          type="submit"
          class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Save Article
        </button>
        <span class="text-xs text-gray-400">
          {data.article.views ?? 0} views
        </span>
      </div>
    </form>
  </div>
</div>
