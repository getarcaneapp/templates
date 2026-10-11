# ntfy

Publish and subscribe to push notifications through HTTP topics.

Copy `.env.example` to `.env`, adjust the settings, then deploy with `docker compose up -d` or import this template in Arcane. Open `http://localhost:8090` on the Docker host. Ports bind to localhost by default; set `BIND_ADDRESS` to a trusted interface for LAN access, or use a reverse proxy with HTTPS.

All topic access is denied until users are configured. After deployment run `docker compose exec ntfy ntfy user add --role=admin admin` and enter a strong password interactively. For ordinary accounts use `ntfy user add USER` and `ntfy access USER TOPIC rw`. Set `BASE_URL` to the public HTTPS URL when proxying.

Named volumes retain internal application state across container upgrades. Keep a backup before updating images; `docker compose down -v` deletes named volume data.

Upstream: [installation and configuration](https://docs.ntfy.sh/install/#docker).
