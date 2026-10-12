<script lang="ts">
  import { navigationState } from "#lib/navigation-state.svelte.js";
  import type { TemplateSummary } from "#lib/types.js";
  import TemplateIcon from "./TemplateIcon.svelte";

  let { template, index = 0 }: { template: TemplateSummary; index?: number } = $props();

  const morphs = $derived(navigationState.morphId === template.id);
</script>

<!-- Card pattern from the getarcane.app website (CommunityCard / features grid). -->
<a
  href="/templates/{template.id}/"
  style:animation-delay={navigationState.animateCards ? `${Math.min(index, 12) * 30}ms` : undefined}
  class:animate-fade-in-up={navigationState.animateCards}
  class="group relative flex h-full flex-col gap-3 overflow-hidden rounded-xl border border-border bg-background p-5 transition-all duration-300 hover:border-primary/30 hover:bg-linear-to-b hover:from-primary/2 hover:to-transparent hover:shadow-sm hover:shadow-primary/5"
>
  <div
    class="absolute inset-x-0 top-0 h-0.5 scale-x-0 bg-linear-to-r from-transparent via-primary/40 to-transparent transition-transform duration-300 group-hover:scale-x-100"
  ></div>
  <div class="flex items-center gap-3">
    <div
      style:view-transition-name={morphs ? `icon-${template.id}` : undefined}
      class="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface/50 transition-all duration-300 group-hover:border-primary/30 group-hover:bg-primary/5"
    >
      <TemplateIcon src={template.icon_url} name={template.name} size={22} />
    </div>
    <div class="min-w-0 flex-1">
      <h3
        style:view-transition-name={morphs ? `title-${template.id}` : undefined}
        class="w-fit max-w-full truncate text-sm font-medium text-foreground transition-colors duration-300 group-hover:text-primary/90"
      >
        {template.name}
      </h3>
      <p class="truncate text-xs text-muted-foreground">{template.author} · v{template.version}</p>
    </div>
  </div>
  <p class="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
    {template.description}
  </p>
  <div class="mt-auto flex flex-wrap gap-1.5 pt-1">
    {#each template.tags as tag (tag)}
      <span
        class="inline-flex w-fit items-center rounded-md border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground"
        >{tag}</span
      >
    {/each}
  </div>
</a>
