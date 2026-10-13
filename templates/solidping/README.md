# SolidPing

Uptime and synthetic monitoring with status pages, incidents and on-call alerts.

## Deployment

Copy `.env.example` to `.env`, adjust the settings, then deploy with `docker compose up -d` or import this template in Arcane. Open `http://localhost:4000` on the Docker host. Ports bind to localhost by default; set `BIND_ADDRESS` to a trusted interface for LAN access, or use a reverse proxy with HTTPS. Set `BASE_URL` to the address people use to reach it, since it is used in links and notifications.

The first login is `admin@solidping.io` / `solidpass` in the `default` organization, and you are asked to set a new password right away. The SQLite database and uploads live in the `data` named volume; no other service is needed. PostgreSQL is optional, see the configuration docs.

Named volumes retain internal application state across container upgrades. Keep a backup before updating images; `docker compose down -v` deletes named volume data.

Upstream: [Docker installation](https://docs.solidping.io/docs/installation/docker) and [source](https://github.com/fclairamb/solidping).
