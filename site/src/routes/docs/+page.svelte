<script lang="ts">
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();

  const rules = [
    {
      title: "New template",
      bump: "minor",
      body: "Adding a template directory bumps the registry's minor version.",
    },
    {
      title: "Changed or removed template",
      bump: "patch",
      body: "Any change to a template's files, or removing a template, bumps the registry's patch version.",
    },
    {
      title: "Template versions",
      bump: "patch",
      body: "If template.json leaves out version, the template's version gets a patch bump whenever its content_hash changes. A version written in template.json always wins.",
    },
  ];
</script>

<svelte:head>
  <title>Docs · Arcane Templates</title>
</svelte:head>

<div class="mx-auto flex max-w-3xl flex-col gap-12">
  <header>
    <h1 class="text-3xl font-semibold tracking-tight">How the registry works</h1>
    <p class="mt-3 text-muted-foreground">
      Each template lives in <code class="font-mono text-foreground">templates/&lt;id&gt;/</code> in
      the
      <a
        class="text-primary hover:underline"
        href="https://github.com/getarcaneapp/templates"
        target="_blank"
        rel="noopener">GitHub repository</a
      >. On every merge to <code class="font-mono text-foreground">main</code>, CI generates
      <a class="text-primary hover:underline" href="/registry.json">registry.json</a>, which is
      currently at
      <span class="font-mono text-foreground">v{data.registryVersion}</span> with {data.templateCount}
      templates.
    </p>
  </header>

  <section>
    <h2 class="text-lg font-semibold">Use it in Arcane</h2>
    <ol class="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
      <li>Open <strong class="text-foreground">Settings → Templates</strong> in Arcane.</li>
      <li>
        Add <code class="font-mono text-foreground"
          >https://registry.getarcane.app/registry.json</code
        > as a registry.
      </li>
      <li>Pick a template, fill in its environment values, and deploy.</li>
    </ol>
  </section>

  <section>
    <h2 class="text-lg font-semibold">Template files</h2>
    <dl class="mt-3 grid gap-3 text-sm sm:grid-cols-2">
      {#each [["compose.yaml", "The Compose project. Images track :latest, except databases pinned to a major version."], [".env.example", "Every variable the compose file uses without a default. Secrets are placeholders."], ["template.json", "Name, description, author, icon_url and tags. version is optional."], ["README.md", "Deployment notes: first-run steps, paths and links to upstream docs."]] as [file, text] (file)}
        <div class="rounded-xl border border-border bg-background p-4">
          <dt class="font-mono text-foreground">{file}</dt>
          <dd class="mt-1 text-muted-foreground">{text}</dd>
        </div>
      {/each}
    </dl>
  </section>

  <section>
    <h2 class="text-lg font-semibold">Versioning</h2>
    <p class="mt-2 text-sm text-muted-foreground">
      Every template carries a <code class="font-mono text-foreground">content_hash</code> computed from
      template.json, compose.yaml, .env.example and README.md, so Arcane can see when a template changed.
    </p>
    <div class="mt-4 grid gap-3 sm:grid-cols-3">
      {#each rules as rule (rule.title)}
        <div class="rounded-xl border border-border bg-background p-4 text-sm">
          <span
            class="rounded-md border border-primary/30 bg-primary/10 px-1.5 py-0.5 font-mono text-[11px] text-primary"
            >{rule.bump}</span
          >
          <h3 class="mt-2 font-medium">{rule.title}</h3>
          <p class="mt-1 text-muted-foreground">{rule.body}</p>
        </div>
      {/each}
    </div>
  </section>

  <section>
    <h2 class="text-lg font-semibold">Contributing</h2>
    <pre
      class="mt-3 overflow-x-auto rounded-xl border border-border bg-code p-4 font-mono text-[13px] text-muted-foreground">vp install
vp run new my-app             # scaffold templates/my-app
vp run lint:templates my-app  # check it, add --fix for automatic fixes</pre>
    <p class="mt-3 text-sm text-muted-foreground">
      See <a
        class="text-primary hover:underline"
        href="https://github.com/getarcaneapp/templates/blob/main/CONTRIBUTING.md"
        target="_blank"
        rel="noopener">CONTRIBUTING.md</a
      > for the full checklist.
    </p>
  </section>

  <section>
    <h2 class="text-lg font-semibold">Tags</h2>
    <p class="mt-2 text-sm text-muted-foreground">Templates use tags from this list (tags.json).</p>
    <div class="mt-4 overflow-hidden rounded-xl border border-border">
      <table class="w-full text-left text-sm">
        <tbody>
          {#each data.tags as { tag, description, count } (tag)}
            <tr class="border-b border-border last:border-0">
              <td class="px-4 py-2 font-mono">
                <a href="/?tag={encodeURIComponent(tag)}" class="text-foreground hover:text-primary"
                  >{tag}</a
                >
              </td>
              <td class="px-4 py-2 text-muted-foreground">{description}</td>
              <td class="px-4 py-2 text-right font-mono text-muted-foreground">{count}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </section>
</div>
