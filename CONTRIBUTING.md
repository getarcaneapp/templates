# Contributing a template

Each template lives in `templates/<id>/`, where `<id>` is lowercase letters, digits and hyphens:

```
templates/my-app/
├─ compose.yaml     # the Compose project (this exact name)
├─ .env.example     # every variable compose.yaml uses without a default
├─ template.json    # name, description, author, icon_url, tags
└─ README.md        # deployment notes
```

## Quick start

You need [Vite+](https://viteplus.dev) (`vp`), Node 26+, and Docker Compose.

```bash
vp install
vp run new my-app                 # prompts for name, image, port, tags, ...
# edit templates/my-app/compose.yaml, .env.example and README.md
vp run lint:templates my-app      # add --fix to apply automatic fixes
```

`vp run new` writes a template that already passes the linter. Pass flags such as
`--image ghcr.io/me/my-app --port 8080 --tags tools,files --yes` to skip the prompts.

Then open a pull request. CI runs the same checks, and a preview of the registry site is deployed for the PR.

## Rules the linter checks

`vp run lint:templates` (also `vp run validate`) checks every template, or only the ids you pass.

| Rule               | What it checks                                                                                                                   | `--fix` |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `compose-filename` | The compose file is named `compose.yaml`.                                                                                        | Renames |
| `icon-sync`        | `template.json` has `icon_url`, `x-arcane.icon` matches it, and every service has a `com.getarcaneapp.arcane.icon` label.        | Yes     |
| `image-latest`     | Images use `:latest` (or an upstream channel tag such as `stable`). Exceptions live in `scripts/lint/image-exceptions.ts`.       | Yes     |
| `tag-vocabulary`   | Tags come from [`tags.json`](tags.json). Old spellings listed under `aliases` are rewritten.                                     | Yes     |
| `env-coverage`     | Every `${VAR}` without a default is in `.env.example`. Unused variables are a warning unless a service loads `env_file`.         |         |
| `no-secrets`       | Passwords, secrets, tokens and keys in `.env.example` are empty or obvious placeholders such as `change-me`.                     |         |
| `template-json`    | `template.json` parses and has `name`, `description`, `author` and `tags`.                                                       |         |
| `slug`             | The directory name is a valid id.                                                                                                |         |
| `compose-config`   | `docker compose config -q` accepts the template with `.env.example` as its `.env`. Skipped with `--no-docker` or without Docker. |         |
| `restart-policy`   | Every service sets `restart:` (warning).                                                                                         |         |
| `readme`           | `README.md` exists and has a `## Deployment` section (warning).                                                                  |         |

The linter also builds the registry and validates it against [`schema.json`](schema.json).

### Image tags

Templates track `:latest` so users get updates when they pull. The exceptions are databases and other
stateful services, which keep a major-version tag because a major upgrade can change their on-disk
format, and images whose `latest` tag is missing or points at an older major. To pin a new image, add it
to `scripts/lint/image-exceptions.ts` with the reason.

## template.json

```json
{
  "name": "My App",
  "description": "What it does, in one line.",
  "author": "Your name or GitHub handle",
  "icon_url": "https://cdn.jsdelivr.net/gh/selfhst/icons@main/svg/my-app.svg",
  "tags": ["tools"]
}
```

- `icon_url`: [selfh.st icons](https://selfh.st/icons/) has most self-hosted apps. The same URL goes in
  `x-arcane.icon` and the service labels; `lint:templates --fix` copies it there.
- `version` is optional. Leave it out and the generator manages it, adding a patch bump whenever the
  template's files change. A version you set yourself always wins.

## How the registry is built

`vp run generate` scans `templates/` and writes [`registry.json`](registry.json). Do not edit or commit
`registry.json` in pull requests; CI regenerates and commits it on merge to `main`.

Every entry has a `content_hash` computed from `template.json`, `compose.yaml`, `.env.example` and
`README.md`. The registry version moves when templates change:

- a new template bumps the minor version (`BUMP_PART`, default `minor`)
- a changed or removed template bumps the patch version (`CHANGED_TEMPLATE_BUMP_PART`, default `patch`)

`PUBLIC_BASE`, `DOCS_BASE`, `SCHEMA_URL`, `REGISTRY_NAME`, `REGISTRY_DESCRIPTION`, `REGISTRY_AUTHOR`
and `REGISTRY_URL` override the generated metadata and URLs (the PR preview workflow uses them).

## The registry site

`site/` is a SvelteKit app that prerenders the catalog at registry.getarcane.app, with a page for every
template. It reads `templates/` through the same code as the generator.

```bash
vp run dev          # site dev server
vp run stage        # build the site and copy registry.json, schema.json and templates/ into build/
vp run dev:worker   # generate + stage, then serve build/ with wrangler like production
```

## Before opening a pull request

```bash
vp check                 # format, lint and type-check
vp run type-check        # includes svelte-check for the site
vp run validate          # lint templates and validate the registry
vp run test
```
