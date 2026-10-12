<script lang="ts">
  import "../app.css";
  import { onNavigate } from "$app/navigation";
  import { tick } from "svelte";

  import SiteHeader from "#lib/components/SiteHeader.svelte";
  import { navigationState } from "#lib/navigation-state.svelte.js";
  import type { LayoutProps } from "./$types";

  let { children }: LayoutProps = $props();

  // Animate page changes with the View Transitions API where the browser supports it.
  // Same-page navigations (search and tag filters update the query string) skip it.
  onNavigate(async (navigation) => {
    if (navigation.from?.url.pathname === navigation.to?.url.pathname) return;
    navigationState.animateCards = false;
    navigationState.openedFromList =
      navigation.from?.route.id === "/" && navigation.to?.route.id === "/templates/[id]";
    if (!document.startViewTransition) return;

    // Name only the card being opened (or returned to) before the old page is captured.
    navigationState.morphId = navigation.to?.params?.id ?? navigation.from?.params?.id ?? null;
    await tick();

    return new Promise((resolve) => {
      document.startViewTransition(async () => {
        resolve();
        await navigation.complete;
      });
    });
  });
</script>

<SiteHeader />
<main class="mx-auto max-w-6xl px-4 pt-10 pb-24 sm:px-6">
  {@render children()}
</main>
<footer class="border-t border-border py-8 text-center text-xs text-muted-foreground">
  Community Docker Compose templates for
  <a
    class="text-foreground hover:text-primary"
    href="https://getarcane.app"
    target="_blank"
    rel="noopener">Arcane</a
  >.
  <a
    class="ml-2 text-foreground hover:text-primary"
    href="https://github.com/getarcaneapp/templates/blob/main/CONTRIBUTING.md"
    target="_blank"
    rel="noopener">Contribute a template</a
  >
</footer>
