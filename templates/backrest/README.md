# Backrest

Restic backup management with schedules, snapshots, and restore tools.

Copy `.env.example` to `.env`, adjust the settings, then deploy with `docker compose up -d` or import this template in Arcane. Open `http://localhost:9898` on the Docker host. Ports bind to localhost by default; set `BIND_ADDRESS` to a trusted interface for LAN access, or use a reverse proxy with HTTPS.

Create the source and repository directories before deployment. Complete the first-run setup and enable authentication before exposing the UI. Add a repository at `/repos/<name>` or a remote backend, set its encryption password, and create plans for `/userdata`. Source data is read-only; repository storage is writable. Restore to a separate writable target rather than the source mount.

Named volumes retain internal application state across container upgrades. Keep a backup before updating images; `docker compose down -v` deletes named volume data.

Upstream: [installation and configuration](https://github.com/garethgeorge/backrest#docker).
