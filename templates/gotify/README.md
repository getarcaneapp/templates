# Gotify

A private push notification server with a web client.

Copy `.env.example` to `.env`, replace every example secret with a unique generated value, adjust the settings, then deploy with `docker compose up -d` or import this template in Arcane. Open `http://localhost:8091` on the Docker host. Ports bind to localhost by default; set `BIND_ADDRESS` to a trusted interface for LAN access, or use a reverse proxy with HTTPS.

Set `ADMIN_PASSWORD` before deploying. These credentials create the initial administrator only; change existing credentials in the UI. Create an application to obtain a token for publishing messages. Use HTTPS when allowing remote access.

Named volumes retain internal application state across container upgrades. Keep a backup before updating images; `docker compose down -v` deletes named volume data.

Upstream: [installation and configuration](https://gotify.net/docs/install).
