<script lang="ts">
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import ExternalLink from "@lucide/svelte/icons/external-link";
  import { Tabs } from "bits-ui";

  import CopyButton from "#lib/components/CopyButton.svelte";
  import TemplateIcon from "#lib/components/TemplateIcon.svelte";
  import { navigationState } from "#lib/navigation-state.svelte.js";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
  const template = $derived(data.template);

  let activeFile = $state("compose");
  const composeFile = $derived({
    value: "compose",
    label: "compose.yaml",
    raw: template.composeRaw,
    html: template.composeHtml,
  });
  const envFile = $derived({
    value: "env",
    label: ".env.example",
    raw: template.envRaw,
    html: template.envHtml,
  });
  const files = $derived([composeFile, envFile]);
  const current = $derived(activeFile === envFile.value ? envFile : composeFile);

  // Coming from the list, go back in history so the list keeps its scroll position and filters.
  function backToList(event: MouseEvent) {
    if (!navigationState.openedFromList || event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    history.back();
  }
</script>

<svelte:head>
  <title>{template.name} · Arcane Templates</title>
  <meta name="description" content={template.description} />
</svelte:head>

<a
  href="/"
  onclick={backToList}
  class="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
>
  <ArrowLeft class="size-4" /> All templates
</a>

<header class="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start">
  <div
    style="view-transition-name: icon-{template.id}"
    class="flex size-16 shrink-0 items-center justify-center rounded-full border border-border bg-surface/50"
  >
    <TemplateIcon src={template.icon_url} name={template.name} size={36} />
  </div>
  <div class="min-w-0 flex-1">
    <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <h1
        style="view-transition-name: title-{template.id}"
        class="w-fit text-3xl font-semibold tracking-tight"
      >
        {template.name}
      </h1>
      <span class="font-mono text-sm text-muted-foreground">v{template.version}</span>
    </div>
    <p class="mt-2 text-muted-foreground">{template.description}</p>
    <div class="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
      {#each template.tags as tag (tag)}
        <a
          href="/?tag={encodeURIComponent(tag)}"
          class="inline-flex w-fit items-center rounded-md border border-border px-2 py-0.5 font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
          >{tag}</a
        >
      {/each}
      <span class="ml-1 text-muted-foreground">by {template.author}</span>
    </div>
  </div>
</header>

<div
  class="mt-10 grid animate-fade-in-up gap-8 [animation-delay:120ms] lg:grid-cols-[minmax(0,1fr)_280px]"
>
  <div class="flex min-w-0 flex-col gap-8">
    <Tabs.Root
      bind:value={activeFile}
      class="overflow-hidden rounded-xl border border-border bg-code"
    >
      <div class="flex items-center gap-2 border-b border-border px-2">
        <Tabs.List class="flex">
          {#each files as file (file.value)}
            <Tabs.Trigger
              value={file.value}
              class="border-b-2 border-transparent px-3 py-2.5 font-mono text-xs text-muted-foreground transition hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground"
            >
              {file.label}
            </Tabs.Trigger>
          {/each}
        </Tabs.List>
        <div class="ml-auto flex gap-2 py-1.5">
          <a
            href={current.label}
            class="hidden items-center rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground sm:inline-flex"
            target="_blank"
            rel="noopener">Raw</a
          >
          <CopyButton text={current.raw} />
        </div>
      </div>
      {#each files as file (file.value)}
        <Tabs.Content value={file.value} class="animate-fade-in">
          <div class="code-block max-h-[640px] overflow-auto">
            {@html file.html}
          </div>
        </Tabs.Content>
      {/each}
    </Tabs.Root>

    {#if template.readmeHtml}
      <section class="rounded-xl border border-border bg-background p-6">
        <h2 class="mb-4 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          README
        </h2>
        <div class="prose-readme">
          {@html template.readmeHtml}
        </div>
      </section>
    {/if}
  </div>

  <aside class="flex flex-col gap-6 text-sm">
    <section class="rounded-xl border border-border bg-background p-5">
      <h2 class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Services</h2>
      <ul class="mt-3 flex flex-col gap-3">
        {#each template.services as service (service.name)}
          <li>
            <p class="font-medium">{service.name}</p>
            {#if service.image}
              <p class="truncate font-mono text-xs text-muted-foreground" title={service.image}>
                {service.image}
              </p>
            {/if}
            {#if service.ports.length > 0}
              <p class="font-mono text-xs text-muted-foreground">
                ports {service.ports.join(", ")}
              </p>
            {/if}
          </li>
        {/each}
      </ul>
    </section>

    <section class="flex flex-col gap-2 rounded-xl border border-border bg-background p-5">
      <h2 class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Links</h2>
      {#each template.urls as url (url)}
        <a
          href={url}
          target="_blank"
          rel="noopener"
          class="flex items-center gap-1.5 truncate text-primary hover:underline"
        >
          <ExternalLink class="size-3.5 shrink-0" />
          <span class="truncate">{url.replace(/^https?:\/\//, "")}</span>
        </a>
      {/each}
      <a
        href={template.documentationUrl}
        target="_blank"
        rel="noopener"
        class="flex items-center gap-1.5 text-primary hover:underline"
      >
        <ExternalLink class="size-3.5 shrink-0" /> Source on GitHub
      </a>
    </section>
  </aside>
</div>
