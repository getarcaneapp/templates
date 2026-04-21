# Arcane Templates Registry

Community-curated Docker Compose templates for [Arcane](https://github.com/ofkm/arcane).

## Using the Registry

> [!IMPORTANT]
> The community registry has been updated to the new url `https://registry.getarcane.app/registry.json`, the old registry at `https://templates.arcane.ofkm.dev/registry.json` is considered deprecated and will be removed in the future

Add this URL in Arcane’s Templates settings:

`https://registry.getarcane.app/registry.json`

## How It Works

- Source of truth: each template lives under `templates/<id>/` and includes:
  - `compose.yaml` (or `compose.yml`, `docker-compose.yml`, `docker-compose.yaml`)
  - `.env.example`
  - `template.json` (metadata; see example below)
- Optional: `README.md` for extra setup notes or caveats.
- Auto-generation: [scripts/build-registry.ts](scripts/build-registry.ts) scans `templates/` and generates [registry.json](registry.json) that follows [schema.json](schema.json).
- Do not edit or commit `registry.json` in PRs — CI builds and publishes it on merge to `main`.
- Every generated template now includes a `content_hash` fingerprint derived from `template.json`, the compose file, `.env.example`, and `README.md` when present.
- Versioning policy:
  - New template IDs bump the registry version using `BUMP_PART` (minor by default).
  - Updates to existing templates also bump the registry version so consumers can detect changes.
  - Removals bump the registry version too.
- PR validation: [GitHub Actions](.github/workflows/validate.yml) type-checks, validates the generated registry against [schema.json](schema.json), and runs `docker compose config -q` against every template.
- Deploy CI: [GitHub Actions](.github/workflows/build-registry.yml) validates on `main`, generates, and commits updated `registry.json`.

The generated registry entry shape looks like this:

```json
{
  "id": "homepage",
  "name": "Homepage",
  "description": "A modern, fully static application dashboard.",
  "version": "1.0.0",
  "author": "Community",
  "compose_url": "https://registry.getarcane.app/templates/homepage/compose.yaml",
  "env_url": "https://registry.getarcane.app/templates/homepage/.env.example",
  "documentation_url": "https://github.com/getarcaneapp/templates/tree/main/templates/homepage",
  "content_hash": "4c0ffee4c0ffee4c0ffee4c0ffee4c0ffee4c0ffee4c0ffee4c0ffee4c0ffee",
  "tags": ["dashboard", "homepage"]
}
```

## Contributing a Template

1. Fork this repo

2. Create a directory in `templates/` using a lowercase, hyphenated ID:

```bash
cd templates
mkdir my-awesome-template
```

3. Add required files:

```
templates/my-awesome-template/
├─ compose.yaml            # preferred; compose.yml/docker-compose*.y*ml also work
├─ .env.example
└─ template.json
```

If the template needs extra setup notes, add `README.md` too.

4. template.json example:

```json
{
  "name": "My Awesome Template",
  "description": "What it does and why it’s useful.",
  "version": "1.0.0",
  "author": "Your Name or Org",
  "tags": ["category", "another-tag"]
}
```

5. Test locally (Node 25+, pnpm, Docker Compose):

```bash
pnpm install
pnpm run format
pnpm run lint
pnpm run test
pnpm run validate
```

For non-interactive shells or CI-like environments, set `CI=true` before the commands above.

6. Open a Pull Request

Tips:

- The generator accepts compose files named: compose.yaml, docker-compose.yml, docker-compose.yaml, compose.yml.
- `.env.example` is required.
- Tags should be lowercase, hyphenated.
- `README.md` changes are included in the template fingerprint, so docs updates are visible in the published registry version.

## Development

- Validate data against the registry schema: [schema.json](schema.json)

```bash
pnpm install
pnpm run format
pnpm run lint
pnpm run test
pnpm run validate
pnpm run generate
```

Environment variables supported by the generator:

- `BUMP_PART`: bump part used when brand new template IDs are added. Defaults to `minor`.
- `CHANGED_TEMPLATE_BUMP_PART`: bump part used when an existing template changes or is removed. Defaults to `patch`.
- `PUBLIC_BASE`, `DOCS_BASE`, `SCHEMA_URL`, `REGISTRY_NAME`, `REGISTRY_DESCRIPTION`, `REGISTRY_AUTHOR`, `REGISTRY_URL`: override generated registry metadata and URLs.

## License

Community contributions welcome. By contributing you agree your changes are licensed under the repository’s license.
