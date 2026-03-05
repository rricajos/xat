<script lang="ts">
  import { enhance } from "$app/forms";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  let showCategoryForm = $state(false);
  let showArticleForm = $state(false);
  let activeTab = $state<"articles" | "categories" | "settings">("articles");
  let confirmDeletePortal = $state(false);
</script>

<div class="h-full overflow-y-auto bg-white dark:bg-gray-950">
  <div class="mx-auto max-w-4xl p-6">
    <!-- Header -->
    <div class="mb-6">
      <a href="/app/help-center" class="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400">
        &larr; Back to Portals
      </a>
      <h2 class="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
        {data.portal.name}
      </h2>
      <p class="text-sm text-gray-500 dark:text-gray-400">/hc/{data.portal.slug}</p>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-6">
      {#each [
        { id: "articles" as const, label: `Articles (${data.articles.length})` },
        { id: "categories" as const, label: `Categories (${data.categories.length})` },
        { id: "settings" as const, label: "Settings" },
      ] as tab}
        <button
          onclick={() => (activeTab = tab.id)}
          class="px-4 py-2 text-sm font-medium border-b-2 -mb-px {activeTab === tab.id
            ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}"
        >
          {tab.label}
        </button>
      {/each}
    </div>

    {#if activeTab === "articles"}
      <!-- Articles Tab -->
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Articles</h3>
        <button
          onclick={() => (showArticleForm = !showArticleForm)}
          class="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          {showArticleForm ? "Cancel" : "New Article"}
        </button>
      </div>

      {#if showArticleForm}
        <form
          method="POST"
          action="?/createArticle"
          use:enhance
          class="mb-6 rounded-lg border border-gray-200 p-4 space-y-3 dark:border-gray-700"
        >
          <div>
            <label for="article-title" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
            <input
              id="article-title"
              name="title"
              type="text"
              required
              class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label for="article-cat" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
            <select
              id="article-cat"
              name="categoryId"
              class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="">None</option>
              {#each data.categories as cat}
                <option value={cat.id}>{cat.name}</option>
              {/each}
            </select>
          </div>
          <div>
            <label for="article-content" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Content</label>
            <textarea
              id="article-content"
              name="content"
              rows="6"
              placeholder="Write article content in HTML or Markdown..."
              class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            ></textarea>
          </div>
          <button
            type="submit"
            class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Create Article (Draft)
          </button>
        </form>
      {/if}

      <div class="space-y-2">
        {#each data.articles as article}
          <div class="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <div>
              <a
                href="/app/help-center/{data.portal.id}/articles/{article.id}"
                class="text-sm font-medium text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
              >
                {article.title}
              </a>
              <div class="mt-1 flex items-center gap-2 text-xs text-gray-400">
                <span class="rounded-full px-1.5 py-0.5 {article.status === 'published'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}">
                  {article.status}
                </span>
                <span>{article.views ?? 0} views</span>
                <span>Updated {new Date(article.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              {#if article.status === "draft"}
                <form method="POST" action="?/publishArticle" use:enhance>
                  <input type="hidden" name="articleId" value={article.id} />
                  <button type="submit" class="text-xs text-green-600 hover:text-green-700 dark:text-green-400">
                    Publish
                  </button>
                </form>
              {:else}
                <form method="POST" action="?/unpublishArticle" use:enhance>
                  <input type="hidden" name="articleId" value={article.id} />
                  <button type="submit" class="text-xs text-yellow-600 hover:text-yellow-700 dark:text-yellow-400">
                    Unpublish
                  </button>
                </form>
              {/if}
              <form method="POST" action="?/deleteArticle" use:enhance>
                <input type="hidden" name="articleId" value={article.id} />
                <button type="submit" class="text-xs text-red-500 hover:text-red-700 dark:text-red-400">
                  Delete
                </button>
              </form>
            </div>
          </div>
        {/each}

        {#if data.articles.length === 0}
          <p class="text-center py-8 text-sm text-gray-400">No articles yet. Create your first one.</p>
        {/if}
      </div>
    {:else if activeTab === "categories"}
      <!-- Categories Tab -->
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Categories</h3>
        <button
          onclick={() => (showCategoryForm = !showCategoryForm)}
          class="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          {showCategoryForm ? "Cancel" : "New Category"}
        </button>
      </div>

      {#if showCategoryForm}
        <form
          method="POST"
          action="?/createCategory"
          use:enhance
          class="mb-6 rounded-lg border border-gray-200 p-4 space-y-3 dark:border-gray-700"
        >
          <div>
            <label for="cat-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
            <input
              id="cat-name"
              name="name"
              type="text"
              required
              class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label for="cat-desc" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
            <input
              id="cat-desc"
              name="description"
              type="text"
              class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <button
            type="submit"
            class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Create Category
          </button>
        </form>
      {/if}

      <div class="space-y-2">
        {#each data.categories as category}
          <div class="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <div>
              <h4 class="text-sm font-medium text-gray-900 dark:text-white">{category.name}</h4>
              {#if category.description}
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{category.description}</p>
              {/if}
              <p class="text-xs text-gray-400 mt-1">/{category.slug}</p>
            </div>
            <form method="POST" action="?/deleteCategory" use:enhance>
              <input type="hidden" name="categoryId" value={category.id} />
              <button type="submit" class="text-xs text-red-500 hover:text-red-700 dark:text-red-400">
                Delete
              </button>
            </form>
          </div>
        {/each}

        {#if data.categories.length === 0}
          <p class="text-center py-8 text-sm text-gray-400">No categories yet. Create your first one.</p>
        {/if}
      </div>
    {:else}
      <!-- Settings Tab -->
      <form
        method="POST"
        action="?/updatePortal"
        use:enhance
        class="space-y-4"
      >
        <div>
          <label for="portal-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Portal Name</label>
          <input
            id="portal-name"
            name="name"
            type="text"
            required
            value={data.portal.name}
            class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div>
          <label for="portal-header" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Header Text</label>
          <input
            id="portal-header"
            name="headerText"
            type="text"
            value={data.portal.headerText ?? ""}
            placeholder="Welcome to our Help Center"
            class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div>
          <label for="portal-title" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Page Title</label>
          <input
            id="portal-title"
            name="pageTitle"
            type="text"
            value={data.portal.pageTitle ?? ""}
            placeholder="Help Center - My Company"
            class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="portal-color" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Brand Color</label>
            <div class="mt-1 flex items-center gap-2">
              <input
                id="portal-color"
                name="color"
                type="color"
                value={data.portal.color ?? "#3B82F6"}
                class="h-9 w-9 rounded border border-gray-300 dark:border-gray-600"
              />
              <span class="text-sm text-gray-500 dark:text-gray-400">{data.portal.color ?? "#3B82F6"}</span>
            </div>
          </div>
          <div>
            <label for="portal-domain" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Custom Domain</label>
            <input
              id="portal-domain"
              name="customDomain"
              type="text"
              value={data.portal.customDomain ?? ""}
              placeholder="help.example.com"
              class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>

        <div class="rounded-md bg-gray-50 dark:bg-gray-800 p-3">
          <p class="text-xs text-gray-500 dark:text-gray-400">
            <strong>Public URL:</strong> /hc/{data.portal.slug}
            {#if data.portal.customDomain}
              <br /><strong>Custom Domain:</strong> {data.portal.customDomain}
            {/if}
          </p>
        </div>

        <button
          type="submit"
          class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Save Settings
        </button>
      </form>

      <!-- Danger Zone -->
      <div class="mt-8 rounded-lg border border-red-200 p-4 dark:border-red-900/50">
        <h3 class="text-sm font-semibold text-red-600 dark:text-red-400">Danger Zone</h3>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-3">
          Deleting a portal will permanently remove all its articles and categories.
        </p>
        {#if confirmDeletePortal}
          <div class="flex items-center gap-2">
            <form method="POST" action="?/deletePortal" use:enhance>
              <button
                type="submit"
                class="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
              >
                Yes, delete this portal
              </button>
            </form>
            <button
              onclick={() => (confirmDeletePortal = false)}
              class="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
          </div>
        {:else}
          <button
            onclick={() => (confirmDeletePortal = true)}
            class="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            Delete Portal
          </button>
        {/if}
      </div>
    {/if}
  </div>
</div>
