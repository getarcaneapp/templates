<script lang="ts">
  let { src, name, size = 40 }: { src?: string; name: string; size?: number } = $props();

  let failed = $state(false);
</script>

{#if src && !failed}
  <img
    {src}
    alt=""
    width={size}
    height={size}
    loading="lazy"
    class="shrink-0 rounded-lg object-contain"
    style="width: {size}px; height: {size}px"
    onerror={() => (failed = true)}
  />
{:else}
  <div
    class="grid shrink-0 place-items-center rounded-full bg-primary/10 font-semibold text-primary"
    style="width: {size}px; height: {size}px; font-size: {size / 2.4}px"
    aria-hidden="true"
  >
    {name.slice(0, 1).toUpperCase()}
  </div>
{/if}
