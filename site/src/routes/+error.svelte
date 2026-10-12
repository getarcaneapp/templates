<script lang="ts">
  import { page } from "$app/state";
</script>

<svelte:head>
  <title>{page.status} · Arcane Templates</title>
</svelte:head>

<div class="mx-auto max-w-md py-24 text-center">
  <p class="font-mono text-sm text-primary">{page.status}</p>
  <h1 class="mt-2 text-2xl font-semibold">
    {page.status === 404 ? "Page not found" : "Something went wrong"}
  </h1>
  <p class="mt-3 text-sm text-muted-foreground">{page.error?.message}</p>
  <a
    href="/"
    class="mt-8 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
  >
    Browse templates
  </a>
</div>
