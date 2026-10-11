# Gatus

A status dashboard with scheduled endpoint health checks.

Copy `.env.example` to `.env`, adjust the settings, then deploy with `docker compose up -d` or import this template in Arcane. Open `http://localhost:8084` on the Docker host. Ports bind to localhost by default; set `BIND_ADDRESS` to a trusted interface for LAN access, or use a reverse proxy with HTTPS.

Set `MONITOR_URL` and `CHECK_INTERVAL` for your endpoint. The inline configuration is fully contained in Compose and persists history to SQLite. The dashboard is public by design; retain the localhost binding or put it behind an authenticated proxy for private status data. Compose 2.23.1 or newer is required for inline configs.

Named volumes retain internal application state across container upgrades. Keep a backup before updating images; `docker compose down -v` deletes named volume data.

Upstream: [installation and configuration](https://github.com/TwiN/gatus#docker).
