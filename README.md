# Arcane Templates Registry

Community-curated Docker Compose templates for [Arcane](https://github.com/getarcaneapp/arcane).
Browse them at [registry.getarcane.app](https://registry.getarcane.app).

## Using the registry

> [!IMPORTANT]
> The community registry has moved to `https://registry.getarcane.app/registry.json`. The old registry at `https://templates.arcane.ofkm.dev/registry.json` is deprecated and will be removed in the future.

Add this URL in Arcane's template settings:

`https://registry.getarcane.app/registry.json`

## Contributing

```bash
vp install
vp run new my-app               # scaffold templates/my-app
vp run lint:templates my-app    # check it (--fix applies automatic fixes)
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the template layout, the linter rules, how the registry is
versioned, and how to work on the site.

## Repository layout

- `templates/<id>/`: one directory per template (`compose.yaml`, `.env.example`, `template.json`, `README.md`)
- `tags.json`: the allowed template tags
- `scripts/`: registry generator, template linter and scaffolder
- `site/`: the SvelteKit site served at registry.getarcane.app
- `schema.json`: JSON schema for `registry.json`

## License

Community contributions welcome. By contributing you agree your changes are licensed under the repository's license.
