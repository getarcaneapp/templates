# HomeBox

Home inventory and organization with photos, labels, and searchable items.

Copy `.env.example` to `.env`, replace every example secret with a unique generated value, adjust the settings, then deploy with `docker compose up -d` or import this template in Arcane. Open `http://localhost:3100` on the Docker host. Ports bind to localhost by default; set `BIND_ADDRESS` to a trusted interface for LAN access, or use a reverse proxy with HTTPS.

Generate `API_KEY_PEPPER` with `openssl rand -hex 32`. Register the first account while access is restricted, then set `ALLOW_REGISTRATION=false` and recreate the container. Keep the pepper stable across upgrades.

Named volumes retain internal application state across container upgrades. Keep a backup before updating images; `docker compose down -v` deletes named volume data.

Upstream: [installation and configuration](https://github.com/sysadminsmedia/homebox/blob/main/docs/src/content/docs/en/quick-start/install.mdx).
