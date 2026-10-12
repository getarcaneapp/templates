<script lang="ts">
  import { goto } from "$app/navigation";
  import Search from "@lucide/svelte/icons/search";
  import { onMount } from "svelte";

  import CopyButton from "#lib/components/CopyButton.svelte";
  import TagSelect from "#lib/components/TagSelect.svelte";
  import TemplateCard from "#lib/components/TemplateCard.svelte";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();

  let registryUrl = $state("https://registry.getarcane.app/registry.json");
  let query = $state("");
  let activeTag = $state<string | null>(null);

  // Prerendered pages can't read the query string at build time, so restore it in the browser.
  onMount(() => {
    registryUrl = `${location.origin}/registry.json`;
    const params = new URLSearchParams(location.search);
    query = params.get("q") ?? "";
    activeTag = params.get("tag");
  });

  function syncUrl() {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (activeTag) params.set("tag", activeTag);
    const search = params.toString();
    void goto(search ? `?${search}` : location.pathname, {
      shallow: true,
      replace: true,
      reset: false,
    });
  }

  const tagCounts = $derived.by(() => {
    const counts = new Map<string, number>();
    for (const template of data.templates) {
      for (const tag of template.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  });

  const filtered = $derived.by(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    return data.templates.filter((template) => {
      if (activeTag && !template.tags.includes(activeTag)) return false;
      const haystack = [
        template.id,
        template.name,
        template.description,
        template.author,
        ...template.tags,
      ]
        .join(" ")
        .toLowerCase();
      return terms.every((term) => haystack.includes(term));
    });
  });

  function setTag(tag: string | null) {
    activeTag = tag;
    syncUrl();
  }

  function clearFilters() {
    query = "";
    setTag(null);
  }
</script>

<svelte:head>
  <title>Arcane Templates Registry</title>
  <meta
    name="description"
    content="Browse {data.templates
      .length} community Docker Compose templates and add the registry to Arcane."
  />
</svelte:head>

<section class="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
  <h1 class="text-4xl font-semibold tracking-tight sm:text-5xl">Arcane Templates Registry</h1>
  <p class="max-w-xl text-muted-foreground">
    Community Docker Compose templates, ready to deploy from Arcane. Add the registry URL in
    Arcane's template settings to browse them in the app.
  </p>
  <div
    class="flex w-full max-w-xl items-center gap-2 rounded-xl border border-primary/20 bg-code p-1.5 pl-3 shadow-lg shadow-primary/5"
  >
    <span
      class="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-primary"
      >URL</span
    >
    <input
      readonly
      value={registryUrl}
      onfocus={(event) => event.currentTarget.select()}
      aria-label="Registry URL"
      class="min-w-0 flex-1 bg-transparent font-mono text-sm text-foreground outline-none"
    />
    <CopyButton text={registryUrl} />
  </div>
</section>

<section class="mt-14 flex flex-col gap-3">
  <div
    class="flex h-11 items-stretch overflow-hidden rounded-xl border border-border bg-background transition-colors focus-within:border-primary/40"
  >
    <label class="flex min-w-0 flex-1 items-center gap-3 pl-4">
      <Search class="size-4 shrink-0 text-muted-foreground" />
      <input
        type="search"
        placeholder="Search templates…"
        aria-label="Search templates"
        bind:value={query}
        oninput={syncUrl}
        class="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </label>
    <div class="my-2 w-px bg-border"></div>
    <TagSelect tags={tagCounts} value={activeTag} onchange={setTag} />
  </div>
  <p class="flex items-center gap-2 px-1 text-xs text-muted-foreground">
    {#if query || activeTag}
      {filtered.length} of {data.templates.length} templates
      <button type="button" onclick={clearFilters} class="text-primary hover:underline">
        Clear filters
      </button>
    {:else}
      {data.templates.length} templates
    {/if}
  </p>
</section>

{#if filtered.length === 0}
  <p class="mt-16 text-center text-sm text-muted-foreground">No templates match that search.</p>
{:else}
  <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {#each filtered as template, index (template.id)}
      <TemplateCard {template} {index} />
    {/each}
  </div>
{/if}
