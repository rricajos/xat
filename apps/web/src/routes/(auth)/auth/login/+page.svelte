<script lang="ts">
  import { enhance } from "$app/forms";

  let { form } = $props();
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50">
  <div class="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-sm">
    <div class="text-center">
      <h1 class="text-2xl font-bold text-gray-900">Xat</h1>
      <p class="mt-2 text-sm text-gray-600">Sign in to your account</p>
    </div>

    {#if form?.error}
      <div class="rounded-md bg-red-50 p-4 text-sm text-red-700">
        {form.error}
      </div>
    {/if}

    <form method="POST" use:enhance class="space-y-6">
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          value={form?.email ?? ""}
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label for="password" class="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        class="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Sign in
      </button>
    </form>

    <p class="text-center text-sm text-gray-600">
      Don't have an account?
      <a href="/auth/register" class="font-medium text-blue-600 hover:text-blue-500">
        Create one
      </a>
    </p>
  </div>
</div>
