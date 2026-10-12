<script lang="ts">
  import { page } from "$app/state";

  const links = [
    { href: "/", label: "Templates" },
    { href: "/docs/", label: "Docs" },
  ];

  const isActive = (href: string) =>
    href === "/"
      ? page.url.pathname === "/" || page.url.pathname.startsWith("/templates/")
      : page.url.pathname.startsWith(href);
</script>

<header
  class="site-header sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-lg"
>
  <nav class="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:gap-6 sm:px-6">
    <a href="/" class="flex items-center gap-2 font-semibold">
      <img src="/logo.svg" alt="" width="22" height="22" />
      <span>Arcane <span class="hidden text-muted-foreground sm:inline">Templates</span></span>
    </a>
    <div class="flex items-center gap-1 text-sm">
      {#each links as link (link.href)}
        <a
          href={link.href}
          class="rounded-md px-3 py-1.5 transition {isActive(link.href)
            ? 'bg-accent text-foreground'
            : 'text-muted-foreground hover:text-foreground'}">{link.label}</a
        >
      {/each}
    </div>
    <a
      href="https://github.com/getarcaneapp/templates"
      class="ml-auto text-sm text-muted-foreground transition hover:text-foreground"
      target="_blank"
      rel="noopener">GitHub</a
    >
  </nav>
</header>
