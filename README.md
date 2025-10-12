# Arcane Templates Registry

Community-curated Docker Compose templates for [Arcane](https://github.com/ofkm/arcane).

## Using the Registry

> [!IMPORTANT]
> The community registry has been updated to the new url `https://registry.getarcane.app/registry.json`, the old registry at `https://templates.arcane.ofkm.dev/registry.json` is considered deprecated and will be removed in the future

Add this URL in Arcane’s Templates settings:

`https://registry.getarcane.app/registry.json`

## How It Works

- Source of truth: each template lives under `templates/<id>/` and includes:
  - `compose.yaml` (or docker-compose.yml/.yaml)
  - `.env.example`
  - `template.json` (metadata; see example below)
- Auto-generation: [scripts/build-registry.ts](scripts/build-registry.ts) scans `templates/` and generates [registry.json](registry.json) that follows [schema.json](schema.json).
- Do not edit or commit `registry.json` in PRs — CI builds and publishes it on merge to `main`.
- Versioning policy: the registry version auto-bumps (minor by default) when a new template ID is added.
- CI: [GitHub Actions](.github/workflows/build-registry.yml) type-checks, generates, validates against the schema, and commits updated `registry.json`.

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
├─ compose.yaml            # or docker-compose.yml/.yaml, compose.yml
├─ .env.example
└─ template.json
```

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

5. Test locally (Node 24+, pnpm):

```bash
pnpm install
pnpm run type-check
pnpm run validate
```

6. Open a Pull Request

Tips:

- The generator accepts compose files named: compose.yaml, docker-compose.yml, docker-compose.yaml, compose.yml.
- `.env.example` is required.
- Tags should be lowercase, hyphenated.

## Development

- Validate data against the registry schema: [schema.json](schema.json)
- Run locally on macOS:

```bash
pnpm install
pnpm run validate
```

## License

Community contributions welcome. By contributing you agree your changes are licensed under the repository’s license.
