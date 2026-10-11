# Changedetection.io

Monitor websites for content changes and deliver notifications.

Copy `.env.example` to `.env`, adjust the settings, then deploy with `docker compose up -d` or import this template in Arcane. Open `http://localhost:5000` on the Docker host. Ports bind to localhost by default; set `BIND_ADDRESS` to a trusted interface for LAN access, or use a reverse proxy with HTTPS.

Set the UI password in Settings immediately after first launch, before exposing network access. This template uses the built-in HTTP fetcher; JavaScript browser steps require an optional separate browser service as documented upstream. Set `BASE_URL` for links behind a proxy.

Named volumes retain internal application state across container upgrades. Keep a backup before updating images; `docker compose down -v` deletes named volume data.

Upstream: [installation and configuration](https://github.com/dgtlmoon/changedetection.io#installation).
