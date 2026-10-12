<script lang="ts">
  import Check from "@lucide/svelte/icons/check";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import TagIcon from "@lucide/svelte/icons/tag";
  import { Select } from "bits-ui";

  let {
    tags,
    value,
    onchange,
  }: {
    tags: [tag: string, count: number][];
    value: string | null;
    onchange: (tag: string | null) => void;
  } = $props();

  const ALL = "";
  const items = $derived([
    { value: ALL, label: "All tags" },
    ...tags.map(([tag]) => ({ value: tag, label: tag })),
  ]);
  const itemClass =
    "flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground outline-none select-none data-highlighted:bg-accent data-highlighted:text-foreground data-selected:text-foreground";
</script>

<Select.Root
  type="single"
  value={value ?? ALL}
  onValueChange={(next) => onchange(next || null)}
  {items}
>
  <Select.Trigger
    aria-label="Filter by tag"
    class="inline-flex h-full shrink-0 items-center gap-2 px-4 text-sm transition-colors hover:text-foreground {value
      ? 'text-primary'
      : 'text-muted-foreground'}"
  >
    <TagIcon class="size-3.5" />
    <span class="max-w-36 truncate">{value ?? "All tags"}</span>
    <ChevronDown class="size-3.5 opacity-60" />
  </Select.Trigger>
  <Select.Portal>
    <Select.Content
      sideOffset={8}
      align="end"
      class="z-50 w-60 animate-pop-in rounded-xl border border-border bg-popover p-1 shadow-lg shadow-black/40"
    >
      <Select.Viewport class="max-h-80 overflow-y-auto">
        <Select.Item value={ALL} label="All tags" class={itemClass}>
          {#snippet children({ selected })}
            <Check class="size-3.5 shrink-0 text-primary {selected ? '' : 'invisible'}" />
            <span class="flex-1">All tags</span>
          {/snippet}
        </Select.Item>
        <div class="my-1 h-px bg-border"></div>
        {#each tags as [tag, count] (tag)}
          <Select.Item value={tag} label={tag} class={itemClass}>
            {#snippet children({ selected })}
              <Check class="size-3.5 shrink-0 text-primary {selected ? '' : 'invisible'}" />
              <span class="flex-1 truncate">{tag}</span>
              <span class="font-mono text-xs text-muted-foreground/70">{count}</span>
            {/snippet}
          </Select.Item>
        {/each}
      </Select.Viewport>
    </Select.Content>
  </Select.Portal>
</Select.Root>
