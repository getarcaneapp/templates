# Grocy

Household groceries, stock, recipes, chores, and shopping lists.

Copy `.env.example` to `.env`, adjust the settings, then deploy with `docker compose up -d` or import this template in Arcane. Open `http://localhost:9283` on the Docker host. Ports bind to localhost by default; set `BIND_ADDRESS` to a trusted interface for LAN access, or use a reverse proxy with HTTPS.

The initial login is `admin` / `admin`. Change its password immediately in user settings before granting network access. Set `PUID` and `PGID` for the container user.

Named volumes retain internal application state across container upgrades. Keep a backup before updating images; `docker compose down -v` deletes named volume data.

Upstream: [installation and configuration](https://docs.linuxserver.io/images/docker-grocy/).
