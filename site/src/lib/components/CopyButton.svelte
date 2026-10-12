<script lang="ts">
  import Check from "@lucide/svelte/icons/check";
  import Copy from "@lucide/svelte/icons/copy";

  let {
    text,
    label = "Copy",
    class: className = "",
  }: { text: string; label?: string; class?: string } = $props();

  let copied = $state(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return;
    }
    copied = true;
    clearTimeout(timer);
    timer = setTimeout(() => (copied = false), 2000);
  }
</script>

<button
  type="button"
  onclick={copy}
  class="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface/50 px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-primary/30 hover:bg-accent {className}"
  aria-live="polite"
>
  {#if copied}
    <Check class="size-3.5 text-success" />
    Copied
  {:else}
    <Copy class="size-3.5" />
    {label}
  {/if}
</button>
